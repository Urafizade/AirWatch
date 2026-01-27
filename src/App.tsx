import { useState } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from './components/ui/sidebar';
import { Card } from './components/ui/card';
import { LocationProvider } from './components/LocationContext';
import { LocationSelector } from './components/LocationSelector';
import { AirQualityMap } from './components/AirQualityMap';
import { Dashboard } from './components/Dashboard';
import { DetailedStats } from './components/DetailedStats';
import { Alerts } from './components/Alerts';
import { KeyFindings } from './components/KeyFindings';
import { 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  History, 
  Bell, 
  Wind,
  FileText
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Air Quality Map', icon: Map },
    { id: 'detailed-stats', label: 'Detailed Statistics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
    { id: 'key-findings', label: 'Key Findings', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'map':
        return <AirQualityMap />;
      case 'detailed-stats':
        return <DetailedStats />;
      case 'alerts':
        return <Alerts />;
      case 'key-findings':
        return <KeyFindings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <LocationProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar>
            <SidebarHeader className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Wind className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">AirWatch</h1>
                  <p className="text-xs text-muted-foreground">Global Air Quality Monitoring</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveTab(item.id)}
                      isActive={activeTab === item.id}
                      className="w-full justify-start"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="flex-1">
            <div className="flex h-full flex-col">
              <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    <h2 className="text-lg font-semibold">
                      {menuItems.find(item => item.id === activeTab)?.label}
                    </h2>
                  </div>
                  <LocationSelector />
                </div>
              </header>
              
              <main className="flex-1 overflow-auto p-6">
                {renderContent()}
              </main>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </LocationProvider>
  );
}