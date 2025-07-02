import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Camera, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { 
  ChecklistItem, 
  ChecklistResponse, 
  AppointmentChecklist, 
  Service, 
  Vehicle 
} from '../../types';
import { 
  generateUnifiedChecklist, 
  getChecklistTypeLabel, 
  getChecklistTypeColor,
  calculateChecklistProgress,
  validateChecklistCompletion,
  groupChecklistByType
} from '../../utils/checklistUtils';

interface ChecklistManagerProps {
  appointmentId: string;
  services: Service[];
  vehicle: Vehicle;
  category: 'entry' | 'exit';
  existingChecklist?: AppointmentChecklist;
  onSave: (checklist: ChecklistResponse[]) => void;
  onComplete?: () => void;
  readOnly?: boolean;
}

export function ChecklistManager({
  appointmentId,
  services,
  vehicle,
  category,
  existingChecklist,
  onSave,
  onComplete,
  readOnly = false
}: ChecklistManagerProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    const items = generateUnifiedChecklist(services, vehicle, category);
    setChecklistItems(items);

    // Carregar respostas existentes
    if (existingChecklist) {
      const existingResponses = category === 'entry' 
        ? existingChecklist.entryChecklist 
        : existingChecklist.exitChecklist;
      
      setResponses(existingResponses || []);
      
      const responsible = category === 'entry'
        ? existingChecklist.entryResponsible
        : existingChecklist.exitResponsible;
      
      setResponsiblePerson(responsible || '');
    }
  }, [services, vehicle, category, existingChecklist]);

  const handleItemToggle = (itemId: string) => {
    if (readOnly) return;

    setResponses(prev => {
      const existing = prev.find(r => r.itemId === itemId);
      
      if (existing) {
        return prev.map(r => 
          r.itemId === itemId 
            ? { ...r, checked: !r.checked, timestamp: new Date().toISOString() }
            : r
        );
      } else {
        return [...prev, {
          itemId,
          checked: true,
          timestamp: new Date().toISOString(),
          responsiblePerson,
        }];
      }
    });
  };

  const handleObservationChange = (itemId: string, observations: string) => {
    if (readOnly) return;

    setResponses(prev => {
      const existing = prev.find(r => r.itemId === itemId);
      
      if (existing) {
        return prev.map(r => 
          r.itemId === itemId 
            ? { ...r, observations, timestamp: new Date().toISOString() }
            : r
        );
      } else {
        return [...prev, {
          itemId,
          checked: false,
          observations,
          timestamp: new Date().toISOString(),
          responsiblePerson,
        }];
      }
    });
  };

  const handleSave = () => {
    const updatedResponses = responses.map(r => ({
      ...r,
      responsiblePerson: responsiblePerson || r.responsiblePerson,
    }));
    
    onSave(updatedResponses);
  };

  const handleComplete = () => {
    const validation = validateChecklistCompletion(checklistItems, responses);
    
    if (!validation.isValid) {
      setShowValidation(true);
      return;
    }

    if (!responsiblePerson.trim()) {
      alert('Por favor, informe o responsável pelo checklist');
      return;
    }

    handleSave();
    onComplete?.();
  };

  const getItemResponse = (itemId: string) => {
    return responses.find(r => r.itemId === itemId);
  };

  const progress = calculateChecklistProgress(checklistItems, responses);
  const validation = validateChecklistCompletion(checklistItems, responses);
  const groupedItems = groupChecklistByType(checklistItems);

  const isCompleted = category === 'entry' 
    ? !!existingChecklist?.entryCompletedAt
    : !!existingChecklist?.exitCompletedAt;

  if (checklistItems.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">
          Nenhum checklist necessário para os serviços selecionados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2" />
            Checklist de {category === 'entry' ? 'Entrada' : 'Saída'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {vehicle.brand} {vehicle.model} - {vehicle.plate}
          </p>
        </div>
        
        {isCompleted && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Concluído</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso</span>
          <span className="text-sm text-gray-600">
            {progress.completed}/{progress.total} itens
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Obrigatórios: {progress.requiredCompleted}/{progress.required}
          </span>
          <span>{progress.percentage}% concluído</span>
        </div>
      </div>

      {/* Responsible Person */}
      {!readOnly && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Responsável pelo Checklist *
          </label>
          <input
            type="text"
            value={responsiblePerson}
            onChange={(e) => setResponsiblePerson(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nome do responsável"
            disabled={isCompleted}
          />
        </div>
      )}

      {/* Validation Errors */}
      {showValidation && !validation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">
                Checklist Incompleto
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              {validation.missingRequired.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-900">Itens obrigatórios pendentes:</p>
                  <ul className="text-sm text-red-800 mt-1 space-y-1">
                    {validation.missingRequired.map(item => (
                      <li key={item.id}>• {item.label}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checklist Items by Type */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([type, items]) => (
          <div key={type} className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChecklistTypeColor(type)}`}>
                  {getChecklistTypeLabel(type)}
                </span>
                <span className="text-sm text-gray-600">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {items.map(item => {
                const response = getItemResponse(item.id);
                const isChecked = response?.checked || false;
                
                return (
                  <div key={item.id} className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleItemToggle(item.id)}
                        disabled={readOnly || isCompleted}
                        className={`mt-1 p-1 rounded transition-colors ${
                          readOnly || isCompleted 
                            ? 'cursor-not-allowed' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium ${isChecked ? 'text-green-900' : 'text-gray-900'}`}>
                            {item.label}
                          </h4>
                          {item.required && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                        
                        {response?.timestamp && (
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(response.timestamp).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            {response.responsiblePerson && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{response.responsiblePerson}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Observations */}
                    <div className="ml-8">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <label className="text-sm font-medium text-gray-700">
                          Observações
                        </label>
                      </div>
                      <textarea
                        value={response?.observations || ''}
                        onChange={(e) => handleObservationChange(item.id, e.target.value)}
                        disabled={readOnly || isCompleted}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Adicione observações sobre este item..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {!readOnly && !isCompleted && (
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Salvar Progresso
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Finalizar Checklist</span>
          </button>
        </div>
      )}
    </div>
  );
}