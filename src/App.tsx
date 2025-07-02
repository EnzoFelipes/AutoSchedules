import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AppointmentCalendar } from './components/Appointments/AppointmentCalendar';
import { ClientList } from './components/Clients/ClientList';
import { VehicleList } from './components/Vehicles/VehicleList';
import { ServiceList } from './components/Services/ServiceList';

const tabTitles = {
  dashboard: 'Dashboard',
  appointments: 'Agendamentos',
  clients: 'Clientes',
  vehicles: 'Veículos',
  services: 'Serviços',
  reports: 'Relatórios',
  settings: 'Configurações',
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'appointments':
        return <AppointmentCalendar />;
      case 'clients':
        return <ClientList />;
      case 'vehicles':
        return <VehicleList />;
      case 'services':
        return <ServiceList />;
      case 'reports':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Relatórios</h3>
            <p className="text-gray-500">Funcionalidade em desenvolvimento</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações</h3>
            <p className="text-gray-500">Funcionalidade em desenvolvimento</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={tabTitles[activeTab as keyof typeof tabTitles]} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;