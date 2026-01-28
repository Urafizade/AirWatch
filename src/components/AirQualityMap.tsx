import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from './LocationContext';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { generateAirQualityData } from '../utils/airQualityData';
import { MapPin, Globe, Zap } from 'lucide-react';

export function AirQualityMap() {
  const { selectedLocation, availableLocations, setSelectedLocation, airQuality } = useLocation();
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  
  // PLACEHOLDER: Filter out the placeholder location from display
  const validLocations = availableLocations.filter(loc => loc.id !== 'placeholder');
  
  // Generate air quality data for all valid locations
  const globalAirQualityData = validLocations.map(location => {
    const data = generateAirQualityData(location);
    return {
      ...location,
      ...data,
      level: data.currentAQI <= 50 ? 'Good' : data.currentAQI <= 100 ? 'Moderate' : data.currentAQI <= 150 ? 'Unhealthy' : 'Very Unhealthy',
      color: data.currentAQI <= 50 ? 'bg-green-500' : data.currentAQI <= 100 ? 'bg-yellow-500' : data.currentAQI <= 150 ? 'bg-orange-500' : 'bg-red-500'
    };
  });

  // Convert coordinates to map position (Web Mercator, aligned to tile layer)
  const TILE_SIZE = 256;
  const ZOOM = 2; // low zoom for global view; adjust as needed

  const worldSize = TILE_SIZE * Math.pow(2, ZOOM);

  const lonLatToWorldPixel = (lng: number, lat: number) => {
    const x = ((lng + 180) / 360) * worldSize;
    const latRad = (lat * Math.PI) / 180;
    // more numerically-stable Web Mercator Y calculation
    const sinLat = Math.sin(latRad);
    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldSize;
    return { x, y };
  };

  const worldPixelToPercent = (px: number, py: number, topLeftPx: { x: number; y: number }, width: number, height: number) => {
    const relX = px - topLeftPx.x;
    const relY = py - topLeftPx.y;
    return { xPct: (relX / width) * 100, yPct: (relY / height) * 100 };
  };

  const worldPixelToLonLat = (x: number, y: number) => {
    const lng = (x / worldSize) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * y) / worldSize;
    const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
    return { lng, lat };
  };

  const currentLocationData = globalAirQualityData.find(loc => loc.id === selectedLocation.id);

  // Heatmap configuration
  const HEATMAP_COLS = 40; // horizontal resolution
  const HEATMAP_ROWS = 20; // vertical resolution

  // We'll fetch coarse AQ tiles from the server-side tile endpoint instead of generating locally.
  const [heatmapTiles, setHeatmapTiles] = useState<Array<{ xPct: number; yPct: number; lat: number; lng: number; aqi: number | null }>>([]);
  const [tilesLoading, setTilesLoading] = useState(false);
  const [tilesError, setTilesError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // We request per-tile images directly from Google heatmap API
  useEffect(() => {
    // keep a light check to know we're attempting to render heatmap tiles
    setTilesLoading(true);
    setTilesError(null);
    setTimeout(() => setTilesLoading(false), 300);
  }, [availableLocations]);

  const aqiToColor = (aqi: number) => {
    if (aqi <= 50) return 'rgba(16,185,129,'; // green
    if (aqi <= 100) return 'rgba(234,179,8,'; // yellow
    if (aqi <= 150) return 'rgba(249,115,22,'; // orange
    return 'rgba(239,68,68,'; // red
  };

  // measure container size for tile rendering
  const [mapSize, setMapSize] = useState({ width: 1000, height: 600 });
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setMapSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    // initial
    setMapSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, [mapRef.current]);

  // compute tile indices to render for current center
  // Use a persistent map center so the heatmap stays visible when selecting locations.
  const [mapCenterState, setMapCenterState] = useState<{ lat: number; lng: number }>(() => ({ lat: 0, lng: 0 }));
  const mapCenter = mapCenterState;
  // Quick pixel nudge to correct visual marker placement when projection/tiling offsets occur.
  // If the selected marker appears too far off, adjust these values (x: right positive, y: down positive).
  const SELECTED_MARKER_NUDGE = { x: 35, y: -63 };
  const centerWorld = lonLatToWorldPixel(mapCenter.lng, mapCenter.lat);
  const topLeftWorld = { x: centerWorld.x - mapSize.width / 2, y: centerWorld.y - mapSize.height / 2 };
  const tileXStart = Math.floor(topLeftWorld.x / TILE_SIZE);
  const tileYStart = Math.floor(topLeftWorld.y / TILE_SIZE);
  const tileXEnd = Math.floor((topLeftWorld.x + mapSize.width) / TILE_SIZE);
  const tileYEnd = Math.floor((topLeftWorld.y + mapSize.height) / TILE_SIZE);
  const tilesToRender: Array<{ x: number; y: number; z: number; left: number; top: number; src: string }> = [];
  const maxTile = Math.pow(2, ZOOM);
  for (let tx = tileXStart; tx <= tileXEnd; tx++) {
    for (let ty = tileYStart; ty <= tileYEnd; ty++) {
      // valid tile y range is 0..maxTile-1; skip if outside
      if (ty < 0 || ty >= maxTile) continue;
      const wrappedX = ((tx % maxTile) + maxTile) % maxTile; // wrap x
      const src = `https://tile.openstreetmap.org/${ZOOM}/${wrappedX}/${ty}.png`;
      const left = tx * TILE_SIZE - topLeftWorld.x;
      const top = ty * TILE_SIZE - topLeftWorld.y;
      tilesToRender.push({ x: tx, y: ty, z: ZOOM, left, top, src });
    }
  }

  // When a location is selected, don't re-center the whole map by default.
  // Instead render a prominent marker for the selected location on top of the heatmap.

  // Fetch and cache heatmap tile images (object URLs) to detect errors and avoid broken-image icons
  const [tileImageMap, setTileImageMap] = useState<Record<string, string | null>>({});
  useEffect(() => {
    let cancelled = false;
    const toFetch = tilesToRender.map(t => ({ z: t.z, x: t.x, y: t.y }));
    const concurrency = 6;
    const queue = [...toFetch];

    const fetchTile = async (item: { z: number; x: number; y: number }) => {
      const key = `${item.z}_${item.x}_${item.y}`;
      if (tileImageMap[key] !== undefined) return; // already fetched or failed
      try {
        const GOOGLE_KEY = String((import.meta as any).env?.VITE_GOOGLE_AIR_QUALITY_API_KEY || '');
        if (!GOOGLE_KEY) {
          setTileImageMap(prev => ({ ...prev, [key]: null }));
          return;
        }
        const tileUrl = `https://airquality.googleapis.com/v1/mapTypes/UAQI_RED_GREEN/heatmapTiles/${item.z}/${item.x}/${item.y}?key=${encodeURIComponent(GOOGLE_KEY)}`;
        const res = await fetch(tileUrl);
        if (!res.ok) {
          setTileImageMap(prev => ({ ...prev, [key]: null }));
          return;
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.startsWith('image')) {
          setTileImageMap(prev => ({ ...prev, [key]: null }));
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setTileImageMap(prev => ({ ...prev, [key]: url }));
      } catch (err) {
        setTileImageMap(prev => ({ ...prev, [key]: null }));
      }
    };

    const runner = async () => {
      const workers: Promise<void>[] = [];
      for (let i = 0; i < concurrency; i++) {
        workers.push((async function worker() {
          while (queue.length > 0 && !cancelled) {
            const item = queue.shift();
            if (!item) break;
            // eslint-disable-next-line no-await-in-loop
            await fetchTile(item);
          }
        })());
      }
      await Promise.all(workers);
    };

    runner();
    return () => {
      cancelled = true;
      // revoke created object URLs
      Object.values(tileImageMap).forEach(v => { if (v) URL.revokeObjectURL(v); });
      setTileImageMap({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tilesToRender.map(t => `${t.z}_${t.x}_${t.y}`).join('|')]);

  return (
    <div className="space-y-6">
      {/* Global Map */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Air Quality Map
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Interactive map showing real-time air quality data. Search for locations to add them to the map and view detailed information.
          </p>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} onClick={async (e) => {
              // click-to-select: compute lat/lng from click position and reverse-geocode via Google API
              try {
                const rect = (mapRef.current as HTMLDivElement).getBoundingClientRect();
                const clickX = (e as any).clientX - rect.left;
                const clickY = (e as any).clientY - rect.top;
                const worldX = topLeftWorld.x + clickX;
                const worldY = topLeftWorld.y + clickY;
                const { lat, lng } = worldPixelToLonLat(worldX, worldY);
                // call Google Geocoding API directly
                const GEOCODING_KEY = String((import.meta as any).env?.VITE_GOOGLE_GEOCODING_API_KEY || '');
                if (!GEOCODING_KEY) {
                  console.warn('Google Geocoding API key not found');
                  return;
                }
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat + ',' + lng)}&key=${encodeURIComponent(GEOCODING_KEY)}`;
                const res = await fetch(url);
                if (!res.ok) {
                  console.warn('Reverse geocode failed', res.status);
                  return;
                }
                const data = await res.json();
                const first = Array.isArray(data.results) ? data.results[0] : null;
                if (!first) {
                  console.warn('No geocoding result found');
                  return;
                }
                const getComponent = (types: string[]) => {
                  const comp = first.address_components?.find((c: any) => c.types?.some((t: string) => types.includes(t)));
                  return comp?.long_name || comp?.short_name || undefined;
                };
                const name = first.formatted_address || getComponent(['locality', 'administrative_area_level_1']) || 'Unknown';
                const country = getComponent(['country']) || '';
                const placeId = first.place_id || `rev-${lat.toFixed(3)}-${lng.toFixed(3)}`;
                const location = {
                  id: placeId,
                  name,
                  country,
                  coordinates: { lat, lng },
                  timezone: 'UTC'
                };
                setSelectedLocation(location);
                setMapCenterState({ lat, lng });
              } catch (err) {
                console.error('click-to-select error', err);
              }
            }} className="relative bg-gradient-to-b from-blue-100 to-green-100 rounded-lg h-[600px] border overflow-hidden">
            {/* Tile layer (OpenStreetMap) */}
            <div className="absolute inset-0">
              {tilesToRender.map((t, i) => (
                <img key={`tileimg-${i}`} src={t.src} alt="" draggable={false}
                  style={{ position: 'absolute', left: `${t.left}px`, top: `${t.top}px`, width: TILE_SIZE, height: TILE_SIZE, userSelect: 'none', zIndex: 1 }}
                />
              ))}
            </div>

            {/* Google Air Quality heatmap tiles aligned to the same tile grid as OSM */}
            {tilesToRender.map((t, i) => {
              const key = `${t.z}_${t.x}_${t.y}`;
              const url = tileImageMap[key];
              if (!url) return null; // not ready or failed
              return (
                <img
                  key={`hm-${i}`}
                  src={url}
                  alt=""
                  draggable={false}
                  style={{ position: 'absolute', left: `${t.left}px`, top: `${t.top}px`, width: TILE_SIZE, height: TILE_SIZE, userSelect: 'none', zIndex: 4, opacity: 0.95, pointerEvents: 'none' }}
                />
              );
            })}

            {/* Air quality monitoring points */}
            {globalAirQualityData.map((location) => {
              const wp = lonLatToWorldPixel(location.coordinates.lng, location.coordinates.lat);
              const posX = wp.x - topLeftWorld.x;
              const posY = wp.y - topLeftWorld.y;
              const isSelected = location.id === selectedLocation.id;
              const isHovered = hoveredCity === location.id;
              
              return (
                <div
                  key={location.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-125 ${location.color} ${isSelected ? 'ring-4 ring-primary ring-offset-2 scale-125' : ''} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center`}
                  style={{ left: `${posX}px`, top: `${posY}px` }}
                  onClick={() => {
                    setSelectedLocation(location);
                    setMapCenterState({ lat: location.coordinates.lat, lng: location.coordinates.lng });
                  }}
                  onMouseEnter={() => setHoveredCity(location.id)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  <span className="text-white text-xs font-bold">{location.currentAQI}</span>
                  
                  {/* Tooltip */}
                  {(isHovered || isSelected) && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                      {location.name}: {location.currentAQI} AQI
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Selected location marker (from search) - simplified red pin anchored by its tip */}
            {selectedLocation && selectedLocation.id !== 'placeholder' && (() => {
              try {
                const wpSel = lonLatToWorldPixel(selectedLocation.coordinates.lng, selectedLocation.coordinates.lat);
                const selX = wpSel.x - topLeftWorld.x;
                const selY = wpSel.y - topLeftWorld.y;

                // Determine AQI for the selected location: prefer context airQuality, fall back to generated data if available
                const selAqi = (airQuality && (airQuality as any).currentAQI) ?? currentLocationData?.currentAQI ?? null;
                const aqiLabel = typeof selAqi === 'number' ? `${selAqi} AQI` : 'N/A';
                const aqiClass = typeof selAqi === 'number'
                  ? selAqi <= 50 ? 'bg-green-600' : selAqi <= 100 ? 'bg-yellow-500' : selAqi <= 150 ? 'bg-orange-500' : 'bg-red-600'
                  : 'bg-gray-400';

                // Render a single red pin whose bottom tip lines up with the exact coord.
                // Use an inline transform so we can nudge the pin a few pixels to ensure the tip matches precisely.
                return (
                  <div
                    key={`selected-${selectedLocation.id}`}
                    style={{ left: `${selX + SELECTED_MARKER_NUDGE.x}px`, top: `${selY + SELECTED_MARKER_NUDGE.y}px` }}
                    className="absolute transform -translate-x-1/2 -translate-y-full z-50 pointer-events-auto"
                  >
                    {/* Name + AQI label above the pin (keeps the UI informative without the old tic-tac) */}
                    <div className="mb-1 flex items-center justify-center">
                      <div className="bg-white/95 rounded-md px-2 py-0.5 shadow-sm text-sm font-medium flex items-center gap-2 max-w-xs">
                        <span className="truncate">{selectedLocation.name}</span>
                        <span className={`text-white text-xs font-semibold px-2 py-0.5 rounded ${aqiClass}`}>{aqiLabel}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedLocation(selectedLocation)}
                      aria-label={`Selected location ${selectedLocation.name}`}
                      className="p-0 m-0 bg-transparent border-0 cursor-pointer"
                    >
                      <svg width="36" height="48" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        {/* Outer pin shape (Google-style red) */}
                        <path fill="#DB4437" d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z"/>
                        {/* Inner white dot */}
                        <circle cx="12" cy="9" r="3" fill="#FFFFFF"/>
                      </svg>
                    </button>
                  </div>
                );
              } catch (err) {
                return null;
              }
            })()}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AQI Levels
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Good (0-50)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Moderate (51-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Unhealthy (101-150)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Very Unhealthy (150+)</span>
                </div>
              </div>
            </div>

            {/* Most/Least Polluted Cities */}
            {globalAirQualityData.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
                <h4 className="font-medium mb-2">Today's Extremes</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-red-600 font-medium">Most Polluted:</span>
                    <br />
                    {globalAirQualityData.sort((a, b) => b.currentAQI - a.currentAQI)[0]?.name} ({globalAirQualityData.sort((a, b) => b.currentAQI - a.currentAQI)[0]?.currentAQI} AQI)
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Cleanest:</span>
                    <br />
                    {globalAirQualityData.sort((a, b) => a.currentAQI - b.currentAQI)[0]?.name} ({globalAirQualityData.sort((a, b) => a.currentAQI - b.currentAQI)[0]?.currentAQI} AQI)
                  </div>
                </div>
              </div>
            )}

            {/* Empty state message */}
            {globalAirQualityData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium mb-2">No Locations Added</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for a city or region using the location selector above to start monitoring air quality data.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const pollutedCities = globalAirQualityData.filter(loc => loc.currentAQI > 100);
              if (pollutedCities.length > 0) {
                setSelectedLocation(pollutedCities[Math.floor(Math.random() * pollutedCities.length)]);
              }
            }}>
              <MapPin className="h-4 w-4 mr-1" />
              View High Pollution Areas
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const cleanCities = globalAirQualityData.filter(loc => loc.currentAQI <= 50);
              if (cleanCities.length > 0) {
                setSelectedLocation(cleanCities[Math.floor(Math.random() * cleanCities.length)]);
              }
            }}>
              <Globe className="h-4 w-4 mr-1" />
              View Clean Air Cities
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}