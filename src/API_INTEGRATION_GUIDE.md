# Google API Integration Guide for AirWatch

This document provides step-by-step instructions for integrating Google's Geocoding API and Air Quality API into your AirWatch application.

## Prerequisites

1. **Google Cloud Account**: Create an account at [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Search for and enable "Geocoding API"
   - Search for and enable "Air Quality API"
3. **Get API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key (keep it secure!)

## Integration Points

### 1. LocationSelector Component (`/components/LocationSelector.tsx`)

**Purpose**: Search for locations and populate available locations

**Implementation**:
```typescript
// Add this function to LocationSelector.tsx
async function handleLocationSearch(query: string) {
  if (query.length < 3) return;
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=YOUR_API_KEY`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      const locations = data.results.slice(0, 5).map((result: any) => {
        const cityName = result.address_components.find((c: any) => 
          c.types.includes('locality')
        )?.long_name || result.formatted_address;
        
        const country = result.address_components.find((c: any) => 
          c.types.includes('country')
        )?.long_name || 'Unknown';
        
        return {
          id: `${result.place_id}`,
          name: cityName,
          country: country,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          timezone: 'UTC' // You can use another API to get timezone if needed
        };
      });
      
      setAvailableLocations(locations);
    }
  } catch (error) {
    console.error('Error fetching locations:', error);
  }
}

// Add onChange to CommandInput
<CommandInput 
  placeholder="Search cities or regions..." 
  className="h-9"
  onChange={(e) => handleLocationSearch(e.target.value)}
/>
```

### 2. Air Quality Data Fetching (`/utils/airQualityData.ts`)

**Purpose**: Replace mock data with real air quality data from Google

**Implementation**:
```typescript
// Add this function to airQualityData.ts
export async function fetchAirQualityFromGoogle(lat: number, lng: number) {
  const API_KEY = 'YOUR_GOOGLE_AIR_QUALITY_API_KEY';
  
  try {
    const response = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: { latitude: lat, longitude: lng }
        })
      }
    );
    
    const data = await response.json();
    
    // Extract AQI
    const universalAqi = data.indexes?.find((idx: any) => idx.code === 'uaqi');
    const currentAQI = universalAqi?.aqi || 0;
    
    // Extract pollutants
    const getPollutant = (code: string) => {
      const pollutant = data.pollutants?.find((p: any) => p.code === code);
      return pollutant?.concentration?.value || 0;
    };
    
    return {
      currentAQI,
      pollutants: {
        pm25: getPollutant('pm25'),
        pm10: getPollutant('pm10'),
        o3: getPollutant('o3'),
        no2: getPollutant('no2'),
        so2: getPollutant('so2'),
        co: getPollutant('co'),
      },
      temperature: 20, // Use weather API for this
      humidity: 50,     // Use weather API for this
      windSpeed: 10     // Use weather API for this
    };
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    // Return placeholder data on error
    return generateAirQualityData({ id: '', name: '', country: '', coordinates: { lat, lng }, timezone: 'UTC' });
  }
}

// Update generateAirQualityData to use the API
export async function generateAirQualityData(location: Location) {
  // If location has valid coordinates, fetch from API
  if (location.coordinates.lat !== 0 && location.coordinates.lng !== 0) {
    const apiData = await fetchAirQualityFromGoogle(
      location.coordinates.lat, 
      location.coordinates.lng
    );
    return {
      ...apiData,
      profile: { baseAQI: apiData.currentAQI, variation: 0, pm25Multiplier: 1, pollutionLevel: 'moderate' as const }
    };
  }
  
  // Otherwise return placeholder data
  // ... existing placeholder code ...
}
```

### 3. Update LocationContext to Trigger API Calls

**In `/components/LocationContext.tsx`**:
```typescript
// When location is selected, trigger air quality fetch
export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<Location>(placeholderLocation);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([placeholderLocation]);
  
  // Add effect to fetch air quality when location changes
  useEffect(() => {
    if (selectedLocation.id !== 'placeholder') {
      // Trigger air quality data fetch
      fetchAirQualityFromGoogle(
        selectedLocation.coordinates.lat,
        selectedLocation.coordinates.lng
      ).then(data => {
        // Update any global state with this data if needed
        console.log('Air quality data:', data);
      });
    }
  }, [selectedLocation]);
  
  // ... rest of the code
}
```

## Environment Variables (Recommended)

Instead of hardcoding API keys, use environment variables:

1. Create a `.env` file in your project root:
```
VITE_GOOGLE_GEOCODING_API_KEY=your_geocoding_api_key_here
VITE_GOOGLE_AIR_QUALITY_API_KEY=your_air_quality_api_key_here
```

2. Use in your code:
```typescript
const GEOCODING_API_KEY = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY;
const AIR_QUALITY_API_KEY = import.meta.env.VITE_GOOGLE_AIR_QUALITY_API_KEY;
```

## Testing Your Integration

1. **Test Geocoding**:
   - Open the location selector
   - Type "Paris" - should show Paris, France with coordinates
   - Type "Tokyo" - should show Tokyo, Japan with coordinates

2. **Test Air Quality**:
   - Select a location from search results
   - Dashboard should display real AQI values
   - Check browser console for any errors

3. **Verify Data**:
   - Compare AQI values with official sources like [IQAir](https://www.iqair.com/)
   - Ensure pollutant values are reasonable

## Error Handling

Add proper error handling for:
- API rate limits
- Network failures
- Invalid responses
- Missing data

Example:
```typescript
try {
  // API call
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly error message
  // Fall back to placeholder data
}
```

## API Quotas and Costs

- **Geocoding API**: Check pricing at [Google Geocoding Pricing](https://developers.google.com/maps/documentation/geocoding/usage-and-billing)
- **Air Quality API**: Check pricing at [Google Air Quality Pricing](https://developers.google.com/maps/documentation/air-quality/usage-and-billing)

Consider implementing:
- Request caching to reduce API calls
- Rate limiting on search input
- Data caching with expiry times

## Next Steps

1. Replace all `YOUR_API_KEY` placeholders with your actual API keys
2. Test the Geocoding API integration first
3. Then add Air Quality API integration
4. Add error handling and loading states
5. Implement caching for better performance
6. Add historical data fetching if available from the API

## Additional Resources

- [Google Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Google Air Quality API Documentation](https://developers.google.com/maps/documentation/air-quality)
- [React Query](https://tanstack.com/query/latest) - Recommended for API data fetching and caching
