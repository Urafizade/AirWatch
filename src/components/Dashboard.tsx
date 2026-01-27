import { useLocation } from './LocationContext';
import { generateAirQualityData } from '../utils/airQualityData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertTriangle, Thermometer, Droplets, Wind, MapPin, Clock } from 'lucide-react';

// Custom pollutant progress bar with WHO-based color coding
function PollutantProgress({ value, whoGuideline }: { value?: number; whoGuideline: number }) {
  const getColorClasses = () => {
    if (value === undefined) return 'bg-gray-300';
    const ratio = value / whoGuideline;
    if (ratio <= 1) {
      return 'bg-green-500';
    } else if (ratio <= 2) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  const percentage = value === undefined ? 0 : Math.min((value / (whoGuideline * 3)) * 100, 100);

  return (
    <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
      {value === undefined ? (
        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">N/A</div>
      ) : (
        <div
          className={`${getColorClasses()} h-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      )}
    </div>
  );
}

/* Dev injector removed */

export function Dashboard() {
  const { selectedLocation, airQuality, airQualityLoading } = useLocation();

  // If we have real API data use it; otherwise fall back to generated placeholder data
  const isUsingApi = !!airQuality;
  const fallback = generateAirQualityData(selectedLocation);

  const airQualityData = airQuality ?? fallback;

  const currentAQI = airQualityData.currentAQI ?? 0;
  const temperature = airQualityData.temperature ?? fallback.temperature;
  // some API responses put feelsLikeTemperature on the parsed object; fallback generator doesn't include it
  const feelsLike = (airQualityData as any)?.feelsLikeTemperature ?? undefined;
  const humidity = Math.round((airQualityData.humidity ?? fallback.humidity) || 0);
  const windSpeed = Math.round((airQualityData.windSpeed ?? fallback.windSpeed) || 0);

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { status: 'Good', color: 'bg-green-500', variant: 'default' as const };
    if (aqi <= 100) return { status: 'Moderate', color: 'bg-yellow-500', variant: 'secondary' as const };
    if (aqi <= 150) return { status: 'Unhealthy', color: 'bg-orange-500', variant: 'destructive' as const };
    return { status: 'Very Unhealthy', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const aqiStatus = getAQIStatus(currentAQI);

  // WHO guidelines for pollutants
  const whoGuidelines = {
    pm25: 15,    // μg/m³ (24-hour mean, interim target-3)
    pm10: 45,    // μg/m³ (24-hour mean, interim target-3)
    o3: 100,     // μg/m³ (8-hour mean)
    no2: 25,     // μg/m³ (24-hour mean)
    so2: 40,     // μg/m³ (24-hour mean)
    co: 4,       // mg/m³ (24-hour mean)
  };

  const getPollutantStatus = (value: number | undefined, guideline: number) => {
    if (value === undefined) return 'N/A';
    const ratio = value / guideline;
    if (ratio <= 1) return 'Good';
    if (ratio <= 2) return 'Moderate';
    return 'Unhealthy';
  };

  // If the API attached pollutantUnits, prefer those units for display
  const apiUnits = (airQualityData as any)?.pollutantUnits ?? {};
  const pollutants = [
    {
      name: 'PM2.5',
      value: airQualityData.pollutants?.pm25,
      unit: apiUnits.pm25 ?? 'μg/m³',
      whoGuideline: whoGuidelines.pm25,
      status: getPollutantStatus(airQualityData.pollutants?.pm25, whoGuidelines.pm25)
    },
    {
      name: 'PM10',
      value: airQualityData.pollutants?.pm10,
      unit: apiUnits.pm10 ?? 'μg/m³',
      whoGuideline: whoGuidelines.pm10,
      status: getPollutantStatus(airQualityData.pollutants?.pm10, whoGuidelines.pm10)
    },
    {
      name: 'O3',
      value: airQualityData.pollutants?.o3,
      unit: apiUnits.o3 ?? 'μg/m³',
      whoGuideline: whoGuidelines.o3,
      status: getPollutantStatus(airQualityData.pollutants?.o3, whoGuidelines.o3)
    },
    {
      name: 'NO2',
      value: airQualityData.pollutants?.no2,
      unit: apiUnits.no2 ?? 'μg/m³',
      whoGuideline: whoGuidelines.no2,
      status: getPollutantStatus(airQualityData.pollutants?.no2, whoGuidelines.no2)
    },
    {
      name: 'SO2',
      value: airQualityData.pollutants?.so2,
      unit: apiUnits.so2 ?? 'μg/m³',
      whoGuideline: whoGuidelines.so2,
      status: getPollutantStatus(airQualityData.pollutants?.so2, whoGuidelines.so2)
    },
    {
      name: 'CO',
      value: airQualityData.pollutants?.co,
      unit: apiUnits.co ?? 'mg/m³',
      whoGuideline: whoGuidelines.co,
      status: getPollutantStatus(airQualityData.pollutants?.co, whoGuidelines.co)
    },
  ];

  // Debug: if live data present but pollutant values are all zero, expose raw response for inspection
  // Consider pollutants empty only if all are missing (null/undefined)
  const liveButEmptyPollutants = !!airQuality && pollutants.every(p => p.value == null);

  // Get current time in location's timezone
  const getCurrentTime = () => {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: selectedLocation.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Show loading indicator when fetching live air quality */}
      {airQualityLoading && (
        <div className="p-2 rounded bg-yellow-50 text-sm text-yellow-800">Fetching latest air quality data...</div>
      )}
      {liveButEmptyPollutants && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug: Raw Air Quality Response</CardTitle>
            <p className="text-xs text-muted-foreground mt-2">API returned data but pollutant values could not be mapped. Raw response:</p>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-xs max-h-48 overflow-auto">{JSON.stringify(airQuality.raw ?? airQuality, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {/* Dev injector removed */}
      {/* Location Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">{selectedLocation.name}, {selectedLocation.country}</h3>
                <p className="text-sm text-muted-foreground">
                  Coordinates: {selectedLocation.coordinates.lat.toFixed(2)}°, {selectedLocation.coordinates.lng.toFixed(2)}°
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Local time: {getCurrentTime()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current AQI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current AQI</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${
                currentAQI <= 50 ? 'text-green-600' :
                currentAQI <= 100 ? 'text-yellow-600' :
                'text-red-600'
              }`}>{currentAQI}</div>
              <Badge variant={aqiStatus.variant}>{aqiStatus.status}</Badge>
              <Progress value={(currentAQI / 200) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{temperature}°C</div>
            {feelsLike !== undefined ? (
              <p className="text-xs text-muted-foreground">Feels like {feelsLike}°C</p>
            ) : (
              <p className="text-xs text-muted-foreground">Feels like —</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{humidity}%</div>
            <Progress value={humidity} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wind Speed</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{windSpeed} km/h</div>
            <p className="text-xs text-muted-foreground">Direction: NW</p>
          </CardContent>
        </Card>
      </div>

      {/* Pollutant Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Current Pollutant Levels</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Real-time measurements of major air pollutants affecting your location's air quality.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pollutants.map((pollutant) => (
              <div key={pollutant.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{pollutant.name}</span>
                  <Badge variant="outline">{pollutant.status}</Badge>
                </div>
                {pollutant.value === undefined ? (
                  <div className="text-lg font-bold">N/A</div>
                ) : (
                  <div className="text-lg font-bold">{Number(pollutant.value).toFixed(2)} {pollutant.unit}</div>
                )}
                <PollutantProgress 
                  value={pollutant.value}
                  whoGuideline={pollutant.whoGuideline}
                />
                <p className="text-xs text-muted-foreground">
                  WHO guideline: {pollutant.whoGuideline} {pollutant.unit}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Health Recommendations for {selectedLocation.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Personalized health and activity recommendations based on current air quality conditions.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              currentAQI <= 50 ? 'bg-green-50 border-green-200' :
              currentAQI <= 100 ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                currentAQI <= 50 ? 'text-green-600' :
                currentAQI <= 100 ? 'text-yellow-600' :
                'text-red-600'
              }`} />
              <div>
                <p className={`font-medium ${
                  currentAQI <= 50 ? 'text-green-800' :
                  currentAQI <= 100 ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {aqiStatus.status} Air Quality
                </p>
                <p className={`text-sm ${
                  currentAQI <= 50 ? 'text-green-700' :
                  currentAQI <= 100 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {currentAQI <= 50 
                    ? 'Air quality is good. Perfect for outdoor activities.'
                    : currentAQI <= 100 
                    ? 'Sensitive individuals should consider reducing prolonged outdoor activities.'
                    : 'Everyone should limit outdoor activities. Consider staying indoors.'
                  }
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <h4 className="font-medium">Outdoor Activities</h4>
                <p className="text-sm text-muted-foreground">
                  {currentAQI <= 50 
                    ? 'Excellent conditions for all outdoor activities including exercise and sports.'
                    : currentAQI <= 100 
                    ? 'Moderate risk for sensitive individuals. Consider indoor alternatives for extended activities.'
                    : 'High risk for everyone. Avoid outdoor exercise and limit time outside.'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Windows & Ventilation</h4>
                <p className="text-sm text-muted-foreground">
                  {currentAQI <= 50 
                    ? 'Safe to keep windows open for natural ventilation.'
                    : currentAQI <= 100 
                    ? 'Consider keeping windows closed during peak pollution hours (6-10 AM, 7-9 PM).'
                    : 'Keep windows closed and use air purifiers if available.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}