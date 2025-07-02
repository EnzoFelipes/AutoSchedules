import React from 'react';
import { Clock, User, Car, Calendar } from 'lucide-react';
import { Appointment } from '../../types';
import { mockClients, mockVehicles, mockServices } from '../../data/mockData';
import { formatDateTime, getStatusColor, getStatusLabel } from '../../utils/scheduling';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  const getAppointmentDetails = (appointment: Appointment) => {
    const client = mockClients.find(c => c.id === appointment.clientId);
    const vehicle = mockVehicles.find(v => v.id === appointment.vehicleId);
    const services = mockServices.filter(s => appointment.serviceIds.includes(s.id));
    
    return { client, vehicle, services };
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendamentos de Hoje</h3>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum agendamento para hoje</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Agendamentos de Hoje</h3>
        <span className="text-sm text-gray-500">{appointments.length} serviços</span>
      </div>
      
      <div className="space-y-4">
        {appointments.map((appointment) => {
          const { client, vehicle, services } = getAppointmentDetails(appointment);
          
          return (
            <div
              key={appointment.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{client?.name || 'Cliente não encontrado'}</h4>
                    <p className="text-sm text-gray-500">{client?.phone}</p>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDateTime(appointment.startDateTime)}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Car className="w-4 h-4" />
                  <span>{vehicle?.brand} {vehicle?.model} - {vehicle?.plate}</span>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {services.map(s => s.name).join(', ')}
                    </p>
                    {appointment.observations && (
                      <p className="text-xs text-gray-500 mt-1">{appointment.observations}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      R$ {appointment.totalPrice.toFixed(2)}
                    </p>
                    {appointment.responsible && (
                      <p className="text-xs text-gray-500">Resp: {appointment.responsible}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}