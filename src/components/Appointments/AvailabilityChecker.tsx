import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Vehicle, Service, Appointment, AvailabilitySlot } from '../../types';
import { 
  findAvailableSlots, 
  calculateServiceDuration, 
  formatDuration, 
  DEFAULT_BUSINESS_SETTINGS,
  calculateWorkEndTime,
  canScheduleService
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

      // Start from tomorrow to avoid past dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
      
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

  const getServiceCompletionDetails = (slot: AvailabilitySlot) => {
    if (!serviceDuration) return null;
    
    const startTime = new Date(`${slot.date}T${slot.startTime}:00`);
    const workEndTime = calculateWorkEndTime(startTime, serviceDuration.workDuration, DEFAULT_BUSINESS_SETTINGS);
    const completionTime = new Date(workEndTime.getTime() + serviceDuration.dryingDuration * 60000);
    
    const workEndDate = workEndTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const completionDate = completionTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const slotDate = new Date(slot.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    return {
      workEnd: workEndTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      workEndDate,
      completion: completionTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      completionDate,
      workSpansMultipleDays: workEndDate !== slotDate,
      completionSpansMultipleDays: completionDate !== workEndDate,
    };
  };

  const getWorkingHoursInfo = () => {
    const settings = DEFAULT_BUSINESS_SETTINGS;
    return `${settings.workingHours.start} - ${settings.workingHours.end}${
      settings.workingHours.lunchStart ? ` (pausa: ${settings.workingHours.lunchStart} - ${settings.workingHours.lunchEnd})` : ''
    }`;
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
      {/* Data Atual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-blue-800">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Hoje: {getTodayDate()}</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          ⚠️ Agendamentos só podem ser feitos para datas futuras
        </p>
      </div>

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
              <p className="text-xs text-blue-600">Durante horário comercial</p>
            </div>
            {serviceDuration.dryingDuration > 0 && (
              <div>
                <span className="text-blue-700">Tempo de Secagem:</span>
                <p className="font-medium text-blue-900">{formatDuration(serviceDuration.dryingDuration)}</p>
                <p className="text-xs text-blue-600">Pode ser durante a madrugada</p>
              </div>
            )}
            <div>
              <span className="text-blue-700">Horário de Trabalho:</span>
              <p className="font-medium text-blue-900">{getWorkingHoursInfo()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Explicação do Sistema */}
      {serviceDuration && serviceDuration.workDuration > 480 && ( // Mais de 8 horas
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">
                Serviço de Longa Duração
              </h4>
              <p className="text-sm text-amber-800 mb-2">
                Este serviço requer mais de um dia de trabalho. O sistema automaticamente distribui o trabalho pelos dias úteis disponíveis.
              </p>
              <div className="text-xs text-amber-700">
                <p>• Trabalho ativo: apenas durante horário comercial</p>
                <p>• Secagem: pode continuar durante a madrugada</p>
                <p>• Agendamento: considera feriados e fins de semana</p>
                <p>• Datas passadas: não permitidas</p>
              </div>
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
            Horários Disponíveis (Próximos Dias)
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableSlots.map((slot, index) => {
              const details = getServiceCompletionDetails(slot);
              const slotDate = new Date(slot.date);
              const isToday = slotDate.toDateString() === new Date().toDateString();
              
              return (
                <button
                  key={index}
                  onClick={() => onSlotSelect?.(slot)}
                  disabled={isToday}
                  className={`w-full text-left p-3 border rounded-lg transition-colors ${
                    isToday 
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {formatSlotDate(slot.date)}
                        {isToday && <span className="text-red-500 ml-2">(Não disponível)</span>}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      Início: {slot.startTime}
                    </span>
                  </div>
                  
                  {details && !isToday && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Trabalho finaliza:</span>
                        <span className="font-medium">
                          {details.workEnd}
                          {details.workSpansMultipleDays && ` (${details.workEndDate})`}
                        </span>
                      </div>
                      
                      {serviceDuration && serviceDuration.dryingDuration > 0 && (
                        <div className="flex items-center justify-between text-orange-600">
                          <span>Pronto para entrega:</span>
                          <span className="font-medium">
                            {details.completion}
                            {details.completionSpansMultipleDays && ` (${details.completionDate})`}
                          </span>
                        </div>
                      )}
                      
                      {details.workSpansMultipleDays && (
                        <div className="text-blue-600 text-xs mt-1">
                          ⚠️ Trabalho distribuído em múltiplos dias
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isToday && (
                    <div className="text-xs text-red-500 mt-1">
                      Agendamentos para hoje não são permitidos
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
                <p>• Duração do trabalho: {formatDuration(serviceDuration.workDuration)}</p>
                {serviceDuration.dryingDuration > 0 && (
                  <p>• Tempo de secagem: {formatDuration(serviceDuration.dryingDuration)}</p>
                )}
                <p>• Horário de funcionamento: {getWorkingHoursInfo()}</p>
                <p>• Trabalho ativo apenas durante expediente</p>
                <p>• Secagem pode continuar 24h</p>
                <p>• Agendamentos apenas para datas futuras</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}