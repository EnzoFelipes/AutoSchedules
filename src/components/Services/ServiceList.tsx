import React, { useState } from 'react';
import { Search, Plus, Wrench, Clock, DollarSign, Edit, Trash2, Copy } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Service } from '../../types';
import { mockServices } from '../../data/mockData';
import { ServiceForm } from './ServiceForm';
import { formatCurrency, getVehicleTypeLabel } from '../../utils/scheduling';

export function ServiceList() {
  const [services, setServices] = useLocalStorage<Service[]>('services', mockServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = (serviceData: Omit<Service, 'id'>) => {
    if (editingService) {
      setServices(prev => prev.map(s => 
        s.id === editingService.id 
          ? { ...serviceData, id: editingService.id }
          : s
      ));
    } else {
      const newService: Service = {
        ...serviceData,
        id: Date.now().toString(),
      };
      setServices(prev => [...prev, newService]);
    }
    setShowForm(false);
    setEditingService(null);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = (serviceId: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      setServices(prev => prev.filter(s => s.id !== serviceId));
    }
  };

  const handleDuplicate = (service: Service) => {
    const duplicatedService: Service = {
      ...service,
      id: Date.now().toString(),
      name: `${service.name} (Cópia)`,
    };
    setServices(prev => [...prev, duplicatedService]);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cleaning': return 'bg-blue-100 text-blue-800';
      case 'detailing': return 'bg-purple-100 text-purple-800';
      case 'painting': return 'bg-red-100 text-red-800';
      case 'protection': return 'bg-green-100 text-green-800';
      case 'repair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      cleaning: 'Limpeza',
      detailing: 'Detalhamento',
      painting: 'Pintura',
      protection: 'Proteção',
      repair: 'Reparo',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getAvailableSizes = (service: Service) => {
    if (!service.configurations) return [];
    return Object.entries(service.configurations)
      .filter(([_, config]) => config.available)
      .map(([size, _]) => size);
  };

  const getPriceRange = (service: Service) => {
    if (!service.configurations) return 'N/A';
    const availableConfigs = Object.values(service.configurations).filter(config => config.available);
    if (availableConfigs.length === 0) return 'N/A';
    
    const prices = availableConfigs.map(config => config.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return formatCurrency(minPrice);
    }
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Serviços</h2>
          <p className="text-gray-600">Gerencie o catálogo de serviços</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todas as categorias</option>
          <option value="cleaning">Limpeza</option>
          <option value="detailing">Detalhamento</option>
          <option value="painting">Pintura</option>
          <option value="protection">Proteção</option>
          <option value="repair">Reparo</option>
        </select>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => {
          const availableSizes = getAvailableSizes(service);
          
          return (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                    {getCategoryLabel(service.category)}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(service)}
                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tipo de Veículo:</span>
                  <span className="font-medium">{getVehicleTypeLabel(service.vehicleType)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Portes Disponíveis:</span>
                  <span className="font-medium">{availableSizes.length}</span>
                </div>
                
                {service.dryingTime && service.dryingTime > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tempo de Secagem:</span>
                    <span className="font-medium">{service.dryingTime} min</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <DollarSign className="w-4 h-4" />
                    <span>Preço:</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">
                    {getPriceRange(service)}
                  </span>
                </div>
              </div>
              
              {/* Available Sizes Details */}
              {service.configurations && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">CONFIGURAÇÕES POR PORTE</h4>
                  <div className="space-y-2">
                    {Object.entries(service.configurations).map(([size, config]) => {
                      if (!config.available) return null;
                      
                      const sizeLabels = {
                        small: 'Pequeno',
                        medium: 'Médio',
                        large: 'Grande',
                        'extra-large': 'Extra Grande',
                      };
                      
                      return (
                        <div key={size} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{sizeLabels[size as keyof typeof sizeLabels]}:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {config.durationHours > 0 && `${config.durationHours}h`}
                              {config.durationMinutes > 0 && ` ${config.durationMinutes}min`}
                            </span>
                            <span className="font-medium text-blue-600">
                              {formatCurrency(config.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => handleEdit(service)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDuplicate(service)}
                  className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  Duplicar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterCategory !== 'all' 
              ? 'Tente ajustar seus filtros' 
              : 'Adicione seu primeiro serviço para começar'
            }
          </p>
          {!searchTerm && filterCategory === 'all' && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adicionar Serviço
            </button>
          )}
        </div>
      )}

      {/* Service Form Modal */}
      {showForm && (
        <ServiceForm
          service={editingService}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
}