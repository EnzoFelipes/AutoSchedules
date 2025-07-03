import { Appointment, TimeSlot, WorkingHours, AvailabilitySlot, BusinessSettings } from '../types';

// Configurações padrão do negócio
export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  workingHours: {
    start: '08:00',
    end: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
  },
  workingDays: [1, 2, 3, 4, 5, 6], // Segunda a sábado
  maxConcurrentServices: 3,
  advanceBookingDays: 30,
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function hasConflict(appointment1: Appointment, appointment2: Appointment): boolean {
  const start1 = new Date(appointment1.startDateTime);
  const end1 = new Date(appointment1.endDateTime);
  const start2 = new Date(appointment2.startDateTime);
  const end2 = new Date(appointment2.endDateTime);

  return start1 < end2 && start2 < end1;
}

export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

export function timeToMinutes(timeString: string): number {
  const { hours, minutes } = parseTime(timeString);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function isWorkingDay(date: Date, settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS): boolean {
  return settings.workingDays.includes(date.getDay());
}

export function getWorkingMinutesInDay(settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS): number {
  const startMinutes = timeToMinutes(settings.workingHours.start);
  const endMinutes = timeToMinutes(settings.workingHours.end);
  
  let totalMinutes = endMinutes - startMinutes;
  
  // Subtrair horário de almoço se existir
  if (settings.workingHours.lunchStart && settings.workingHours.lunchEnd) {
    const lunchStart = timeToMinutes(settings.workingHours.lunchStart);
    const lunchEnd = timeToMinutes(settings.workingHours.lunchEnd);
    totalMinutes -= (lunchEnd - lunchStart);
  }
  
  return totalMinutes;
}

export function getWorkingPeriods(date: Date, settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = [];
  
  if (!isWorkingDay(date, settings)) {
    return periods;
  }
  
  const startTime = parseTime(settings.workingHours.start);
  const endTime = parseTime(settings.workingHours.end);
  
  const dayStart = new Date(date);
  dayStart.setHours(startTime.hours, startTime.minutes, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(endTime.hours, endTime.minutes, 0, 0);
  
  if (settings.workingHours.lunchStart && settings.workingHours.lunchEnd) {
    const lunchStart = parseTime(settings.workingHours.lunchStart);
    const lunchEnd = parseTime(settings.workingHours.lunchEnd);
    
    const morningEnd = new Date(date);
    morningEnd.setHours(lunchStart.hours, lunchStart.minutes, 0, 0);
    
    const afternoonStart = new Date(date);
    afternoonStart.setHours(lunchEnd.hours, lunchEnd.minutes, 0, 0);
    
    // Período da manhã
    periods.push({ start: dayStart, end: morningEnd });
    
    // Período da tarde
    periods.push({ start: afternoonStart, end: dayEnd });
  } else {
    // Dia inteiro sem pausa para almoço
    periods.push({ start: dayStart, end: dayEnd });
  }
  
  return periods;
}

export function calculateServiceDuration(serviceIds: string[], vehicleSize: string, services: any[]): {
  workDuration: number;
  dryingDuration: number;
  totalDuration: number;
} {
  let workDuration = 0;
  let dryingDuration = 0;
  
  serviceIds.forEach(serviceId => {
    const service = services.find(s => s.id === serviceId);
    if (service && service.configurations && service.configurations[vehicleSize]) {
      const config = service.configurations[vehicleSize];
      workDuration += (config.durationHours * 60) + config.durationMinutes;
      
      if (service.dryingTime) {
        dryingDuration = Math.max(dryingDuration, service.dryingTime);
      }
    }
  });
  
  return {
    workDuration,
    dryingDuration,
    totalDuration: workDuration + dryingDuration,
  };
}

/**
 * Calcula quando o trabalho ativo terminará, considerando horários de funcionamento
 * CORRIGIDO: Para serviços simples que cabem no mesmo dia
 */
export function calculateWorkEndTime(
  startDateTime: Date,
  workDurationMinutes: number,
  settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS
): Date {
  let remainingWork = workDurationMinutes;
  let currentTime = new Date(startDateTime);
  
  // Para debug
  console.log(`🔧 Calculando fim do trabalho:`);
  console.log(`   Início: ${currentTime.toLocaleString('pt-BR')}`);
  console.log(`   Duração: ${workDurationMinutes} minutos (${Math.floor(workDurationMinutes/60)}h ${workDurationMinutes%60}min)`);
  
  while (remainingWork > 0) {
    const workingPeriods = getWorkingPeriods(currentTime, settings);
    console.log(`   Verificando dia: ${currentTime.toLocaleDateString('pt-BR')}`);
    console.log(`   Períodos de trabalho: ${workingPeriods.length}`);
    
    let workedInThisDay = false;
    
    for (const period of workingPeriods) {
      if (remainingWork <= 0) break;
      
      console.log(`   Período: ${period.start.toLocaleTimeString('pt-BR')} - ${period.end.toLocaleTimeString('pt-BR')}`);
      
      // Determinar quando começar a trabalhar neste período
      let workStartTime: Date;
      
      if (currentTime >= period.start && currentTime < period.end) {
        // Trabalho começa no horário atual (dentro do período)
        workStartTime = new Date(currentTime);
        console.log(`   Trabalho continua de onde parou: ${workStartTime.toLocaleTimeString('pt-BR')}`);
      } else if (currentTime < period.start) {
        // Trabalho começa no início do período
        workStartTime = new Date(period.start);
        console.log(`   Trabalho começa no início do período: ${workStartTime.toLocaleTimeString('pt-BR')}`);
      } else {
        // currentTime >= period.end - período já passou
        console.log(`   Período já passou, pulando...`);
        continue;
      }
      
      // Calcular quanto tempo disponível neste período
      const availableMinutesInPeriod = Math.floor((period.end.getTime() - workStartTime.getTime()) / (1000 * 60));
      console.log(`   Tempo disponível no período: ${availableMinutesInPeriod} minutos`);
      
      if (availableMinutesInPeriod <= 0) {
        console.log(`   Sem tempo disponível neste período`);
        continue;
      }
      
      const workInThisPeriod = Math.min(remainingWork, availableMinutesInPeriod);
      console.log(`   Trabalho neste período: ${workInThisPeriod} minutos`);
      
      if (workInThisPeriod >= remainingWork) {
        // Trabalho termina neste período
        const endTime = new Date(workStartTime.getTime() + remainingWork * 60000);
        console.log(`   ✅ Trabalho termina: ${endTime.toLocaleString('pt-BR')}`);
        return endTime;
      } else {
        // Trabalho continua no próximo período
        remainingWork -= workInThisPeriod;
        currentTime = new Date(period.end);
        workedInThisDay = true;
        console.log(`   Trabalho restante: ${remainingWork} minutos`);
        console.log(`   Próximo horário: ${currentTime.toLocaleString('pt-BR')}`);
      }
    }
    
    // Se chegamos aqui e não trabalhamos neste dia, precisamos ir para o próximo dia útil
    if (!workedInThisDay) {
      console.log(`   Nenhum trabalho possível hoje, indo para próximo dia útil`);
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(0, 0, 0, 0);
      
      // Encontrar o próximo dia útil
      while (!isWorkingDay(currentTime, settings)) {
        currentTime.setDate(currentTime.getDate() + 1);
      }
      
      // Definir para o início do expediente
      const startTime = parseTime(settings.workingHours.start);
      currentTime.setHours(startTime.hours, startTime.minutes, 0, 0);
      console.log(`   Próximo dia útil: ${currentTime.toLocaleString('pt-BR')}`);
    }
  }
  
  console.log(`   ✅ Trabalho finalizado: ${currentTime.toLocaleString('pt-BR')}`);
  return currentTime;
}

/**
 * Verifica se um serviço pode ser agendado em um horário específico
 */
export function canScheduleService(
  startDateTime: Date,
  workDurationMinutes: number,
  dryingDurationMinutes: number,
  existingAppointments: Appointment[],
  settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS
): {
  canSchedule: boolean;
  workEndTime: Date;
  serviceCompleteTime: Date;
  conflicts: string[];
} {
  const conflicts: string[] = [];
  
  // Verificar se o horário de início está dentro do expediente
  const startDate = new Date(startDateTime);
  const workingPeriods = getWorkingPeriods(startDate, settings);
  const isInWorkingHours = workingPeriods.some(period => 
    startDateTime >= period.start && startDateTime < period.end
  );
  
  if (!isInWorkingHours) {
    conflicts.push('Horário de início fora do expediente');
  }
  
  // Calcular quando o trabalho ativo terminará
  const workEndTime = calculateWorkEndTime(startDateTime, workDurationMinutes, settings);
  
  // Calcular quando o serviço estará completamente pronto (incluindo secagem)
  const serviceCompleteTime = new Date(workEndTime.getTime() + dryingDurationMinutes * 60000);
  
  // Verificar conflitos com outros agendamentos durante o período de trabalho
  const workConflicts = existingAppointments.filter(apt => {
    if (apt.status === 'cancelled') return false;
    
    const aptStart = new Date(apt.startDateTime);
    const aptEnd = new Date(apt.endDateTime);
    
    return startDateTime < aptEnd && workEndTime > aptStart;
  });
  
  if (workConflicts.length > 0) {
    conflicts.push(`Conflito durante execução do trabalho com ${workConflicts.length} agendamento(s)`);
  }
  
  // Verificar conflitos durante o período de secagem (se houver)
  if (dryingDurationMinutes > 0) {
    const dryingConflicts = existingAppointments.filter(apt => {
      if (apt.status === 'cancelled') return false;
      
      const aptStart = new Date(apt.startDateTime);
      const aptDryingEnd = apt.dryingEndDateTime ? new Date(apt.dryingEndDateTime) : new Date(apt.endDateTime);
      
      return workEndTime < aptDryingEnd && serviceCompleteTime > aptStart;
    });
    
    if (dryingConflicts.length > 0) {
      conflicts.push(`Conflito durante secagem com ${dryingConflicts.length} agendamento(s)`);
    }
  }
  
  return {
    canSchedule: conflicts.length === 0,
    workEndTime,
    serviceCompleteTime,
    conflicts,
  };
}

export function findAvailableSlots(
  startDate: Date,
  endDate: Date,
  requiredWorkMinutes: number,
  dryingMinutes: number,
  appointments: Appointment[],
  settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS
): AvailabilitySlot[] {
  const availableSlots: AvailabilitySlot[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate, settings)) {
      const daySlots = findDaySlotsForService(
        currentDate,
        requiredWorkMinutes,
        dryingMinutes,
        appointments,
        settings
      );
      availableSlots.push(...daySlots);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return availableSlots;
}

export function findDaySlotsForService(
  date: Date,
  requiredWorkMinutes: number,
  dryingMinutes: number,
  appointments: Appointment[],
  settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const workingPeriods = getWorkingPeriods(date, settings);
  
  workingPeriods.forEach(period => {
    const periodSlots = findPeriodSlots(
      period,
      requiredWorkMinutes,
      dryingMinutes,
      appointments,
      settings
    );
    slots.push(...periodSlots);
  });
  
  return slots;
}

export function findPeriodSlots(
  period: { start: Date; end: Date },
  requiredWorkMinutes: number,
  dryingMinutes: number,
  appointments: Appointment[],
  settings: BusinessSettings
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const slotInterval = 30; // Verificar a cada 30 minutos
  
  let currentTime = new Date(period.start);
  const now = new Date();
  
  // Se for hoje, começar do horário atual (arredondado para próximos 30 min)
  if (currentTime.toDateString() === now.toDateString()) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const nextSlotMinutes = Math.ceil(currentMinutes / slotInterval) * slotInterval;
    
    const nextSlotTime = new Date(now);
    nextSlotTime.setHours(Math.floor(nextSlotMinutes / 60), nextSlotMinutes % 60, 0, 0);
    
    if (nextSlotTime > currentTime && nextSlotTime < period.end) {
      currentTime = nextSlotTime;
    }
  }
  
  while (currentTime < period.end) {
    const scheduleCheck = canScheduleService(
      currentTime,
      requiredWorkMinutes,
      dryingMinutes,
      appointments,
      settings
    );
    
    if (scheduleCheck.canSchedule) {
      slots.push({
        date: currentTime.toISOString().split('T')[0],
        startTime: currentTime.toTimeString().slice(0, 5),
        endTime: scheduleCheck.workEndTime.toTimeString().slice(0, 5),
        availableDuration: requiredWorkMinutes,
        canStartService: true,
      });
    }
    
    currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
  }
  
  return slots;
}

export function getNextAvailableSlot(
  serviceIds: string[],
  vehicleSize: string,
  services: any[],
  appointments: Appointment[],
  settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS
): AvailabilitySlot | null {
  const { workDuration, dryingDuration } = calculateServiceDuration(serviceIds, vehicleSize, services);
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + settings.advanceBookingDays);
  
  const availableSlots = findAvailableSlots(
    startDate,
    endDate,
    workDuration,
    dryingDuration,
    appointments,
    settings
  );
  
  return availableSlots.length > 0 ? availableSlots[0] : null;
}

