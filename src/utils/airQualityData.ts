import { Location } from '../components/LocationContext';

/* 
 * PLACEHOLDER DATA - TO BE REPLACED WITH GOOGLE AIR QUALITY API
 * 
 * This file generates mock air quality data for display purposes.
 * Once you integrate the Google Air Quality API, replace these functions
 * with actual API calls.
 * 
 * Google Air Quality API endpoint:
 * POST https://airquality.googleapis.com/v1/currentConditions:lookup?key=YOUR_API_KEY
 * 
 * Request body:
 * {
 *   "location": {
 *     "latitude": location.coordinates.lat,
 *     "longitude": location.coordinates.lng
 *   }
 * }
 * 
 * The API returns:
 * - indexes[].aqi (Air Quality Index)
 * - pollutants[] (PM2.5, PM10, O3, NO2, SO2, CO values)
 * - healthRecommendations
 * 
 * Replace the return values of these functions with the API response data.
 */

// PLACEHOLDER: Generic air quality profile (will be replaced with API data)
const getPlaceholderProfile = () => ({
  baseAQI: 75,
  variation: 25,
  pm25Multiplier: 1.0,
  pollutionLevel: 'moderate' as const
});

export function generateAirQualityData(location: Location) {
  // PLACEHOLDER: This should be replaced with actual API call
  // Example: const apiData = await fetchAirQualityFromGoogle(location.coordinates.lat, location.coordinates.lng);
  
  const profile = getPlaceholderProfile();

  // Time-based variations (simulate daily pollution cycles)
  const now = new Date();
  const hour = now.getHours();
  const timeMultiplier = getTimeMultiplier(hour);
  
  // PLACEHOLDER: These values should come from Google Air Quality API response
  const currentAQI = Math.max(10, Math.floor(profile.baseAQI * timeMultiplier + (Math.random() - 0.5) * profile.variation));
  
  return {
    currentAQI, // Replace with: apiData.indexes[0].aqi
    temperature: generateTemperature(location), // Can use weather API or keep as is
    humidity: 45 + Math.random() * 40, // Can use weather API or keep as is
    windSpeed: 5 + Math.random() * 20, // Can use weather API or keep as is
    pollutants: {
      // Replace these with actual values from API response pollutants array
      pm25: Math.max(5, Math.floor(currentAQI * 0.6 * profile.pm25Multiplier)), // apiData.pollutants.find(p => p.code === 'pm25').concentration.value
      pm10: Math.max(10, Math.floor(currentAQI * 0.8 * profile.pm25Multiplier)), // apiData.pollutants.find(p => p.code === 'pm10').concentration.value
      o3: Math.max(20, Math.floor(50 + Math.random() * 60)), // apiData.pollutants.find(p => p.code === 'o3').concentration.value
      no2: Math.max(5, Math.floor(15 + Math.random() * 40)), // apiData.pollutants.find(p => p.code === 'no2').concentration.value
      so2: Math.max(1, Math.floor(5 + Math.random() * 20)), // apiData.pollutants.find(p => p.code === 'so2').concentration.value
      co: Math.max(0.1, parseFloat((0.5 + Math.random() * 2).toFixed(1))) // apiData.pollutants.find(p => p.code === 'co').concentration.value
    },
    profile
  };
}

export function generateHourlyData(location: Location) {
  // PLACEHOLDER: This should be replaced with historical API call or forecast data
  const profile = getPlaceholderProfile();

  const data = [];
  for (let i = 0; i < 24; i++) {
    const timeMultiplier = getTimeMultiplier(i);
    const aqi = Math.max(10, Math.floor(profile.baseAQI * timeMultiplier + (Math.random() - 0.5) * profile.variation));
    
    data.push({
      time: `${i.toString().padStart(2, '0')}:00`,
      aqi, // Replace with API data
      pm25: Math.max(5, Math.floor(aqi * 0.6 * profile.pm25Multiplier)),
      pm10: Math.max(10, Math.floor(aqi * 0.8 * profile.pm25Multiplier))
    });
  }
  return data;
}

export function generateWeeklyData(location: Location) {
  // PLACEHOLDER: This should be replaced with historical API data
  const profile = getPlaceholderProfile();

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    aqi: Math.max(10, Math.floor(profile.baseAQI + (Math.random() - 0.5) * profile.variation)),
    avgTemp: generateTemperature(location, 0.8)
  }));
}

