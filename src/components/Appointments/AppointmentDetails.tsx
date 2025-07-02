import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Car, 
  Wrench, 
  FileText, 
  CheckSquare,
  AlertTriangle,
  CheckCircle,
  Edit,
  X
} from 'lucide-react';
import { Appointment, Client, Vehicle, Service, AppointmentChecklist } from '../../types';
import { 
  formatDateTime, 
  getStatusColor, 
  getStatusLabel, 
  formatCurrency,
  formatDuration 
} from '../../utils/scheduling';
import { ChecklistManager } from './ChecklistManager';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface AppointmentDetailsProps {
  appointment: Appointment;
  client: Client;
  vehicle: Vehicle;
  services: Service[];
  onClose: () => void;
  onEdit?: () => void;
}

export function AppointmentDetails({
  appointment,
  client,
  vehicle,
  services,
  onClose,
  onEdit
}: AppointmentDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'entry-checklist' | 'exit-checklist'>('details');
  const [checklists, setChecklists] = useLocalStorage<AppointmentChecklist[]>('appointment-checklists', []);
  
  const appointmentServices = services.filter(s => appointment.serviceIds.includes(s.id));
  const existingChecklist = checklists.find(c => c.appointmentId === appointment.id);

  const handleChecklistSave = (category: 'entry' | 'exit', responses: any[]) => {
    setChecklists(prev => {
      const existing = prev.find(c => c.appointmentId === appointment.id);
      const now = new Date().toISOString();
      
      if (existing) {
        return prev.map(c => 
          c.appointmentId === appointment.id
            ? {
                ...c,
                [category === 'entry' ? 'entryChecklist' : 'exitChecklist']: responses,
                [category === 'entry' ? 'entryCompletedAt' : 'exitCompletedAt']: now,
                [category === 'entry' ? 'entryResponsible' : 'exitResponsible']: responses[0]?.responsiblePerson || '',
              }
            : c
        );
      } else {
        const newChecklist: AppointmentChecklist = {
          appointmentId: appointment.id,
          entryChecklist: category === 'entry' ? responses : [],
          exitChecklist: category === 'exit' ? responses : [],
          [category === 'entry' ? 'entryCompletedAt' : 'exitCompletedAt']: now,
          [category === 'entry' ? 'entryResponsible' : 'exitResponsible']: responses[0]?.responsiblePerson || '',
        };
        return [...prev, newChecklist];
      }
    });
  };

  const getAppointmentDuration = () => {
    const start = new Date(appointment.startDateTime);
    const end = new Date(appointment.endDateTime);
    const workDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    
    let dryingDuration = 0;
    if (appointment.dryingEndDateTime) {
      const dryingEnd = new Date(appointment.dryingEndDateTime);
      dryingDuration = Math.round((dryingEnd.getTime() - end.getTime()) / (1000 * 60));
    }
    
    return { workDuration, dryingDuration };
  };

  const { workDuration, dryingDuration } = getAppointmentDuration();

  const requiresEntryChecklist = appointmentServices.some(s => s.requiresEntryChecklist);
  const requiresExitChecklist = appointmentServices.some(s => s.requiresExitChecklist);

  const entryChecklistCompleted = !!existingChecklist?.entryCompletedAt;
  const exitChecklistCompleted = !!existingChecklist?.exitCompletedAt;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Detalhes do Agendamento
          </h2>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Detalhes
            </button>
            
            {requiresEntryChecklist && (
              <button
                onClick={() => setActiveTab('entry-checklist')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  activeTab === 'entry-checklist'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Checklist Entrada
                {entryChecklistCompleted ? (
                  <CheckCircle className="w-4 h-4 ml-1 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 ml-1 text-orange-500" />
                )}
              </button>
            )}
            
            {requiresExitChecklist && (
              <button
                onClick={() => setActiveTab('exit-checklist')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  activeTab === 'exit-checklist'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Checklist Saída
                {exitChecklistCompleted ? (
                  <CheckCircle className="w-4 h-4 ml-1 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 ml-1 text-orange-500" />
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações Gerais</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Car className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vehicle.plate} • {vehicle.color} • {vehicle.year}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(appointment.startDateTime)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Duração: {formatDuration(workDuration)}
                            {dryingDuration > 0 && (
                              <span className="text-orange-600 ml-2">
                                + {formatDuration(dryingDuration)} secagem
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                      {appointment.responsible && (
                        <span className="text-sm text-gray-600">
                          Responsável: {appointment.responsible}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Serviços</h3>
                  <div className="space-y-3">
                    {appointmentServices.map(service => {
                      const config = service.configurations?.[vehicle.size];
                      
                      return (
                        <div key={service.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{service.name}</h4>
                            <span className="font-bold text-blue-600">
                              {config ? formatCurrency(config.price) : 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          
                          {config && (
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>
                                <Clock className="w-3 h-3 inline mr-1" />
                                {config.durationHours > 0 && `${config.durationHours}h`}
                                {config.durationMinutes > 0 && ` ${config.durationMinutes}min`}
                              </span>
                              {service.dryingTime && service.dryingTime > 0 && (
                                <span className="text-orange-600">
                                  Secagem: {Math.floor(service.dryingTime / 60)}h
                                  {service.dryingTime % 60 > 0 && ` ${service.dryingTime % 60}min`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(appointment.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observations */}
              {appointment.observations && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Observações</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{appointment.observations}</p>
                  </div>
                </div>
              )}

              {/* Checklist Status */}
              {(requiresEntryChecklist || requiresExitChecklist) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Status dos Checklists</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiresEntryChecklist && (
                      <div className={`border rounded-lg p-4 ${
                        entryChecklistCompleted ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          {entryChecklistCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          )}
                          <span className="font-medium">Checklist de Entrada</span>
                        </div>
                        <p className={`text-sm ${
                          entryChecklistCompleted ? 'text-green-700' : 'text-orange-700'
                        }`}>
                          {entryChecklistCompleted 
                            ? `Concluído em ${new Date(existingChecklist!.entryCompletedAt!).toLocaleString('pt-BR')}`
                            : 'Pendente'
                          }
                        </p>
                        {existingChecklist?.entryResponsible && (
                          <p className="text-xs text-gray-600 mt-1">
                            Responsável: {existingChecklist.entryResponsible}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {requiresExitChecklist && (
                      <div className={`border rounded-lg p-4 ${
                        exitChecklistCompleted ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          {exitChecklistCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          )}
                          <span className="font-medium">Checklist de Saída</span>
                        </div>
                        <p className={`text-sm ${
                          exitChecklistCompleted ? 'text-green-700' : 'text-orange-700'
                        }`}>
                          {exitChecklistCompleted 
                            ? `Concluído em ${new Date(existingChecklist!.exitCompletedAt!).toLocaleString('pt-BR')}`
                            : 'Pendente'
                          }
                        </p>
                        {existingChecklist?.exitResponsible && (
                          <p className="text-xs text-gray-600 mt-1">
                            Responsável: {existingChecklist.exitResponsible}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'entry-checklist' && requiresEntryChecklist && (
            <ChecklistManager
              appointmentId={appointment.id}
              services={appointmentServices}
              vehicle={vehicle}
              category="entry"
              existingChecklist={existingChecklist}
              onSave={(responses) => handleChecklistSave('entry', responses)}
              readOnly={appointment.status === 'completed' || appointment.status === 'cancelled'}
            />
          )}

          {activeTab === 'exit-checklist' && requiresExitChecklist && (
            <ChecklistManager
              appointmentId={appointment.id}
              services={appointmentServices}
              vehicle={vehicle}
              category="exit"
              existingChecklist={existingChecklist}
              onSave={(responses) => handleChecklistSave('exit', responses)}
              readOnly={appointment.status === 'completed' || appointment.status === 'cancelled'}
            />
          )}
        </div>
      </div>
    </div>
  );
}