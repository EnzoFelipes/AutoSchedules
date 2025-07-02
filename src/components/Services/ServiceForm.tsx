import React, { useState } from 'react';
import { X, Wrench, Clock, DollarSign, FileText } from 'lucide-react';
import { Service, VehicleType, ServiceCategory, ServiceConfiguration } from '../../types';

interface ServiceFormProps {
  service?: Service | null;
  onSave: (service: Omit<Service, 'id'>) => void;
  onCancel: () => void;
}

export function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    vehicleType: service?.vehicleType || 'car' as VehicleType,
    dryingTime: service?.dryingTime || 0,
    category: service?.category || 'cleaning' as ServiceCategory,
    requiresEntryChecklist: service?.requiresEntryChecklist ?? true,
    requiresExitChecklist: service?.requiresExitChecklist ?? true,
    configurations: service?.configurations || {
      small: { available: false, durationHours: 0, durationMinutes: 30, price: 0 },
      medium: { available: false, durationHours: 0, durationMinutes: 30, price: 0 },
      large: { available: false, durationHours: 0, durationMinutes: 30, price: 0 },
      'extra-large': { available: false, durationHours: 0, durationMinutes: 30, price: 0 },
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const vehicleTypes: { value: VehicleType; label: string }[] = [
    { value: 'car', label: 'Carro' },
    { value: 'motorcycle', label: 'Moto' },
    { value: 'truck', label: 'Caminhão' },
    { value: 'van', label: 'Van' },
    { value: 'suv', label: 'SUV' },
  ];

  const categories: { value: ServiceCategory; label: string }[] = [
    { value: 'cleaning', label: 'Limpeza' },
    { value: 'detailing', label: 'Detalhamento' },
    { value: 'painting', label: 'Pintura' },
    { value: 'protection', label: 'Proteção' },
    { value: 'repair', label: 'Reparo' },
  ];

  const vehicleSizes = [
    { key: 'small', label: 'Pequeno' },
    { key: 'medium', label: 'Médio' },
    { key: 'large', label: 'Grande' },
    { key: 'extra-large', label: 'Extra Grande' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do serviço é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    // Verificar se pelo menos um porte está disponível
    const hasAvailableSize = Object.values(formData.configurations).some(config => config.available);
    if (!hasAvailableSize) {
      newErrors.configurations = 'Pelo menos um porte de veículo deve estar disponível';
    }

    // Verificar configurações válidas para portes disponíveis
    Object.entries(formData.configurations).forEach(([size, config]) => {
      if (config.available) {
        if (config.durationHours === 0 && config.durationMinutes === 0) {
          newErrors[`${size}_duration`] = 'Duração deve ser maior que zero';
        }
        if (config.price <= 0) {
          newErrors[`${size}_price`] = 'Preço deve ser maior que zero';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleConfigurationChange = (size: string, field: keyof ServiceConfiguration, value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      configurations: {
        ...prev.configurations,
        [size]: {
          ...prev.configurations[size as keyof typeof prev.configurations],
          [field]: value,
        },
      },
    }));

    // Clear related errors
    const errorKey = `${size}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
    if (errors.configurations) {
      setErrors(prev => ({ ...prev, configurations: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {service ? 'Editar Serviço' : 'Novo Serviço'}
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
                <Wrench className="w-4 h-4 inline mr-2" />
                Nome do Serviço *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Lavagem Completa"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Descreva o serviço..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Veículo *
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => handleChange('vehicleType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {vehicleTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo de Secagem (min)
              </label>
              <input
                type="number"
                value={formData.dryingTime}
                onChange={(e) => handleChange('dryingTime', parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Para serviços de pintura"
              />
            </div>
          </div>

          {/* Configurações por Porte */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações por Porte de Veículo</h3>
            {errors.configurations && <p className="text-red-500 text-sm mb-3">{errors.configurations}</p>}
            
            <div className="space-y-4">
              {vehicleSizes.map(size => (
                <div key={size.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{size.label}</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.configurations[size.key as keyof typeof formData.configurations].available}
                        onChange={(e) => handleConfigurationChange(size.key, 'available', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Disponível</span>
                    </label>
                  </div>

                  {formData.configurations[size.key as keyof typeof formData.configurations].available && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Horas
                        </label>
                        <input
                          type="number"
                          value={formData.configurations[size.key as keyof typeof formData.configurations].durationHours}
                          onChange={(e) => handleConfigurationChange(size.key, 'durationHours', parseInt(e.target.value) || 0)}
                          min="0"
                          max="24"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`${size.key}_duration`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minutos
                        </label>
                        <input
                          type="number"
                          value={formData.configurations[size.key as keyof typeof formData.configurations].durationMinutes}
                          onChange={(e) => handleConfigurationChange(size.key, 'durationMinutes', parseInt(e.target.value) || 0)}
                          min="0"
                          max="59"
                          step="15"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`${size.key}_duration`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <DollarSign className="w-3 h-3 inline mr-1" />
                          Preço (R$)
                        </label>
                        <input
                          type="number"
                          value={formData.configurations[size.key as keyof typeof formData.configurations].price}
                          onChange={(e) => handleConfigurationChange(size.key, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`${size.key}_price`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      {(errors[`${size.key}_duration`] || errors[`${size.key}_price`]) && (
                        <div className="col-span-3">
                          {errors[`${size.key}_duration`] && <p className="text-red-500 text-sm">{errors[`${size.key}_duration`]}</p>}
                          {errors[`${size.key}_price`] && <p className="text-red-500 text-sm">{errors[`${size.key}_price`]}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Checklists Obrigatórios</h4>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiresEntryChecklist}
                  onChange={(e) => handleChange('requiresEntryChecklist', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Checklist de Entrada</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiresExitChecklist}
                  onChange={(e) => handleChange('requiresExitChecklist', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Checklist de Saída</span>
              </label>
            </div>
          </div>

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
              {service ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}