export function generateHistoricalData(location: Location, timeRange: string) {
  // PLACEHOLDER: This should be replaced with historical API data
  const profile = getPlaceholderProfile();

  const now = new Date();
  const data = [];
  
  if (timeRange === '7days') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const aqi = Math.max(10, Math.floor(profile.baseAQI + (Math.random() - 0.5) * profile.variation));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aqi,
        pm25: Math.max(5, Math.floor(aqi * 0.6 * profile.pm25Multiplier)),
        pm10: Math.max(10, Math.floor(aqi * 0.8 * profile.pm25Multiplier)),
        o3: Math.max(20, Math.floor(50 + Math.random() * 60)),
      });
    }
  } else if (timeRange === '30days') {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const aqi = Math.max(10, Math.floor(profile.baseAQI + (Math.random() - 0.5) * profile.variation * 1.5));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aqi,
        pm25: Math.max(5, Math.floor(aqi * 0.6 * profile.pm25Multiplier)),
        pm10: Math.max(10, Math.floor(aqi * 0.8 * profile.pm25Multiplier)),
        o3: Math.max(20, Math.floor(50 + Math.random() * 60)),
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const aqi = Math.max(10, Math.floor(profile.baseAQI + (Math.random() - 0.5) * profile.variation * 2));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        aqi,
        pm25: Math.max(5, Math.floor(aqi * 0.6 * profile.pm25Multiplier)),
        pm10: Math.max(10, Math.floor(aqi * 0.8 * profile.pm25Multiplier)),
        o3: Math.max(20, Math.floor(50 + Math.random() * 60)),
      });
    }
  }
  
  return data;
}

function getTimeMultiplier(hour: number): number {
  // Simulate daily pollution patterns
  // Higher in morning (6-9) and evening (17-20) rush hours
  // Lower at night and midday
  if (hour >= 6 && hour <= 9) return 1.3; // Morning rush
  if (hour >= 17 && hour <= 20) return 1.4; // Evening rush
  if (hour >= 22 || hour <= 5) return 0.7; // Night time
  return 1.0; // Regular hours
}

function generateTemperature(location: Location, variation: number = 1): number {
  // Simple temperature simulation based on latitude and season
  // Can be replaced with weather API data if needed
  const lat = Math.abs(location.coordinates.lat);
  const month = new Date().getMonth();
  
  // Base temperature ranges by latitude
  let baseTemp = 25; // Tropical default
  if (lat > 60) baseTemp = 5;      // Arctic
  else if (lat > 45) baseTemp = 15; // Temperate cold
  else if (lat > 30) baseTemp = 20; // Temperate
  else if (lat > 23) baseTemp = 25; // Subtropical
  
  // Seasonal variation (simplified)
  const seasonalVariation = Math.sin((month - 3) * Math.PI / 6) * 10;
  const randomVariation = (Math.random() - 0.5) * 10 * variation;
  
  return Math.round(baseTemp + seasonalVariation + randomVariation);
}

export function getLocationAlerts(location: Location) {
  // PLACEHOLDER: This should be replaced with actual alerts from API or monitoring system
  const { currentAQI, pollutants, profile } = generateAirQualityData(location);
  const alerts = [];

  if (currentAQI > 100) {
    alerts.push({
      id: `high-aqi-${location.id}`,
      type: 'danger',
      title: `Unhealthy Air Quality in ${location.name}`,
      message: `AQI has reached ${currentAQI}. Sensitive groups should limit outdoor activities.`,
      timestamp: '2 hours ago',
      severity: 'high',
      location: location.name,
      status: 'active'
    });
  }

  if (pollutants.pm25 > 35) {
    alerts.push({
      id: `high-pm25-${location.id}`,
      type: 'warning',
      title: `High PM2.5 Levels in ${location.name}`,
      message: `PM2.5 levels have exceeded ${pollutants.pm25} μg/m³.`,
      timestamp: '1 hour ago',
      severity: 'medium',
      location: location.name,
      status: 'active'
    });
  }

  // Add some resolved alerts for demonstration
  alerts.push({
    id: `resolved-${location.id}`,
    type: 'info',
    title: `Air Quality Improved in ${location.name}`,
    message: `Conditions have improved from previous levels.`,
    timestamp: '6 hours ago',
    severity: 'low',
    location: location.name,
    status: 'resolved'
  });

  return alerts;
}

