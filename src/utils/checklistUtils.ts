import { ChecklistItem, Service, Vehicle, ServiceCategory, VehicleType } from '../types';
import { defaultChecklistItems } from '../data/checklistItems';

export function generateUnifiedChecklist(
  services: Service[],
  vehicle: Vehicle,
  category: 'entry' | 'exit'
): ChecklistItem[] {
  // Obter categorias de serviços únicos
  const serviceCategories = [...new Set(services.map(s => s.category))];
  
  // Verificar se algum serviço requer checklist
  const requiresChecklist = category === 'entry' 
    ? services.some(s => s.requiresEntryChecklist)
    : services.some(s => s.requiresExitChecklist);

  if (!requiresChecklist) {
    return [];
  }

  // Filtrar itens relevantes
  const relevantItems = defaultChecklistItems.filter(item => {
    // Filtrar por categoria (entrada/saída)
    if (item.category !== category) return false;

    // Filtrar por tipo de veículo se especificado
    if (item.vehicleTypes && !item.vehicleTypes.includes(vehicle.type)) {
      return false;
    }

    // Filtrar por categoria de serviço se especificado
    if (item.serviceCategories) {
      return item.serviceCategories.some(cat => serviceCategories.includes(cat));
    }

    // Incluir itens gerais (sem filtros específicos)
    return true;
  });

  // Obter itens customizados dos serviços
  const customItemIds = services.flatMap(s => s.customChecklistItems || []);
  const customItems = defaultChecklistItems.filter(item => 
    customItemIds.includes(item.id) && item.category === category
  );

  // Combinar e remover duplicatas
  const allItems = [...relevantItems, ...customItems];
  const uniqueItems = allItems.filter((item, index, self) => 
    index === self.findIndex(i => i.id === item.id)
  );

  // Ordenar por prioridade: obrigatórios primeiro, depois por tipo
  return uniqueItems.sort((a, b) => {
    if (a.required !== b.required) {
      return a.required ? -1 : 1;
    }
    return a.type.localeCompare(b.type);
  });
}

export function getChecklistTypeLabel(type: string): string {
  const labels = {
    visual: 'Visual',
    functional: 'Funcional',
    documentation: 'Documentação',
    cleaning: 'Limpeza',
    safety: 'Segurança',
  };
  return labels[type as keyof typeof labels] || type;
}

export function getChecklistTypeColor(type: string): string {
  const colors = {
    visual: 'bg-blue-100 text-blue-800',
    functional: 'bg-green-100 text-green-800',
    documentation: 'bg-purple-100 text-purple-800',
    cleaning: 'bg-yellow-100 text-yellow-800',
    safety: 'bg-red-100 text-red-800',
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

export function calculateChecklistProgress(
  checklist: ChecklistItem[],
  responses: { itemId: string; checked: boolean }[]
): {
  total: number;
  completed: number;
  required: number;
  requiredCompleted: number;
  percentage: number;
} {
  const total = checklist.length;
  const required = checklist.filter(item => item.required).length;
  
  const completed = responses.filter(response => response.checked).length;
  const requiredCompleted = responses.filter(response => {
    const item = checklist.find(item => item.id === response.itemId);
    return item?.required && response.checked;
  }).length;

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    required,
    requiredCompleted,
    percentage,
  };
}

export function validateChecklistCompletion(
  checklist: ChecklistItem[],
  responses: { itemId: string; checked: boolean }[]
): {
  isValid: boolean;
  missingRequired: ChecklistItem[];
  errors: string[];
} {
  const missingRequired = checklist.filter(item => {
    if (!item.required) return false;
    const response = responses.find(r => r.itemId === item.id);
    return !response || !response.checked;
  });

  const errors: string[] = [];
  
  if (missingRequired.length > 0) {
    errors.push(`${missingRequired.length} item(ns) obrigatório(s) não foram marcados`);
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    errors,
  };
}

export function groupChecklistByType(items: ChecklistItem[]): Record<string, ChecklistItem[]> {
  return items.reduce((groups, item) => {
    const type = item.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(item);
    return groups;
  }, {} as Record<string, ChecklistItem[]>);
}