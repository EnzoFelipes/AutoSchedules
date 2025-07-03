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

      // Start from today (allow today's appointments if time permits)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Próximas 4 semanas (mais opções)

      const slots = findAvailableSlots(
        startDate,
        endDate,
        duration.workDuration,
        duration.dryingDuration,
        appointments,
        DEFAULT_BUSINESS_SETTINGS
      );

      // Show more slots (up to 20 instead of 10)
      setAvailableSlots(slots.slice(0, 20));
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

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupSlotsByDate = (slots: AvailabilitySlot[]) => {
    const grouped: Record<string, AvailabilitySlot[]> = {};
    
    slots.forEach(slot => {
      const dateKey = slot.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    
    return grouped;
  };

  if (!selectedVehicle || selectedServices.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Selecione um veículo e serviços para verificar a disponibilidade</p>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(availableSlots);
  const todaySlots = groupedSlots[new Date().toISOString().split('T')[0]] || [];

  return (
    <div className="space-y-4">
      {/* Data e Hora Atual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-800">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Hoje: {getTodayDate()}</span>
          </div>
          <div className="text-blue-700 text-sm">
            <Clock className="w-4 h-4 inline mr-1" />
            {getCurrentTime()}
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          ✅ Agendamentos para hoje são permitidos se houver tempo disponível
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

      {/* Horários de Hoje (se disponíveis) */}
      {todaySlots.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Disponível Hoje ({todaySlots.length} horário{todaySlots.length !== 1 ? 's' : ''})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {todaySlots.map((slot, index) => {
              const details = getServiceCompletionDetails(slot);
              
              return (
                <button
                  key={index}
                  onClick={() => onSlotSelect?.(slot)}
                  className="p-2 border border-green-300 rounded-lg hover:bg-green-100 transition-colors text-left"
                >
                  <div className="font-medium text-green-900 text-sm">
                    {slot.startTime}
                  </div>
                  {details && (
                    <div className="text-xs text-green-700 mt-1">
                      Termina: {details.workEnd}
                      {details.workSpansMultipleDays && ' (amanhã)'}
                    </div>
                  )}
                </button>
              );
            })}
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
                <p>• Hoje: permitido se houver tempo suficiente</p>
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

      {/* Todos os Slots Disponíveis */}
      {!loading && availableSlots.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Todos os Horários Disponíveis
            </span>
            <span className="text-sm text-gray-500">
              {availableSlots.length} opções (próximos 30 dias)
            </span>
          </h4>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedSlots).map(([date, slots]) => {
              const isToday = date === new Date().toISOString().split('T')[0];
              
              if (isToday && todaySlots.length > 0) {
                return null; // Já mostrado acima
              }
              
              return (
                <div key={date} className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatSlotDate(date)} - {new Date(date).toLocaleDateString('pt-BR')}
                    <span className="ml-2 text-sm text-gray-500">
                      ({slots.length} horário{slots.length !== 1 ? 's' : ''})
                    </span>
                  </h5>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {slots.map((slot, index) => {
                      const details = getServiceCompletionDetails(slot);
                      
                      return (
                        <button
                          key={index}
                          onClick={() => onSlotSelect?.(slot)}
                          className="p-2 border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="font-medium text-gray-900 text-sm">
                            {slot.startTime}
                          </div>
                          {details && (
                            <div className="text-xs text-gray-600 mt-1">
                              <div>Termina: {details.workEnd}</div>
                              {details.workSpansMultipleDays && (
                                <div className="text-blue-600">📅 Múltiplos dias</div>
                              )}
                              {serviceDuration && serviceDuration.dryingDuration > 0 && (
                                <div className="text-orange-600">
                                  Pronto: {details.completion}
                                  {details.completionSpansMultipleDays && ` (${details.completionDate})`}
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
                Não há horários disponíveis nos próximos 30 dias para este serviço.
              </p>
              <div className="text-xs text-yellow-700">
                <p>• Duração do trabalho: {formatDuration(serviceDuration.workDuration)}</p>
                {serviceDuration.dryingDuration > 0 && (
                  <p>• Tempo de secagem: {formatDuration(serviceDuration.dryingDuration)}</p>
                )}
                <p>• Horário de funcionamento: {getWorkingHoursInfo()}</p>
                <p>• Trabalho ativo apenas durante expediente</p>
                <p>• Secagem pode continuar 24h</p>
                <p>• Incluindo agendamentos para hoje</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}