/* 
 * EXAMPLE API INTEGRATION FUNCTION:
 * 
 * export async function fetchAirQualityFromGoogle(lat: number, lng: number) {
 *   const API_KEY = 'YOUR_GOOGLE_AIR_QUALITY_API_KEY';
 *   
 *   const response = await fetch(
 *     `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}`,
 *     {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         location: { latitude: lat, longitude: lng }
 *       })
 *     }
 *   );
 *   
 *   const data = await response.json();
 *   
 *   return {
 *     currentAQI: data.indexes[0].aqi,
 *     pollutants: {
 *       pm25: data.pollutants.find(p => p.code === 'pm25')?.concentration?.value || 0,
 *       pm10: data.pollutants.find(p => p.code === 'pm10')?.concentration?.value || 0,
 *       o3: data.pollutants.find(p => p.code === 'o3')?.concentration?.value || 0,
 *       no2: data.pollutants.find(p => p.code === 'no2')?.concentration?.value || 0,
 *       so2: data.pollutants.find(p => p.code === 'so2')?.concentration?.value || 0,
 *       co: data.pollutants.find(p => p.code === 'co')?.concentration?.value || 0,
 *     }
 *   };
 * }
 */

export async function fetchAirQualityFromGoogle(lat: number, lng: number) {
  const API_KEY = String(import.meta.env.VITE_GOOGLE_AIR_QUALITY_API_KEY || '');
  if (!API_KEY) {
    console.warn('VITE_GOOGLE_AIR_QUALITY_API_KEY is not set. See .env.example');
    throw new Error('Missing AIR_QUALITY API key');
  }

  const endpoint = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        universalAqi: true,
        location: { latitude: lat, longitude: lng },
        extraComputations: [
          'HEALTH_RECOMMENDATIONS',
          'DOMINANT_POLLUTANT_CONCENTRATION',
          'POLLUTANT_CONCENTRATION',
          'LOCAL_AQI',
          'POLLUTANT_ADDITIONAL_INFO'
        ],
        languageCode: 'en'
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Air Quality API error: ${response.status} ${text}`);
    }

  const data = await response.json();

  // Parse the API response into a normalized structure
  const parsed = parseAirQualityApiResponse(data);

    // If parsed pollutants are all zeros or undefined, but the API returned something unexpected,
    // keep the raw data so callers can inspect and we can debug in the UI if needed.
    // If temperature/humidity/wind were not present in the AQ response, try Google Weather first,
    // then fall back to Open-Meteo.
    if (parsed.temperature === undefined || parsed.humidity === undefined || parsed.windSpeed === undefined) {
      try {
        const g = await fetchWeatherFromGoogle(lat, lng);
        if (parsed.temperature === undefined && g.temperature !== undefined) parsed.temperature = g.temperature;
        if (parsed.humidity === undefined && g.humidity !== undefined) parsed.humidity = g.humidity;
        if (parsed.windSpeed === undefined && g.windSpeed !== undefined) parsed.windSpeed = g.windSpeed;
        if ((parsed as any).feelsLikeTemperature === undefined && (g as any).feelsLikeTemperature !== undefined) (parsed as any).feelsLikeTemperature = (g as any).feelsLikeTemperature;
      } catch (e) {
        try {
          const weather = await fetchWeatherFromOpenMeteo(lat, lng);
          if (parsed.temperature === undefined) parsed.temperature = weather.temperature;
          if (parsed.humidity === undefined) parsed.humidity = weather.humidity;
          if (parsed.windSpeed === undefined) parsed.windSpeed = weather.windSpeed;
        } catch (err) {
          // ignore weather fetch errors; weather will remain undefined
          console.warn('Failed to fetch fallback weather data', err);
        }
      }
    }
    return parsed;
  } catch (error) {
    console.error('fetchAirQualityFromGoogle error', error);
    throw error;
  }
}

/**
 * Fetch hourly history from Google Air Quality API.
 * @param lat latitude
 * @param lng longitude
 * @param hours number of hours to fetch (max 720)
 * @returns the raw hoursInfo array from the API response
 */
export async function fetchHourlyHistory(lat: number, lng: number, hours: number = 24) {
  const API_KEY = String(import.meta.env.VITE_GOOGLE_AIR_QUALITY_API_KEY || '');
  if (!API_KEY) {
    console.warn('VITE_GOOGLE_AIR_QUALITY_API_KEY is not set. See .env.example');
    throw new Error('Missing AIR_QUALITY API key');
  }

  const endpoint = `https://airquality.googleapis.com/v1/history:lookup?key=${API_KEY}`;

  // API supports pagination (nextPageToken). Collect pages until we have requested hours
  const maxHours = Math.max(1, Math.min(720, Math.floor(hours || 24)));
  const collected: any[] = [];
  let pageToken: string | undefined = undefined;

  while (true) {
    const body: any = { location: { latitude: lat, longitude: lng }, universalAqi: true };
    // Ask for up to remaining hours (server may still cap page size)
    body.hours = Math.min(168, maxHours - collected.length);
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`History API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    if (Array.isArray(data.hoursInfo) && data.hoursInfo.length > 0) {
      collected.push(...data.hoursInfo);
    }

    // If we've collected enough hours, stop
    if (collected.length >= maxHours) break;

    // If provider gave a nextPageToken, continue; otherwise stop
    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
      // continue loop to fetch next page
    } else {
      break;
    }
  }

  // Sort chronologically (oldest -> newest) and return the most recent `maxHours` entries
  collected.sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const result = collected.slice(-maxHours);
  return result;
}

/**
 * Get 7-day (daily) averages from history:lookup by requesting the last 168 hours
 * and grouping by day (UTC). Returns an array of objects { day: 'Mon', aqi: number }
 */
export async function fetchWeeklyAverages(lat: number, lng: number) {
  const hoursInfo = await fetchHourlyHistory(lat, lng, 168);
  if (!Array.isArray(hoursInfo) || hoursInfo.length === 0) return [];

  // Group by UTC date string YYYY-MM-DD
  const groups: Record<string, { sum: number; count: number }> = {};
  for (const h of hoursInfo) {
    const dt = new Date(h.dateTime);
    const dayKey = dt.toISOString().slice(0, 10); // YYYY-MM-DD
    const uaqi = Array.isArray(h.indexes)
      ? (h.indexes.find((i: any) => (i.code || '').toLowerCase() === 'uaqi')?.aqi ?? h.indexes[0]?.aqi)
      : undefined;
    const aqiNum = typeof uaqi === 'number' ? uaqi : undefined;
    if (aqiNum === undefined) continue;
    if (!groups[dayKey]) groups[dayKey] = { sum: 0, count: 0 };
    groups[dayKey].sum += aqiNum;
    groups[dayKey].count += 1;
  }

  // Sort keys ascending and map to day names
  const sortedKeys = Object.keys(groups).sort();
  const result = sortedKeys.map(k => {
    const avg = Math.round(groups[k].sum / Math.max(1, groups[k].count));
    const dt = new Date(k + 'T00:00:00Z');
    const dayLabel = dt.toLocaleDateString(undefined, { weekday: 'short' });
    return { day: dayLabel, aqi: avg };
  });

  // Keep only last 7 days (in case API returned more)
  return result.slice(-7);
}

// Shared parser for raw Google Air Quality API responses.
export function parseAirQualityApiResponse(data: any) {
  const universalAqi = Array.isArray(data.indexes)
    ? data.indexes.find((idx: any) => (idx.code || '').toLowerCase() === 'uaqi')
    : undefined;

  // Helper to extract pollutant from several possible shapes:
  const readPollutant = (root: any, code: string) => {
    if (!root) return undefined;
    if (Array.isArray(root)) {
      const p = root.find((x: any) => (x.code || '').toLowerCase() === code.toLowerCase() || (x.displayName || x.fullName || '').toString().toLowerCase().includes(code.toLowerCase()));
      return p?.concentration?.value ?? p?.value ?? undefined;
    }
    if (typeof root === 'object') {
      const key = Object.keys(root).find(k => k.toLowerCase() === code.toLowerCase() || k.toLowerCase().includes(code.toLowerCase()));
      const p = key ? root[key] : undefined;
      if (p) return p?.concentration?.value ?? p?.value ?? p?.measurement ?? undefined;
    }
    return undefined;
  };

  const readNumber = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined && typeof obj[k] === 'number') return obj[k];
    }
    return undefined;
  };

  const temperature = readNumber(data, ['temperature', 'temp', 'air_temperature', 'temperature_c']);
  const humidity = readNumber(data, ['humidity', 'relative_humidity']);
  const windSpeed = readNumber(data, ['windSpeed', 'wind_speed', 'windspeed', 'wind_m_s']);

  const parsed: any = {
    currentAQI: universalAqi?.aqi ?? (data.indexes?.[0]?.aqi ?? (data.currentConditions?.index?.aqi ?? 0)),
    pollutants: {
      pm25: undefined,
      pm10: undefined,
      o3: undefined,
      no2: undefined,
      so2: undefined,
      co: undefined
    },
    temperature,
    humidity,
    windSpeed,
    raw: data
  };

  try {
    if (Array.isArray(data.pollutants) && data.pollutants.length > 0) {
      const molWeights: Record<string, number> = { co: 28.01, no2: 46.0055, o3: 48.00, so2: 64.066 };

      const ppbToUgM3 = (ppb: number, code?: string) => {
        if (typeof ppb !== 'number') return undefined;
        const mw = code ? molWeights[code.toLowerCase()] : undefined;
        if (mw) return ppb * (mw / 24.45);
        return undefined;
      };

      const ppmToUgM3 = (ppm: number, code?: string) => ppbToUgM3(ppm * 1000, code);

      const pollutantMap: Record<string, { value?: number; units?: string }> = {};
      for (const p of data.pollutants) {
        const code = (p.code || '').toLowerCase();
        const value = p.concentration?.value ?? p.value ?? undefined;
        const units = (p.concentration?.units || p.units || '').toString();

        let normalizedUgM3: number | undefined = undefined;
        const u = units.toUpperCase();
        if (u.includes('MICROGRAM')) {
          normalizedUgM3 = typeof value === 'number' ? value : undefined;
        } else if (u.includes('PARTS_PER_BILLION') || u.includes('PPB')) {
          normalizedUgM3 = ppbToUgM3(Number(value), code) ?? undefined;
        } else if (u.includes('PARTS_PER_MILLION') || u.includes('PPM')) {
          normalizedUgM3 = ppmToUgM3(Number(value), code) ?? undefined;
        } else {
          normalizedUgM3 = typeof value === 'number' ? value : undefined;
        }

        if (code === 'co') {
          const mgm3 = normalizedUgM3 !== undefined ? normalizedUgM3 / 1000 : undefined;
          pollutantMap[code] = { value: mgm3 !== undefined ? Number(mgm3) : undefined, units: 'mg/m³' };
        } else {
          pollutantMap[code] = { value: normalizedUgM3 !== undefined ? Number(Number(normalizedUgM3).toFixed(2)) : undefined, units: 'μg/m³' };
        }
      }

      (parsed as any).pollutants.pm25 = pollutantMap['pm25']?.value ?? (parsed as any).pollutants.pm25;
      (parsed as any).pollutants.pm10 = pollutantMap['pm10']?.value ?? (parsed as any).pollutants.pm10;
      (parsed as any).pollutants.o3 = pollutantMap['o3']?.value ?? (parsed as any).pollutants.o3;
      (parsed as any).pollutants.no2 = pollutantMap['no2']?.value ?? (parsed as any).pollutants.no2;
      (parsed as any).pollutants.so2 = pollutantMap['so2']?.value ?? (parsed as any).pollutants.so2;
      (parsed as any).pollutants.co = pollutantMap['co']?.value ?? (parsed as any).pollutants.co;

      (parsed as any).pollutantUnits = {
        pm25: pollutantMap['pm25']?.units,
        pm10: pollutantMap['pm10']?.units,
        o3: pollutantMap['o3']?.units,
        no2: pollutantMap['no2']?.units,
        so2: pollutantMap['so2']?.units,
        co: pollutantMap['co']?.units
      };

      try {
        console.debug('AirQuality parsed pollutants:', (parsed as any).pollutants);
        console.debug('AirQuality pollutantUnits:', (parsed as any).pollutantUnits);
        console.debug('AirQuality raw pollutants array:', data.pollutants);
      } catch (e) {}
    } else if (data.pollutants) {
      (parsed as any).pollutants.pm25 = readPollutant(data.pollutants, 'pm25') || (parsed as any).pollutants.pm25;
      (parsed as any).pollutants.pm10 = readPollutant(data.pollutants, 'pm10') || (parsed as any).pollutants.pm10;
      (parsed as any).pollutants.o3 = readPollutant(data.pollutants, 'o3') || (parsed as any).pollutants.o3;
      (parsed as any).pollutants.no2 = readPollutant(data.pollutants, 'no2') || (parsed as any).pollutants.no2;
      (parsed as any).pollutants.so2 = readPollutant(data.pollutants, 'so2') || (parsed as any).pollutants.so2;
      (parsed as any).pollutants.co = readPollutant(data.pollutants, 'co') || (parsed as any).pollutants.co;
    }
  } catch (err) {
    console.warn('Failed to parse pollutants shape', err);
  }

  return parsed;
}

// Fallback weather fetch using Open-Meteo (no API key required).
// Returns { temperature, humidity, windSpeed } where available.
export async function fetchWeatherFromOpenMeteo(lat: number, lng: number) {
  try {
    // Request current weather and hourly relative humidity so we can pick the latest value
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&current_weather=true&hourly=relativehumidity_2m&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);
    const data = await res.json();

    const temperature = data.current_weather?.temperature ?? undefined;
    const windSpeed = data.current_weather?.windspeed ?? undefined;
    let humidity = undefined;
    if (data.hourly && Array.isArray(data.hourly.relativehumidity_2m) && Array.isArray(data.hourly.time)) {
      // find index for current time (UTC)
      const nowIso = new Date().toISOString().slice(0, 13) + ':00';
      const idx = data.hourly.time.indexOf(nowIso);
      if (idx >= 0) humidity = data.hourly.relativehumidity_2m[idx];
      else humidity = data.hourly.relativehumidity_2m[0];
    }

    return {
      temperature,
      humidity,
      windSpeed
    };
  } catch (err) {
    console.warn('fetchWeatherFromOpenMeteo failed', err);
    throw err;
  }
}

// Try Google Weather API (weather.googleapis.com) using the same Google API key.
// Example request:
// GET https://weather.googleapis.com/v1/currentConditions:lookup?key=API_KEY&location.latitude=37.4220&location.longitude=-122.0841
export async function fetchWeatherFromGoogle(lat: number, lng: number) {
  const API_KEY = String(import.meta.env.VITE_GOOGLE_AIR_QUALITY_API_KEY || import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY || '');
  if (!API_KEY) {
    throw new Error('Missing Google API key for weather lookup');
  }

  const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(API_KEY)}&location.latitude=${encodeURIComponent(
    String(lat)
  )}&location.longitude=${encodeURIComponent(String(lng))}`;

  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google Weather API error: ${res.status} ${txt}`);
  }

  const data = await res.json();

  // Parse temperature (degrees), feelsLike, and relativeHumidity from the documented response
  const temperature = data?.temperature?.degrees ?? data?.temperature?.value ?? undefined;
  const feelsLikeTemperature = data?.feelsLikeTemperature?.degrees ?? data?.feels_like_temperature?.degrees ?? undefined;
  const humidity = data?.relativeHumidity ?? data?.relative_humidity ?? data?.relativeHumidityPercent ?? undefined;

  // Wind fields vary; attempt to read common shapes
  let windSpeed: number | undefined = undefined;
  // Some responses provide currentConditions.wind or windSpeed fields
  if (data?.wind?.speed?.value) windSpeed = data.wind.speed.value;
  else if (data?.currentConditions?.wind?.speed?.value) windSpeed = data.currentConditions.wind.speed.value;
  else if (data?.windSpeed) windSpeed = data.windSpeed;
  else if (data?.wind?.speed) windSpeed = data.wind.speed;

  // Google uses units in the payload; if windSpeed is provided in m/s, convert to km/h conservatively
  // We don't have explicit unit metadata here for all responses; leave value as-is and let UI interpret.

  return {
    temperature,
    humidity,
    windSpeed,
    feelsLikeTemperature,
    raw: data
  };
}
