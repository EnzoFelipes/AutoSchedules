import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Car, Wrench, FileText, DollarSign } from 'lucide-react';
import { Appointment, Client, Vehicle, Service } from '../../types';
import { formatCurrency } from '../../utils/scheduling';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  clients: Client[];
  vehicles: Vehicle[];
  services: Service[];
  onSave: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function AppointmentForm({ 
  appointment, 
  clients, 
  vehicles, 
  services, 
  onSave, 
  onCancel 
}: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    clientId: appointment?.clientId || '',
    vehicleId: appointment?.vehicleId || '',
    serviceIds: appointment?.serviceIds || [],
    startDateTime: appointment?.startDateTime ? 
      new Date(appointment.startDateTime).toISOString().slice(0, 16) : '',
    status: appointment?.status || 'scheduled',
    observations: appointment?.observations || '',
    responsible: appointment?.responsible || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Filter vehicles when client changes
  useEffect(() => {
    if (formData.clientId) {
      const filtered = vehicles.filter(v => v.clientId === formData.clientId);
      setClientVehicles(filtered);
      
      // Reset vehicle if it doesn't belong to selected client
      if (formData.vehicleId && !filtered.find(v => v.id === formData.vehicleId)) {
        setFormData(prev => ({ ...prev, vehicleId: '' }));
      }
    } else {
      setClientVehicles([]);
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [formData.clientId, vehicles]);

  // Filter services when vehicle changes
  useEffect(() => {
    if (formData.vehicleId) {
      const vehicle = vehicles.find(v => v.id === formData.vehicleId);
      if (vehicle) {
        const filtered = services.filter(s => {
          if (!s.configurations) return false;
          const config = s.configurations[vehicle.size];
          return s.vehicleType === vehicle.type && config && config.available;
        });
        setAvailableServices(filtered);
        
        // Reset services if they don't match vehicle
        const validServiceIds = formData.serviceIds.filter(id => {
          const service = services.find(s => s.id === id);
          if (!service || !service.configurations) return false;
          const config = service.configurations[vehicle.size];
          return service.vehicleType === vehicle.type && config && config.available;
        });
        
        if (validServiceIds.length !== formData.serviceIds.length) {
          setFormData(prev => ({ ...prev, serviceIds: validServiceIds }));
        }
      }
    } else {
      setAvailableServices([]);
      setFormData(prev => ({ ...prev, serviceIds: [] }));
    }
  }, [formData.vehicleId, vehicles, services]);

  // Calculate totals when services change
  useEffect(() => {
    if (formData.vehicleId && formData.serviceIds.length > 0) {
      const vehicle = vehicles.find(v => v.id === formData.vehicleId);
      if (vehicle) {
        const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
        const price = selectedServices.reduce((sum, s) => {
          if (!s.configurations) return sum;
          const config = s.configurations[vehicle.size];
          return sum + (config ? config.price : 0);
        }, 0);
        
        const duration = selectedServices.reduce((sum, s) => {
          if (!s.configurations) return sum;
          const config = s.configurations[vehicle.size];
          return sum + (config ? (config.durationHours * 60) + config.durationMinutes : 0);
        }, 0);
        
        setTotalPrice(price);
        setTotalDuration(duration);
      }
    } else {
      setTotalPrice(0);
      setTotalDuration(0);
    }
  }, [formData.serviceIds, formData.vehicleId, services, vehicles]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Veículo é obrigatório';
    }

    if (formData.serviceIds.length === 0) {
      newErrors.serviceIds = 'Pelo menos um serviço deve ser selecionado';
    }

    if (!formData.startDateTime) {
      newErrors.startDateTime = 'Data e hora são obrigatórias';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const startDate = new Date(formData.startDateTime);
      const endDate = new Date(startDate.getTime() + totalDuration * 60000);

      onSave({
        ...formData,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        totalPrice,
      });
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }));
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || '';
  };

  const getVehicleLabel = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}` : '';
  };

  const getServiceDetails = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service || !service.configurations || !formData.vehicleId) return null;
    
    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (!vehicle) return null;
    
    const config = service.configurations[vehicle.size];
    return config ? { service, config } : null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Cliente *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="w-4 h-4 inline mr-2" />
                Veículo *
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                disabled={!formData.clientId}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.vehicleId ? 'border-red-300' : 'border-gray-300'
                } ${!formData.clientId ? 'bg-gray-100' : ''}`}
              >
                <option value="">Selecione um veículo</option>
                {clientVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.plate}
                  </option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-red-500 text-sm mt-1">{errors.vehicleId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data e Hora *
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startDateTime: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDateTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDateTime && <p className="text-red-500 text-sm mt-1">{errors.startDateTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável
              </label>
              <input
                type="text"
                value={formData.responsible}
                onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Wrench className="w-4 h-4 inline mr-2" />
              Serviços * {availableServices.length === 0 && formData.vehicleId && (
                <span className="text-orange-600 text-xs">(Nenhum serviço disponível para este veículo)</span>
              )}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {availableServices.map(service => {
                const vehicle = vehicles.find(v => v.id === formData.vehicleId);
                const config = vehicle && service.configurations ? service.configurations[vehicle.size] : null;
                
                return (
                  <label
                    key={service.id}
                    className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.description}</div>
                      {config && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {config.durationHours > 0 && `${config.durationHours}h`}
                            {config.durationMinutes > 0 && ` ${config.durationMinutes}min`}
                          </span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency(config.price)}
                          </span>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.serviceIds && <p className="text-red-500 text-sm mt-1">{errors.serviceIds}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações sobre o agendamento..."
            />
          </div>

          {/* Summary */}
          {formData.serviceIds.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Resumo do Agendamento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">{getClientName(formData.clientId)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Veículo:</span>
                  <span className="font-medium">{getVehicleLabel(formData.vehicleId)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duração Total:</span>
                  <span className="font-medium">
                    {Math.floor(totalDuration / 60)}h {totalDuration % 60}min
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="space-y-1">
                    {formData.serviceIds.map(serviceId => {
                      const details = getServiceDetails(serviceId);
                      if (!details) return null;
                      
                      return (
                        <div key={serviceId} className="flex justify-between text-xs">
                          <span>{details.service.name}</span>
                          <span>{formatCurrency(details.config.price)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {appointment ? 'Atualizar' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}