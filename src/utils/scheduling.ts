import { Appointment, TimeSlot } from '../types';

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

export function calculateTimeSlots(appointments: Appointment[], durationMinutes: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const workStart = 8; // 8 AM
  const workEnd = 18; // 6 PM
  const slotInterval = 30; // 30 minutes

  for (let hour = workStart; hour < workEnd; hour++) {
    for (let minute = 0; minute < 60; minute += slotInterval) {
      const slotStart = new Date();
      slotStart.setHours(hour, minute, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      if (slotEnd.getHours() >= workEnd) continue;

      const available = !appointments.some(appointment => {
        const appointmentStart = new Date(appointment.startDateTime);
        const appointmentEnd = new Date(appointment.endDateTime);
        return slotStart < appointmentEnd && slotEnd > appointmentStart;
      });

      slots.push({
        start: slotStart.toTimeString().slice(0, 5),
        end: slotEnd.toTimeString().slice(0, 5),
        available,
        duration: durationMinutes,
      });
    }
  }

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