export function calculateTimeSlots(appointments: Appointment[], durationMinutes: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const settings = DEFAULT_BUSINESS_SETTINGS;
  const today = new Date();
  
  const workingPeriods = getWorkingPeriods(today, settings);
  
  workingPeriods.forEach(period => {
    let currentTime = new Date(period.start);
    
    while (currentTime < period.end) {
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);
      
      if (slotEnd <= period.end) {
        const available = !appointments.some(appointment => {
          const appointmentStart = new Date(appointment.startDateTime);
          const appointmentEnd = new Date(appointment.endDateTime);
          return currentTime < appointmentEnd && slotEnd > appointmentStart;
        });
        
        slots.push({
          start: currentTime.toTimeString().slice(0, 5),
          end: slotEnd.toTimeString().slice(0, 5),
          available,
          duration: durationMinutes,
          reason: available ? undefined : 'Horário ocupado',
        });
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
  });
  
  return slots;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateTime(dateTime: string): string {
  return new Date(dateTime).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
}

export function getVehicleTypeLabel(type: string): string {
  const labels = {
    car: 'Carro',
    motorcycle: 'Moto',
    truck: 'Caminhão',
    van: 'Van',
    suv: 'SUV',
  };
  return labels[type as keyof typeof labels] || type;
}

export function getVehicleSizeLabel(size: string): string {
  const labels = {
    small: 'Pequeno',
    medium: 'Médio',
    large: 'Grande',
    'extra-large': 'Extra Grande',
  };
  return labels[size as keyof typeof labels] || size;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'in-progress': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: string): string {
  const labels = {
    scheduled: 'Agendado',
    'in-progress': 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };
  return labels[status as keyof typeof labels] || status;
}