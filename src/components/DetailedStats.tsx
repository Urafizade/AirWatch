import { useLocation } from './LocationContext';
import { useEffect, useState } from 'react';
import { generateHourlyData, generateWeeklyData, fetchHourlyHistory, fetchWeeklyAverages } from '../utils/airQualityData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function DetailedStats() {
  const { selectedLocation, airQuality } = useLocation();
  
  // Replace placeholders with real API-driven data when available
  const [hourlyData, setHourlyData] = useState<any[]>(() => generateHourlyData(selectedLocation));
  const [weeklyData, setWeeklyData] = useState<any[]>(() => generateWeeklyData(selectedLocation));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedLocation || selectedLocation.id === 'placeholder') {
        setHourlyData(generateHourlyData(selectedLocation));
        setWeeklyData(generateWeeklyData(selectedLocation));
        return;
      }
      const lat = selectedLocation.coordinates.lat;
      const lng = selectedLocation.coordinates.lng;
      setLoading(true);
      try {
        // 24-hour hourly history
        try {
          const hoursInfo = await fetchHourlyHistory(lat, lng, 24);
          if (!cancelled && Array.isArray(hoursInfo)) {
            const mapped = hoursInfo.map((h: any) => {
              const dt = new Date(h.dateTime);
              const timeLabel = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const uaqi = Array.isArray(h.indexes) ? (h.indexes.find((i: any) => (i.code || '').toLowerCase() === 'uaqi')?.aqi ?? h.indexes[0]?.aqi) : undefined;
              return { time: timeLabel, aqi: typeof uaqi === 'number' ? uaqi : null, pm25: undefined, pm10: undefined };
            });
            setHourlyData(mapped.length ? mapped : generateHourlyData(selectedLocation));
          }
        } catch (e) {
          // fallback to placeholder generator
          setHourlyData(generateHourlyData(selectedLocation));
        }

        // Weekly (7-day) averages
        try {
          const weekly = await fetchWeeklyAverages(lat, lng);
          if (!cancelled && Array.isArray(weekly) && weekly.length > 0) {
            setWeeklyData(weekly.map((d: any) => ({ day: d.day, aqi: d.aqi })));
          } else {
            setWeeklyData(generateWeeklyData(selectedLocation));
          }
        } catch (e) {
          setWeeklyData(generateWeeklyData(selectedLocation));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedLocation]);

  // Build pollutant values from real API data (fallback to mock values)
  const apiPollutants = (airQuality && (airQuality as any).pollutants) || null;
  const apiUnits = (airQuality && (airQuality as any).pollutantUnits) || {};
  // normalize pollutant values into μg/m³ for fair comparison/percentage calculations
  const normalizeToUg = (name: string, rawVal: any) => {
    const unitRaw = String((apiUnits as any)[name.toLowerCase()] || '').toLowerCase();
    let v = typeof rawVal === 'number' ? rawVal : Number(rawVal ?? 0);
    if (!isFinite(v)) v = 0;
    // If units explicitly provided, use them
    if (unitRaw.includes('mg')) return v * 1000; // mg/m³ -> μg/m³
    if (unitRaw.includes('μg') || unitRaw.includes('µg') || unitRaw.includes('ug')) return v; // already μg/m³
    // Fallback heuristics when units missing: CO is commonly reported in mg/m³, others in μg/m³
    if (name.toLowerCase() === 'co') {
      // If value looks like a small decimal (typical mg/m³), convert; if it's large (>10) assume it's already μg/m³
      return v > 10 ? v : v * 1000;
    }
    return v; // assume μg/m³ for other pollutants
  };
  // ensure numbers and normalize all pollutants to μg/m³ for distribution
  const pm25Val = normalizeToUg('pm25', apiPollutants?.pm25 ?? 35);
  const pm10Val = normalizeToUg('pm10', apiPollutants?.pm10 ?? 25);
  const o3Val = normalizeToUg('o3', apiPollutants?.o3 ?? 20);
  const no2Val = normalizeToUg('no2', apiPollutants?.no2 ?? 15);
  const so2Val = normalizeToUg('so2', apiPollutants?.so2 ?? 3);
  const coVal = normalizeToUg('co', apiPollutants?.co ?? 0.002);

  const pollutantData = [
    { name: 'PM2.5', value: Number(pm25Val || 0), color: '#3b82f6' },
    { name: 'PM10', value: Number(pm10Val || 0), color: '#8b5cf6' },
    { name: 'O3', value: Number(o3Val || 0), color: '#06b6d4' },
    { name: 'NO2', value: Number(no2Val || 0), color: '#10b981' },
    { name: 'SO2', value: Number(so2Val || 0), color: '#f59e0b' },
    { name: 'CO', value: Number(coVal || 0), color: '#ef4444' },
  ];

  const pollutantSum = pollutantData.reduce((s, p) => s + (p.value || 0), 0) || 1;

  // Typed label callback for Pie to avoid implicit any bindings in TS
  const pieLabel = (props: { name?: string; percent?: number }) => {
    const name = props.name ?? '';
    const percent = props.percent ?? 0;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Hourly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Air Quality Trends - {selectedLocation.name} (Today)</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Track real-time air quality changes throughout the day to plan your outdoor activities.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="aqi" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="AQI"
              />
              <Line 
                type="monotone" 
                dataKey="pm25" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="PM2.5"
              />
              <Line 
                type="monotone" 
                dataKey="pm10" 
                stroke="#06b6d4" 
                strokeWidth={2}
                name="PM10"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly AQI + small Pollutant Distribution on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly AQI - {selectedLocation.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Compare air quality levels across the past week to identify patterns and trends.
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="aqi" fill="#3b82f6" name="AQI" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pollutant Distribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Share by mass (μg/m³)</p>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pollutantData.map(p => ({ name: p.name, value: p.value }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={pieLabel}
                  >
                    {pollutantData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any, name: any) => [`${Number(val).toFixed(2)} μg/m³`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Pollutant Comparison stretched full width with WHO guideline bars */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Pollutant Comparison</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Current pollutant concentrations vs WHO guidelines (μg/m³). CO guideline converted from mg/m³.
          </p>
        </CardHeader>
        <CardContent>
          {/* WHO guidelines in μg/m³ */}
          {/* CO guideline: 4 mg/m³ => 4000 μg/m³ */}
          <ResponsiveContainer width="100%" height={320}>
            {
              (() => {
                // WHO guidelines: pm25, pm10, o3, no2, so2 in μg/m³; CO guideline is 4 mg/m³ (we represent it on the right axis)
                const whoGuidelinesUg: Record<string, number> = { pm25: 15, pm10: 45, o3: 100, no2: 25, so2: 40 };
                const whoGuidelineCoMg = 4; // mg/m³
                // Build comparison rows; left axis uses μg/m³ for non-CO, right axis uses mg/m³ for CO
                const comparison = pollutantData.map(p => {
                  if (p.name === 'CO') {
                    return {
                      pollutant: p.name,
                      current_mg: Number((p.value / 1000) || 0),
                      guideline_mg: whoGuidelineCoMg
                    };
                  }
                  const key = p.name === 'PM2.5' ? 'pm25' : p.name.toLowerCase();
                  return {
                    pollutant: p.name,
                    current_ug: Number(p.value || 0),
                    guideline_ug: whoGuidelinesUg[key] || 0
                  };
                });

                // Tooltip formatter that respects units based on the series name
                const tooltipFormatter = (value: any, name: any) => {
                  if (String(name).includes('mg')) return [`${Number(value).toFixed(3)} mg/m³`, name];
                  return [`${Number(value).toFixed(2)} μg/m³`, name];
                };

                return (
                  <BarChart data={comparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pollutant" />
                    <YAxis yAxisId="left" label={{ value: 'μg/m³', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'mg/m³', angle: 90, position: 'insideRight' }} />
                    <Tooltip formatter={tooltipFormatter} />

                    {/* Left axis bars (μg/m³) */}
                    <Bar dataKey="current_ug" yAxisId="left" name="Current (μg/m³)">
                      {comparison.map((c, i) => (
                        <Cell key={`cur-ug-${c.pollutant}`} fill={pollutantData[i]?.color || '#3b82f6'} />
                      ))}
                    </Bar>
                    <Bar dataKey="guideline_ug" yAxisId="left" name="WHO Guideline (μg/m³)" fill="#94a3b8" />

                    {/* Right axis bars (mg/m³) - only CO will have values here */}
                    <Bar dataKey="current_mg" yAxisId="right" name="Current (mg/m³)" fill="#ef4444" />
                    <Bar dataKey="guideline_mg" yAxisId="right" name="WHO Guideline (mg/m³)" fill="#94a3b8" />
                  </BarChart>
                );
              })()
            }
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
