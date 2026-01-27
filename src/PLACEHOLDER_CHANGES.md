# AirWatch - Placeholder Data Implementation

## Overview

The AirWatch application has been updated to remove mock city data and replace it with placeholders, making it easier to integrate Google's Geocoding API and Air Quality API.

## What Changed

### 1. LocationContext (`/components/LocationContext.tsx`)
- **Removed**: Hardcoded list of 20 global cities
- **Added**: Single placeholder location with coordinates (0, 0)
- **Added**: `setAvailableLocations` function to dynamically update locations
- **Added**: Comprehensive API integration comments explaining how to use Google APIs

### 2. LocationSelector (`/components/LocationSelector.tsx`)
- **Updated**: Now displays placeholder text when no locations are available
- **Added**: Detailed comments showing where to add Geocoding API search functionality
- **Updated**: Conditional rendering for country badge

### 3. Air Quality Data (`/utils/airQualityData.ts`)
- **Removed**: All location-specific pollution profiles (Beijing, Delhi, London, etc.)
- **Replaced**: Single generic placeholder profile for all locations
- **Added**: Extensive comments with example API integration code
- **Added**: Example function showing how to call Google Air Quality API

### 4. Air Quality Map (`/components/AirQualityMap.tsx`)
- **Added**: Filter to hide placeholder location from map display
- **Added**: Empty state message when no locations are added
- **Updated**: Map description to reflect search-based functionality

### 5. New Files
- **`API_INTEGRATION_GUIDE.md`**: Complete step-by-step guide for integrating Google APIs
- **`PLACEHOLDER_CHANGES.md`**: This document explaining all changes

## Current State

The application now:
- Starts with a placeholder location ("Select Location")
- Shows empty map until locations are searched and added
- Displays generic placeholder air quality data
- Is ready for API integration without needing to remove hardcoded data

## Next Steps for Integration

1. **Get Google API Keys**:
   - Enable Geocoding API in Google Cloud Console
   - Enable Air Quality API in Google Cloud Console
   - Create and copy API keys

2. **Implement Location Search**:
   - Add search handler in `LocationSelector.tsx`
   - Call Geocoding API when user types
   - Update `availableLocations` with search results

3. **Fetch Real Air Quality Data**:
   - Implement `fetchAirQualityFromGoogle()` in `airQualityData.ts`
   - Call Air Quality API with selected location coordinates
   - Replace placeholder data with real API responses

4. **Test**:
   - Search for cities (e.g., "Paris", "Tokyo")
   - Verify coordinates are correct
   - Check that air quality data displays properly

## Key Integration Points

### Search for Locations
File: `/components/LocationSelector.tsx`  
Look for: `/* API INTEGRATION POINT */` comments  
Action: Add Geocoding API call in `CommandInput` onChange handler

### Fetch Air Quality Data
File: `/utils/airQualityData.ts`  
Look for: `PLACEHOLDER` comments  
Action: Replace `generateAirQualityData()` with API calls

### Display Results
Files: All dashboard components  
Action: Data will automatically update once API integration is complete

## Data Structure

### Location Object
```typescript
{
  id: string;          // Unique identifier (use place_id from Google)
  name: string;        // City name
  country: string;     // Country name
  coordinates: {
    lat: number;       // Latitude from Geocoding API
    lng: number;       // Longitude from Geocoding API
  };
  timezone: string;    // Optional: timezone string
}
```

### Air Quality Data
```typescript
{
  currentAQI: number;           // Overall AQI value
  temperature: number;          // From weather API (optional)
  humidity: number;             // From weather API (optional)
  windSpeed: number;            // From weather API (optional)
  pollutants: {
    pm25: number;               // Particulate matter 2.5
    pm10: number;               // Particulate matter 10
    o3: number;                 // Ozone
    no2: number;                // Nitrogen dioxide
    so2: number;                // Sulfur dioxide
    co: number;                 // Carbon monoxide
  }
}
```

## Testing Without API

The application currently works with placeholder data, so you can:
- Test the UI and navigation
- Verify component rendering
- Check responsive design
- Ensure all pages load correctly

The placeholder location will show generic air quality data that changes slightly over time to simulate real conditions.

## Documentation

See **`API_INTEGRATION_GUIDE.md`** for detailed instructions on:
- Setting up Google Cloud Console
- Getting API keys
- Code examples for integration
- Error handling
- Best practices

## Questions?

If you need help with:
- API integration
- Understanding the placeholder structure
- Modifying data flows
- Adding new features

Refer to the inline comments in the code marked with `PLACEHOLDER` or `API INTEGRATION POINT`.
