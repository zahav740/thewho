export interface Order {
  id: string;
  drawingNumber: string;
  name?: string; // Добавляем поле name (необязательное для обратной совместимости)
  clientName?: string; // Имя клиента
  deadline: string;
  quantity: number;
  priority: number | string; // Поддержка и числового и строкового формата
  pdfUrl?: string;
  operations: Operation[];
}

export interface Operation {
  id: string;
  orderId: string;
  sequenceNumber: number;
  machine?: string;
  operationType: "3-axis" | "4-axis" | "turning" | "milling";
  estimatedTime: number;
  completedUnits?: number;
  actualTime?: number;
  status: "pending" | "in-progress" | "completed";
  operators?: string[];
}

export interface Setup {
  id: string;
  drawingNumber: string;
  setupType: string;
  operationNumber: number;
  timeSpent: number;
  operator: string;
  startTime: string;
  date: string;
  machine: string;
}

export interface Shift {
  id: string;
  date: string;
  machine: string;
  isNight: boolean;
  operators: string[];
  operations: {
    operationId: string;
    drawingNumber: string;
    completedUnits: number;
    timeSpent: number;
    operators: string[];
  }[];
  setups?: Setup[];
}

export type Machine = "Doosan Yashana" | "Doosan Hadasha" | "Doosan 3" | "Pinnacle Gdola" | "Mitsubishi" | "Okuma" | "JonFord";

export const MACHINES: Machine[] = [
  "Doosan Yashana",
  "Doosan Hadasha",
  "Doosan 3",
  "Pinnacle Gdola",
  "Mitsubishi",
  "Okuma",
  "JonFord"
];

export const DEFAULT_OPERATORS = ["Андрей", "Денис", "Даниэль", "Кирилл", "Слава"];
export const NIGHT_OPERATOR = "Аркадий";

// Типы операций
export type OperationType = "3-axis" | "4-axis" | "turning" | "milling";

export const OPERATION_TYPES: { value: OperationType; label: string; description: string }[] = [
  { value: "3-axis", label: "3-коорд фрезерование", description: "Фрезерование по 3 осям" },
  { value: "4-axis", label: "4-коорд фрезерование", description: "Фрезерование по 4 осям" },
  { value: "turning", label: "Токарная обработка", description: "Токарные работы" },
  { value: "milling", label: "Фрезерная обработка", description: "Фрезерные работы" }
];

// Классификация станков
export interface MachineCapability {
  name: Machine;
  type: "milling" | "turning";
  supports3Axis: boolean;
  supports4Axis: boolean;
  supportsTurning: boolean;
  supportsMilling: boolean;
  isActive: boolean;
}

export const MACHINE_CAPABILITIES: MachineCapability[] = [
  {
    name: "Doosan Yashana",
    type: "milling",
    supports3Axis: true,
    supports4Axis: true,
    supportsTurning: false,
    supportsMilling: true,
    isActive: true
  },
  {
    name: "Doosan Hadasha",
    type: "milling",
    supports3Axis: true,
    supports4Axis: true,
    supportsTurning: false,
    supportsMilling: true,
    isActive: true
  },
  {
    name: "Doosan 3",
    type: "milling",
    supports3Axis: true,
    supports4Axis: false,
    supportsTurning: false,
    supportsMilling: true,
    isActive: true
  },
  {
    name: "Pinnacle Gdola",
    type: "milling",
    supports3Axis: true,
    supports4Axis: true,
    supportsTurning: false,
    supportsMilling: true,
    isActive: true
  },
  {
    name: "Mitsubishi",
    type: "milling",
    supports3Axis: true,
    supports4Axis: false,
    supportsTurning: false,
    supportsMilling: true,
    isActive: true
  },
  {
    name: "Okuma",
    type: "turning",
    supports3Axis: false,
    supports4Axis: false,
    supportsTurning: true,
    supportsMilling: false,
    isActive: true
  },
  {
    name: "JonFord",
    type: "turning",
    supports3Axis: false,
    supports4Axis: false,
    supportsTurning: true,
    supportsMilling: false,
    isActive: true
  }
];
