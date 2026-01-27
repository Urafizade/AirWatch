import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchAirQualityFromGoogle } from '../utils/airQualityData';

export interface Location {
  id: string;
  name: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
}

interface LocationContextType {
  selectedLocation: Location;
  setSelectedLocation: (location: Location) => void;
  availableLocations: Location[];
  setAvailableLocations: (locations: Location[]) => void;
  // Latest air quality data for the selected location (null if none / loading)
  airQuality: any | null;
  setAirQuality: (data: any | null) => void;
  airQualityLoading: boolean;
  setAirQualityLoading: (v: boolean) => void;
}

// PLACEHOLDER: This will be replaced with data from Google Geocoding API
const placeholderLocation: Location = {
  id: 'placeholder',
  name: 'Select Location',
  country: 'N/A',
  coordinates: { lat: 0, lng: 0 },
  timezone: 'UTC'
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<Location>(placeholderLocation);
  // PLACEHOLDER: This array will be populated with locations from Google Geocoding API
  // When user searches for a location, call the Geocoding API and add results here
  const [availableLocations, setAvailableLocations] = useState<Location[]>([placeholderLocation]);
  const [airQuality, setAirQuality] = useState<any | null>(null);
  const [airQualityLoading, setAirQualityLoading] = useState<boolean>(false);

  // Fetch air quality data whenever the selected location changes
  useEffect(() => {
    if (!selectedLocation || selectedLocation.id === 'placeholder') return;
    const { lat, lng } = selectedLocation.coordinates;
    if (lat === 0 && lng === 0) return;

    // mark loading
    setAirQualityLoading(true);
    setAirQuality(null);

    fetchAirQualityFromGoogle(lat, lng)
      .then((data) => {
        setAirQuality(data);
      })
      .catch((err) => {
        console.error('Error fetching air quality:', err);
        setAirQuality(null);
      })
      .finally(() => setAirQualityLoading(false));
  }, [selectedLocation]);

  return (
    <LocationContext.Provider 
      value={{ 
        selectedLocation, 
        setSelectedLocation, 
        availableLocations,
        setAvailableLocations
        ,
        airQuality,
        setAirQuality,
        airQualityLoading,
        setAirQualityLoading
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

/* 
 * API INTEGRATION GUIDE:
 * 
 * 1. Google Geocoding API Integration:
 *    - When user searches for a location in LocationSelector
 *    - Call: https://maps.googleapis.com/maps/api/geocode/json?address={searchQuery}&key={YOUR_API_KEY}
 *    - Parse response to extract: city name, country, lat/lng coordinates
 *    - Create Location objects and update availableLocations
 * 
 * 2. Google Air Quality API Integration:
 *    - Once a location is selected (selectedLocation has valid coordinates)
 *    - Call: https://airquality.googleapis.com/v1/currentConditions:lookup?key={YOUR_API_KEY}
 *    - POST body: { "location": { "latitude": lat, "longitude": lng } }
 *    - Response contains AQI values and pollutant data
 *    - Use this data to replace the mock data in airQualityData.ts
 * 
 * 3. Example flow:
 *    a. User types "Paris" in LocationSelector
 *    b. Call Geocoding API to get Paris coordinates (48.8566, 2.3522)
 *    c. Create Location object: { id: 'paris-fr', name: 'Paris', country: 'France', coordinates: {...}, timezone: 'Europe/Paris' }
 *    d. Call Air Quality API with those coordinates
 *    e. Display real air quality data in Dashboard/DetailedStats/etc.
 */
