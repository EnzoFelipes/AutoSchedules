import { useState, useCallback } from 'react';
import { Appointment, TimeSlot } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId, calculateTimeSlots, hasConflict } from '../utils/scheduling';

export function useAppointments() {
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [loading, setLoading] = useState(false);

  const createAppointment = useCallback((appointment: Omit<Appointment, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      const newAppointment: Appointment = {
        ...appointment,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      // Check for conflicts
      const conflict = appointments.find(existing => 
        hasConflict(existing, newAppointment) && existing.status !== 'cancelled'
      );

      if (conflict) {
        throw new Error('Conflito de horário detectado');
      }

      setAppointments(prev => [...prev, newAppointment]);
      return newAppointment;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [appointments, setAppointments]);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setLoading(true);
    try {
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? { ...appointment, ...updates } : appointment
        )
      );
    } finally {
      setLoading(false);
    }
  }, [setAppointments]);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));
  }, [setAppointments]);

  const getAvailableTimeSlots = useCallback((date: string, durationMinutes: number): TimeSlot[] => {
    const dateAppointments = appointments.filter(appointment => 
      appointment.startDateTime.startsWith(date) && appointment.status !== 'cancelled'
    );
    
    return calculateTimeSlots(dateAppointments, durationMinutes);
  }, [appointments]);

  const getAppointmentsByDate = useCallback((date: string) => {
    return appointments.filter(appointment => 
      appointment.startDateTime.startsWith(date) && appointment.status !== 'cancelled'
    ).sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  }, [appointments]);

  const getTodayAppointments = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return getAppointmentsByDate(today);
  }, [getAppointmentsByDate]);

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAvailableTimeSlots,
    getAppointmentsByDate,
    getTodayAppointments,
  };
}