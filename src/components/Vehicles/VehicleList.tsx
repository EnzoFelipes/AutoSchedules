import React, { useState } from 'react';
import { Search, Plus, Car, User, Calendar, Edit, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Vehicle } from '../../types';
import { mockVehicles, mockClients } from '../../data/mockData';
import { VehicleForm } from './VehicleForm';
import { getVehicleTypeLabel, getVehicleSizeLabel } from '../../utils/scheduling';

export function VehicleList() {
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', mockVehicles);
  const [clients] = useLocalStorage('clients', mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter(vehicle => {
    const client = clients.find(c => c.id === vehicle.clientId);
    return (
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSave = (vehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => {
    if (editingVehicle) {
      setVehicles(prev => prev.map(v => 
        v.id === editingVehicle.id 
          ? { ...vehicleData, id: editingVehicle.id, createdAt: editingVehicle.createdAt }
          : v
      ));
    } else {
      const newVehicle: Vehicle = {
        ...vehicleData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setVehicles(prev => [...prev, newVehicle]);
    }
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleDelete = (vehicleId: string) => {
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Veículos</h2>
          <p className="text-gray-600">Gerencie os veículos cadastrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Veículo</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por placa, marca, modelo ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => (
          <div
            key={vehicle.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-lg font-bold text-blue-600 mb-3">{vehicle.plate}</p>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{getClientName(vehicle.clientId)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Ano: {vehicle.year}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <span className="text-gray-500">Cor:</span>
                  <p className="font-medium">{vehicle.color}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <p className="font-medium">{getVehicleTypeLabel(vehicle.type)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Porte:</span>
                  <p className="font-medium">{getVehicleSizeLabel(vehicle.size)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cadastro:</span>
                  <p className="font-medium">
                    {new Date(vehicle.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum veículo encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Tente ajustar sua busca' : 'Adicione o primeiro veículo para começar'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adicionar Veículo
            </button>
          )}
        </div>
      )}

      {/* Vehicle Form Modal */}
      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          clients={clients}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingVehicle(null);
          }}
        />
      )}
    </div>
  );
}