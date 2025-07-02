import React, { useState } from 'react';
import { X, Car, User, Calendar, Palette, Hash } from 'lucide-react';
import { Vehicle, VehicleType, VehicleSize, Client } from '../../types';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  clients: Client[];
  onSave: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function VehicleForm({ vehicle, clients, onSave, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    clientId: vehicle?.clientId || '',
    plate: vehicle?.plate || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    color: vehicle?.color || '',
    type: vehicle?.type || 'car' as VehicleType,
    size: vehicle?.size || 'medium' as VehicleSize,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const vehicleTypes: { value: VehicleType; label: string }[] = [
    { value: 'car', label: 'Carro' },
    { value: 'motorcycle', label: 'Moto' },
    { value: 'truck', label: 'Caminhão' },
    { value: 'van', label: 'Van' },
    { value: 'suv', label: 'SUV' },
  ];

  const vehicleSizes: { value: VehicleSize; label: string }[] = [
    { value: 'small', label: 'Pequeno' },
    { value: 'medium', label: 'Médio' },
    { value: 'large', label: 'Grande' },
    { value: 'extra-large', label: 'Extra Grande' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.plate.trim()) {
      newErrors.plate = 'Placa é obrigatória';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modelo é obrigatório';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Cor é obrigatória';
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Ano inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {vehicle ? 'Editar Veículo' : 'Novo Veículo'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Cliente *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Placa *
              </label>
              <input
                type="text"
                value={formData.plate}
                onChange={(e) => handleChange('plate', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.plate ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ABC-1234"
              />
              {errors.plate && <p className="text-red-500 text-sm mt-1">{errors.plate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="w-4 h-4 inline mr-2" />
                Marca *
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.brand ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Toyota, Honda, Ford..."
              />
              {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.model ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Corolla, Civic, Focus..."
              />
              {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Ano *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.year ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="w-4 h-4 inline mr-2" />
                Cor *
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.color ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Branco, Preto, Prata..."
              />
              {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Veículo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
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
                Porte do Veículo *
              </label>
              <select
                value={formData.size}
                onChange={(e) => handleChange('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {vehicleSizes.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
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
              {vehicle ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}