export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  address?: string;
  birthDate?: string;
  observations?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  type: VehicleType;
  size: VehicleSize;
  photos?: string[];
  createdAt: string;
}

export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'van' | 'suv';
export type VehicleSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface ServiceConfiguration {
  available: boolean;
  durationHours: number;
  durationMinutes: number;
  price: number;
}

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  type: ChecklistType;
  label: string;
  description?: string;
  required: boolean;
  vehicleTypes?: VehicleType[];
  serviceCategories?: ServiceCategory[];
}

export type ChecklistCategory = 'entry' | 'exit';
export type ChecklistType = 'visual' | 'functional' | 'documentation' | 'cleaning' | 'safety';

export interface ChecklistResponse {
  itemId: string;
  checked: boolean;
  observations?: string;
  photos?: string[];
  timestamp: string;
  responsiblePerson: string;
}

export interface AppointmentChecklist {
  appointmentId: string;
  entryChecklist: ChecklistResponse[];
  exitChecklist: ChecklistResponse[];
  entryCompletedAt?: string;
  exitCompletedAt?: string;
  entryResponsible?: string;
  exitResponsible?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  vehicleType: VehicleType;
  category: ServiceCategory;
  dryingTime?: number; // in minutes
  requiresEntryChecklist: boolean;
  requiresExitChecklist: boolean;
  customChecklistItems?: string[]; // IDs de itens específicos do serviço
  configurations: {
    small: ServiceConfiguration;
    medium: ServiceConfiguration;
    large: ServiceConfiguration;
    'extra-large': ServiceConfiguration;
  };
}

export type ServiceCategory = 'cleaning' | 'detailing' | 'painting' | 'protection' | 'repair';

export interface Appointment {
  id: string;
  clientId: string;
  vehicleId: string;
  serviceIds: string[];
  startDateTime: string;
  endDateTime: string;
  dryingEndDateTime?: string; // Para serviços com tempo de secagem
  status: AppointmentStatus;
  observations?: string;
  responsible?: string;
  totalPrice: number;
  createdAt: string;
}

export type AppointmentStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  duration: number; // in minutes
  reason?: string; // Motivo da indisponibilidade
}

export interface WorkingHours {
  start: string; // "08:00"
  end: string;   // "18:00"
  lunchStart?: string; // "12:00"
  lunchEnd?: string;   // "13:00"
}

export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  availableDuration: number; // em minutos
  canStartService: boolean;
  nextAvailableSlot?: string;
}

export interface DashboardMetrics {
  todayAppointments: number;
  weekRevenue: number;
  monthlyGrowth: number;
  utilization: number;
  nextAppointments: Appointment[];
}

export interface BusinessSettings {
  workingHours: WorkingHours;
  workingDays: number[]; // 0-6 (domingo a sábado)
  maxConcurrentServices: number;
  advanceBookingDays: number;
}