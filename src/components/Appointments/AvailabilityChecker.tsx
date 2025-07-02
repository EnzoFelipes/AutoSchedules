import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Vehicle, Service, Appointment, AvailabilitySlot } from '../../types';
import { 
  findAvailableSlots, 
  calculateServiceDuration, 
  formatDuration, 
  DEFAULT_BUSINESS_SETTINGS 
} from '../../utils/scheduling';

interface AvailabilityCheckerProps {
  selectedVehicle: Vehicle | null;
  selectedServices: Service[];
  appointments: Appointment[];
  onSlotSelect?: (slot: AvailabilitySlot) => void;
}

export function AvailabilityChecker({ 
  selectedVehicle, 
  selectedServices, 
  appointments, 
  onSlotSelect 
}: AvailabilityCheckerProps) {
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceDuration, setServiceDuration] = useState<{
    workDuration: number;
    dryingDuration: number;
    totalDuration: number;
  } | null>(null);

  useEffect(() => {
    if (selectedVehicle && selectedServices.length > 0) {
      checkAvailability();
    } else {
      setAvailableSlots([]);
      setServiceDuration(null);
    }
  }, [selectedVehicle, selectedServices, appointments]);

  const checkAvailability = async () => {
    if (!selectedVehicle || selectedServices.length === 0) return;

    setLoading(true);
    
    try {
      const serviceIds = selectedServices.map(s => s.id);
      const duration = calculateServiceDuration(serviceIds, selectedVehicle.size, selectedServices);
      setServiceDuration(duration);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Próximas 2 semanas

      const slots = findAvailableSlots(
        startDate,
        endDate,
        duration.workDuration,
        duration.dryingDuration,
        appointments,
        DEFAULT_BUSINESS_SETTINGS
      );

      setAvailableSlots(slots.slice(0, 10)); // Mostrar apenas os primeiros 10 slots
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSlotDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        weekday: 'short', 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getServiceCompletionTime = (slot: AvailabilitySlot) => {
    if (!serviceDuration) return '';
    
    const startTime = new Date(`${slot.date}T${slot.startTime}:00`);
    const workEndTime = new Date(startTime.getTime() + serviceDuration.workDuration * 60000);
    const completionTime = new Date(workEndTime.getTime() + serviceDuration.dryingDuration * 60000);
    
    return {
      workEnd: workEndTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      completion: completionTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      completionDate: completionTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    };
  };

  if (!selectedVehicle || selectedServices.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Selecione um veículo e serviços para verificar a disponibilidade</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo do Serviço */}
      {serviceDuration && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Duração do Serviço
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-blue-700">Tempo de Trabalho:</span>
              <p className="font-medium text-blue-900">{formatDuration(serviceDuration.workDuration)}</p>
            </div>
            {serviceDuration.dryingDuration > 0 && (
              <div>
                <span className="text-blue-700">Tempo de Secagem:</span>
                <p className="font-medium text-blue-900">{formatDuration(serviceDuration.dryingDuration)}</p>
              </div>
            )}
            <div>
              <span className="text-blue-700">Tempo Total:</span>
              <p className="font-medium text-blue-900">{formatDuration(serviceDuration.totalDuration)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status de Carregamento */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Verificando disponibilidade...</p>
        </div>
      )}

      {/* Slots Disponíveis */}
      {!loading && availableSlots.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Horários Disponíveis
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableSlots.map((slot, index) => {
              const completion = getServiceCompletionTime(slot);
              
              return (
                <button
                  key={index}
                  onClick={() => onSlotSelect?.(slot)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {formatSlotDate(slot.date)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  
                  {serviceDuration && serviceDuration.dryingDuration > 0 && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Trabalho finaliza às {completion.workEnd}</div>
                      <div>Pronto para entrega: {completion.completion} 
                        {completion.completionDate !== slot.date && ` (${completion.completionDate})`}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nenhum Slot Disponível */}
      {!loading && availableSlots.length === 0 && serviceDuration && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">
                Nenhum horário disponível
              </h4>
              <p className="text-sm text-yellow-800 mb-2">
                Não há horários disponíveis nas próximas 2 semanas para este serviço.
              </p>
              <div className="text-xs text-yellow-700">
                <p>• Duração necessária: {formatDuration(serviceDuration.workDuration)}</p>
                {serviceDuration.dryingDuration > 0 && (
                  <p>• Tempo de secagem: {formatDuration(serviceDuration.dryingDuration)}</p>
                )}
                <p>• Horário de funcionamento: 08:00 - 18:00 (pausa: 12:00 - 13:00)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}