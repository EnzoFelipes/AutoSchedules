import { Client, Vehicle, Service, Appointment } from '../types';

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '(11) 99999-9999',
    email: 'joao.silva@email.com',
    cpf: '123.456.789-00',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '(11) 88888-8888',
    email: 'maria.santos@email.com',
    cpf: '987.654.321-00',
    address: 'Av. Paulista, 456 - São Paulo, SP',
    createdAt: '2024-01-20T14:15:00Z',
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    phone: '(11) 77777-7777',
    email: 'carlos.oliveira@email.com',
    cpf: '456.789.123-00',
    address: 'Rua Augusta, 789 - São Paulo, SP',
    createdAt: '2024-01-22T16:45:00Z',
  },
];

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    clientId: '1',
    plate: 'ABC-1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    color: 'Prata',
    type: 'car',
    size: 'medium',
    createdAt: '2024-01-15T10:35:00Z',
  },
  {
    id: '2',
    clientId: '2',
    plate: 'XYZ-5678',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    color: 'Preto',
    type: 'car',
    size: 'medium',
    createdAt: '2024-01-20T14:20:00Z',
  },
  {
    id: '3',
    clientId: '3',
    plate: 'DEF-9012',
    brand: 'Ford',
    model: 'Ranger',
    year: 2019,
    color: 'Branco',
    type: 'truck',
    size: 'large',
    createdAt: '2024-01-22T16:50:00Z',
  },
];

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Lavagem Completa',
    description: 'Lavagem externa e interna completa do veículo',
    vehicleType: 'car',
    category: 'cleaning',
    requiresEntryChecklist: true,
    requiresExitChecklist: true,
    configurations: {
      small: { available: true, durationHours: 1, durationMinutes: 0, price: 35.00 },
      medium: { available: true, durationHours: 1, durationMinutes: 30, price: 50.00 },
      large: { available: true, durationHours: 2, durationMinutes: 0, price: 70.00 },
      'extra-large': { available: true, durationHours: 2, durationMinutes: 30, price: 90.00 },
    },
  },
  {
    id: '2',
    name: 'Enceramento Premium',
    description: 'Aplicação de cera protetora de alta qualidade',
    vehicleType: 'car',
    category: 'protection',
    requiresEntryChecklist: true,
    requiresExitChecklist: true,
    configurations: {
      small: { available: true, durationHours: 1, durationMinutes: 30, price: 60.00 },
      medium: { available: true, durationHours: 2, durationMinutes: 0, price: 80.00 },
      large: { available: true, durationHours: 2, durationMinutes: 30, price: 100.00 },
      'extra-large': { available: false, durationHours: 0, durationMinutes: 0, price: 0 },
    },
  },
  {
    id: '3',
    name: 'Pintura de Retoque',
    description: 'Retoque de pintura em pequenas áreas danificadas',
    vehicleType: 'car',
    category: 'painting',
    dryingTime: 120,
    requiresEntryChecklist: true,
    requiresExitChecklist: true,
    configurations: {
      small: { available: true, durationHours: 2, durationMinutes: 0, price: 150.00 },
      medium: { available: true, durationHours: 3, durationMinutes: 0, price: 200.00 },
      large: { available: true, durationHours: 4, durationMinutes: 0, price: 280.00 },
      'extra-large': { available: true, durationHours: 5, durationMinutes: 0, price: 350.00 },
    },
  },
  {
    id: '4',
    name: 'Detalhamento Interno',
    description: 'Limpeza detalhada do interior com produtos especializados',
    vehicleType: 'car',
    category: 'detailing',
    requiresEntryChecklist: true,
    requiresExitChecklist: true,
    configurations: {
      small: { available: true, durationHours: 1, durationMinutes: 0, price: 80.00 },
      medium: { available: true, durationHours: 1, durationMinutes: 30, price: 120.00 },
      large: { available: true, durationHours: 2, durationMinutes: 0, price: 160.00 },
      'extra-large': { available: true, durationHours: 2, durationMinutes: 30, price: 200.00 },
    },
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    clientId: '1',
    vehicleId: '1',
    serviceIds: ['1'],
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 5400000).toISOString(), // +1.5h
    status: 'scheduled',
    observations: 'Cliente preferencial',
    responsible: 'Carlos',
    totalPrice: 50.00,
    createdAt: '2024-01-25T09:00:00Z',
  },
  {
    id: '2',
    clientId: '2',
    vehicleId: '2',
    serviceIds: ['1', '2'],
    startDateTime: new Date(Date.now() + 7200000).toISOString(), // +2h
    endDateTime: new Date(Date.now() + 19800000).toISOString(), // +5.5h
    status: 'scheduled',
    observations: 'Verificar riscos na lateral',
    responsible: 'Ana',
    totalPrice: 130.00,
    createdAt: '2024-01-25T10:30:00Z',
  },
  {
    id: '3',
    clientId: '3',
    vehicleId: '3',
    serviceIds: ['3'],
    startDateTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    endDateTime: new Date(Date.now() + 86400000 + 14400000).toISOString(), // tomorrow + 4h
    status: 'scheduled',
    observations: 'Retoque no para-choque traseiro',
    responsible: 'João',
    totalPrice: 280.00,
    createdAt: '2024-01-25T11:15:00Z',
  },
];