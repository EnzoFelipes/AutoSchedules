import React from 'react';
import { Calendar, DollarSign, TrendingUp, Clock, Car, Users } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { UpcomingAppointments } from './UpcomingAppointments';
import { useAppointments } from '../../hooks/useAppointments';
import { formatCurrency } from '../../utils/scheduling';

export function Dashboard() {
  const { getTodayAppointments, appointments } = useAppointments();
  const todayAppointments = getTodayAppointments();

  // Calculate metrics
  const todayRevenue = todayAppointments.reduce((sum, apt) => sum + apt.totalPrice, 0);
  const weeklyAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.startDateTime);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    return appointmentDate >= weekStart && apt.status !== 'cancelled';
  }).length;

  const utilizationRate = Math.min((todayAppointments.length / 8) * 100, 100); // Assuming 8 slots per day

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Agendamentos Hoje"
          value={todayAppointments.length}
          subtitle="serviços marcados"
          icon={Calendar}
          color="blue"
        />
        
        <DashboardCard
          title="Receita do Dia"
          value={formatCurrency(todayRevenue)}
          subtitle="faturamento atual"
          icon={DollarSign}
          color="green"
          trend={{ value: 12.5, label: 'vs ontem' }}
        />
        
        <DashboardCard
          title="Agendamentos Semana"
          value={weeklyAppointments}
          subtitle="esta semana"
          icon={TrendingUp}
          color="purple"
          trend={{ value: 8.2, label: 'vs semana anterior' }}
        />
        
        <DashboardCard
          title="Taxa de Ocupação"
          value={`${utilizationRate.toFixed(0)}%`}
          subtitle="utilização do dia"
          icon={Clock}
          color={utilizationRate > 75 ? 'green' : utilizationRate > 50 ? 'yellow' : 'red'}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2">
          <UpcomingAppointments appointments={todayAppointments} />
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Rápido</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Clientes Ativos</span>
                </div>
                <span className="text-sm font-bold text-gray-900">142</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Veículos Cadastrados</span>
                </div>
                <span className="text-sm font-bold text-gray-900">186</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Próximo Horário</span>
                </div>
                <span className="text-sm font-bold text-gray-900">14:30</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Novo Agendamento</h3>
            <p className="text-blue-100 mb-4">Crie um novo agendamento rapidamente</p>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Agendar Serviço
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}