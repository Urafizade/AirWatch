import { useState } from 'react';
import { useLocation } from './LocationContext';
import { getLocationAlerts } from '../utils/airQualityData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { AlertTriangle, Bell, Settings, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';

export function Alerts() {
  const { selectedLocation } = useLocation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const alerts = getLocationAlerts(selectedLocation);

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string, status: string) => {
    if (status === 'resolved') return <CheckCircle className="h-5 w-5 text-green-600" />;
    
    switch (type) {
      case 'danger': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default: return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Alerts for {selectedLocation.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedLocation.country}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Alert Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Configure your notification preferences and alert thresholds to stay informed about air quality changes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive real-time alerts when air quality changes significantly
              </p>
            </div>
            <Switch 
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <h5 className="font-medium text-sm">AQI Threshold</h5>
              <p className="text-xs text-muted-foreground">Alert when AQI exceeds 100</p>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-sm">PM2.5 Threshold</h5>
              <p className="text-xs text-muted-foreground">Alert when PM2.5 exceeds 35 μg/m³</p>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Location Alerts</h5>
              <p className="text-xs text-muted-foreground">Monitor 3 selected areas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Active Alerts ({activeAlerts.length})
              </span>
              {activeAlerts.length > 0 && (
                <Button variant="outline" size="sm">
                  Mark All as Read
                </Button>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current air quality alerts requiring immediate attention in your monitored locations.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No active alerts</p>
              <p className="text-sm">Air quality is within normal ranges</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type, alert.status)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.location}
                        </Badge>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {alert.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts History</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            View previously resolved alerts to track air quality improvements and patterns.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resolvedAlerts.map(alert => (
              <div 
                key={alert.id}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type, alert.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {alert.location}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Resolved
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {alert.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Statistics (Last 30 Days)</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Summary of alert activity and resolution metrics over the past month.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-red-600">12</div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-orange-600">28</div>
              <p className="text-sm text-muted-foreground">Medium Priority</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600">45</div>
              <p className="text-sm text-muted-foreground">Low Priority</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <p className="text-sm text-muted-foreground">Resolution Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}