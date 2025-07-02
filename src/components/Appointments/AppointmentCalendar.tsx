import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Clock, User, Car, List, Grid } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatDateTime, getStatusColor, getStatusLabel } from '../../utils/scheduling';
import { mockClients, mockVehicles, mockServices } from '../../data/mockData';
import { AppointmentForm } from './AppointmentForm';
import { Appointment } from '../../types';

export function AppointmentCalendar() {
  const { getAppointmentsByDate } = useAppointments();
  const [clients] = useLocalStorage('clients', mockClients);
  const [vehicles] = useLocalStorage('vehicles', mockVehicles);
  const [services] = useLocalStorage('services', mockServices);
  const [appointments, setAppointments] = useLocalStorage('appointments', []);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const appointmentsForDate = getAppointmentsByDate(selectedDate);
  const allAppointments = appointments.filter((apt: Appointment) => apt.status !== 'cancelled');

  const handleSave = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    if (editingAppointment) {
      setAppointments((prev: Appointment[]) => prev.map(a => 
        a.id === editingAppointment.id 
          ? { ...appointmentData, id: editingAppointment.id, createdAt: editingAppointment.createdAt }
          : a
      ));
    } else {
      const newAppointment: Appointment = {
        ...appointmentData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setAppointments((prev: Appointment[]) => [...prev, newAppointment]);
    }
    setShowForm(false);
    setEditingAppointment(null);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = (appointmentId: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      setAppointments((prev: Appointment[]) => prev.filter(a => a.id !== appointmentId));
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDayAppointments = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return getAppointmentsByDate(dateStr);
  };

  const getAppointmentDetails = (appointment: any) => {
    const client = clients.find(c => c.id === appointment.clientId);
    const vehicle = vehicles.find(v => v.id === appointment.vehicleId);
    const appointmentServices = services.filter(s => appointment.serviceIds.includes(s.id));
    return { client, vehicle, services: appointmentServices };
  };

  const days = getDaysInMonth(currentMonth);

  const renderCalendarView = () => (
    <>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-3 text-center font-medium text-gray-500 text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayAppointments = getDayAppointments(day.date);
          const isSelected = day.date.toISOString().split('T')[0] === selectedDate;
          const isToday = day.date.toDateString() === new Date().toDateString();
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDate(day.date.toISOString().split('T')[0])}
              className={`p-2 min-h-[100px] border border-gray-100 hover:bg-gray-50 transition-colors relative flex flex-col ${
                !day.isCurrentMonth ? 'text-gray-300 bg-gray-50' : 'text-gray-900 bg-white'
              } ${
                isSelected ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200' : ''
              } ${
                isToday ? 'font-bold border-blue-300' : ''
              }`}
            >
              <div className={`text-sm mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {day.date.getDate()}
              </div>
              
              {/* Appointment indicators */}
              <div className="flex-1 w-full space-y-1">
                {dayAppointments.slice(0, 3).map((appointment, idx) => {
                  const { client } = getAppointmentDetails(appointment);
                  const time = new Date(appointment.startDateTime).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  
                  return (
                    <div
                      key={appointment.id}
                      className={`text-xs p-1 rounded truncate ${
                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                      title={`${time} - ${client?.name || 'Cliente'}`}
                    >
                      <div className="font-medium">{time}</div>
                      <div className="truncate">{client?.name || 'Cliente'}</div>
                    </div>
                  );
                })}
                
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details */}
      <div className="mt-6 border-t pt-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Agendamentos para {new Date(selectedDate).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({appointmentsForDate.length} agendamento{appointmentsForDate.length !== 1 ? 's' : ''})
          </span>
        </h4>
        
        {appointmentsForDate.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhum agendamento para este dia</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Criar agendamento para esta data
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointmentsForDate
              .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
              .map(appointment => {
                const { client, vehicle, services: appointmentServices } = getAppointmentDetails(appointment);
                const startTime = new Date(appointment.startDateTime);
                const endTime = new Date(appointment.endDateTime);
                
                return (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{client?.name || 'Cliente não encontrado'}</h5>
                          <p className="text-sm text-gray-500">{client?.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                        <button
                          onClick={() => handleEdit(appointment)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(appointment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                          {endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{vehicle?.brand} {vehicle?.model} - {vehicle?.plate}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Serviços: {appointmentServices.map(s => s.name).join(', ')}
                          </p>
                          {appointment.responsible && (
                            <p className="text-xs text-gray-500">Responsável: {appointment.responsible}</p>
                          )}
                          {appointment.observations && (
                            <p className="text-xs text-gray-500 mt-1">{appointment.observations}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            R$ {appointment.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );

  const renderListView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Todos os Agendamentos ({allAppointments.length})
        </h3>
        <div className="text-sm text-gray-500">
          Ordenados por data e hora
        </div>
      </div>
      
      {allAppointments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h4>
          <p className="mb-4">Comece criando seu primeiro agendamento</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar Agendamento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {allAppointments
            .sort((a: Appointment, b: Appointment) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
            .map((appointment: Appointment) => {
              const { client, vehicle, services: appointmentServices } = getAppointmentDetails(appointment);
              const appointmentDate = new Date(appointment.startDateTime);
              const isToday = appointmentDate.toDateString() === new Date().toDateString();
              const isPast = appointmentDate < new Date();
              const isTomorrow = appointmentDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              
              return (
                <div
                  key={appointment.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    isToday ? 'border-blue-200 bg-blue-50' : 
                    isTomorrow ? 'border-green-200 bg-green-50' :
                    isPast ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-blue-100' : 
                        isTomorrow ? 'bg-green-100' :
                        'bg-gray-100'
                      }`}>
                        <User className={`w-5 h-5 ${
                          isToday ? 'text-blue-600' : 
                          isTomorrow ? 'text-green-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{client?.name || 'Cliente não encontrado'}</h4>
                        <p className="text-sm text-gray-500">{client?.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isToday && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                          HOJE
                        </span>
                      )}
                      {isTomorrow && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                          AMANHÃ
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                      <button
                        onClick={() => handleEdit(appointment)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{appointmentDate.toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(appointment.endDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4" />
                      <span>{vehicle?.brand} {vehicle?.model} - {vehicle?.plate}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Serviços: {appointmentServices.map(s => s.name).join(', ')}
                        </p>
                        {appointment.responsible && (
                          <p className="text-xs text-gray-500">Responsável: {appointment.responsible}</p>
                        )}
                        {appointment.observations && (
                          <p className="text-xs text-gray-500 mt-1">{appointment.observations}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">R$ {appointment.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Agendamentos</h2>
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === 'calendar' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Calendário</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Lista</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
      </div>

      {/* Appointment Form Modal */}
      {showForm && (
        <AppointmentForm
          appointment={editingAppointment}
          clients={clients}
          vehicles={vehicles}
          services={services}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingAppointment(null);
          }}
        />
      )}
    </div>
  );
}