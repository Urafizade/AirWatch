import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from './LocationContext';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Check, ChevronsUpDown, MapPin, Globe } from 'lucide-react';
import { cn } from './ui/utils';

export function LocationSelector() {
  const { selectedLocation, setSelectedLocation, availableLocations, setAvailableLocations } = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const cacheRef = useRef(new Map<string, any>());
  const debounceRef = useRef<number | null>(null);
  // Use a direct ref to the plain input we'll render below and focus it when the popover opens.
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try {
        inputRef.current?.focus();
      } catch (e) {
        // ignore
      }
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  const handleLocationSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 3) return;
      const key = String(import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY || '');
      if (!key) {
        console.warn('VITE_GOOGLE_GEOCODING_API_KEY is not set. See .env.example');
        return;
      }

      // Check cache first
      if (cacheRef.current.has(query)) {
        const cached = cacheRef.current.get(query);
        if (cached && Array.isArray(cached)) {
          try {
            setAvailableLocations(cached);
          } catch (e) {
            // ignore
          }
        }
        return;
      }

      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          query
        )}&key=${key}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== 'OK' || !Array.isArray(data.results)) {
          return;
        }

        const locations = data.results.slice(0, 6).map((result: any) => {
          const comps = result.address_components || [];
          const cityName = comps.find((c: any) => c.types.includes('locality'))?.long_name
            || comps.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name
            || result.formatted_address;
          const country = comps.find((c: any) => c.types.includes('country'))?.long_name || 'Unknown';

          return {
            id: String(result.place_id),
            name: cityName,
            country,
            coordinates: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            },
            timezone: 'UTC'
          };
        });

        cacheRef.current.set(query, locations);
        // update available locations via hook setter
        try {
          // call setter from the closure scope
          // (we'll rely on the hook variable setAvailableLocations)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          setAvailableLocations(locations);
        } catch (err) {
          // ignore if setter not available in this closure for some reason
          // (defensive, but normally setAvailableLocations exists)
          console.warn('Could not update available locations', err);
        }
      } catch (error) {
        console.error('Error fetching geocoding results:', error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [/* depend on setAvailableLocations via closure */]
  );

  const groupedLocations = availableLocations.reduce((acc, location) => {
    if (!acc[location.country]) {
      acc[location.country] = [];
    }
    acc[location.country].push(location);
    return acc;
  }, {} as Record<string, typeof availableLocations>);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>Monitoring:</span>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-64 justify-between"
            onClick={() => setOpen(true)}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{selectedLocation.name}</span>
              {selectedLocation.country !== 'N/A' && (
                <Badge variant="secondary" className="text-xs">
                  {selectedLocation.country}
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0">
          <Command>
            {/* Plain input instead of CommandInput to avoid cmdk ref-forwarding issues */}
            <div data-slot="command-input-wrapper" className="flex h-9 items-center gap-2 border-b px-3">
              <input
                data-slot="command-input"
                ref={inputRef}
                placeholder="Search cities or regions..."
                className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                value={query}
                onChange={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  setQuery(value);
                  // Debounce user input to reduce API calls
                  if (debounceRef.current) window.clearTimeout(debounceRef.current);
                  debounceRef.current = window.setTimeout(() => {
                    handleLocationSearch(value);
                  }, 300);
                }}
              />
            </div>
            <CommandEmpty>
              {availableLocations.length === 1 && availableLocations[0].id === 'placeholder' 
                ? 'Start typing to search for a location...' 
                : 'No locations found.'}
            </CommandEmpty>
            <CommandList className="max-h-80">
              {Object.entries(groupedLocations).map(([country, locations]) => (
                <CommandGroup key={country} heading={country}>
                  {locations.map((location) => (
                    <CommandItem
                      key={location.id}
                      value={`${location.name} ${location.country}`}
                      onSelect={() => {
                        // set selected location (contains coordinates)
                        setSelectedLocation(location);
                        // update the input to the selected name
                        setQuery(location.name);
                        // reduce dropdown to the selected item
                        setAvailableLocations([location]);
                        setOpen(false);
                        /* 
                         * API INTEGRATION POINT:
                         * - After setSelectedLocation, call Google Air Quality API
                         * - Use location.coordinates.lat and location.coordinates.lng
                         * - Fetch current air quality data
                         * 
                         * Example:
                         * fetchAirQualityData(location.coordinates.lat, location.coordinates.lng)
                         */
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{location.name}</span>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            selectedLocation.id === location.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

  
