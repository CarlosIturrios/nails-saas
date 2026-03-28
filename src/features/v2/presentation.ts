import { QUOTE_CONFIG_PRESETS, QuoteConfigPresetKey } from "@/src/features/quote-calculator-v2/lib/presets";

export interface IndustryPresentation {
  primaryModuleLabel: string;
  primaryActionLabel: string;
  customerLabel: string;
  itemGroupLabel: string;
  immediateLabel: string;
  scheduledLabel: string;
  quoteLabel: string;
  pendingLabel: string;
  agendaLabel: string;
}

interface IndustryPresentationInput {
  businessType?: string | null;
  presetKey?: string | null;
}

const DEFAULT_PRESENTATION: IndustryPresentation = {
  primaryModuleLabel: "Nueva venta",
  primaryActionLabel: "Guardar venta",
  customerLabel: "Cliente",
  itemGroupLabel: "Conceptos",
  immediateLabel: "Atender ahora",
  scheduledLabel: "Agendar",
  quoteLabel: "Cotizar",
  pendingLabel: "Pendientes",
  agendaLabel: "Agenda",
};

const PRESENTATION_BY_BUSINESS_TYPE: Record<string, IndustryPresentation> = {
  manicurist: {
    primaryModuleLabel: "Nuevo servicio",
    primaryActionLabel: "Guardar servicio",
    customerLabel: "Cliente",
    itemGroupLabel: "Servicios",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  nail_salon: {
    primaryModuleLabel: "Nuevo servicio",
    primaryActionLabel: "Guardar servicio",
    customerLabel: "Cliente",
    itemGroupLabel: "Servicios",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  barber_shop: {
    primaryModuleLabel: "Nuevo servicio",
    primaryActionLabel: "Guardar servicio",
    customerLabel: "Cliente",
    itemGroupLabel: "Servicios",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  spa: {
    primaryModuleLabel: "Nuevo servicio",
    primaryActionLabel: "Guardar servicio",
    customerLabel: "Cliente",
    itemGroupLabel: "Servicios",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  estetica: {
    primaryModuleLabel: "Nuevo servicio",
    primaryActionLabel: "Guardar servicio",
    customerLabel: "Cliente",
    itemGroupLabel: "Servicios",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  dentist: {
    primaryModuleLabel: "Nueva atencion",
    primaryActionLabel: "Guardar atencion",
    customerLabel: "Paciente",
    itemGroupLabel: "Tratamientos",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  psychologist: {
    primaryModuleLabel: "Nueva atencion",
    primaryActionLabel: "Guardar atencion",
    customerLabel: "Paciente",
    itemGroupLabel: "Sesiones",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  fisioterapeuta: {
    primaryModuleLabel: "Nueva atencion",
    primaryActionLabel: "Guardar atencion",
    customerLabel: "Paciente",
    itemGroupLabel: "Servicios",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  veterinaria: {
    primaryModuleLabel: "Nueva atencion",
    primaryActionLabel: "Guardar atencion",
    customerLabel: "Paciente / cliente",
    itemGroupLabel: "Servicios",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Agendar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  mechanic_shop: {
    primaryModuleLabel: "Nuevo trabajo",
    primaryActionLabel: "Guardar trabajo",
    customerLabel: "Cliente",
    itemGroupLabel: "Trabajos",
    immediateLabel: "Recibir ahora",
    scheduledLabel: "Programar",
    quoteLabel: "Presupuestar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  auto_body_shop: {
    primaryModuleLabel: "Nuevo trabajo",
    primaryActionLabel: "Guardar trabajo",
    customerLabel: "Cliente",
    itemGroupLabel: "Trabajos",
    immediateLabel: "Recibir ahora",
    scheduledLabel: "Programar",
    quoteLabel: "Presupuestar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  carpinteria: {
    primaryModuleLabel: "Nuevo trabajo",
    primaryActionLabel: "Guardar trabajo",
    customerLabel: "Cliente",
    itemGroupLabel: "Trabajos",
    immediateLabel: "Tomar ahora",
    scheduledLabel: "Programar",
    quoteLabel: "Presupuestar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  electricista: {
    primaryModuleLabel: "Nuevo trabajo",
    primaryActionLabel: "Guardar trabajo",
    customerLabel: "Cliente",
    itemGroupLabel: "Trabajos",
    immediateLabel: "Tomar ahora",
    scheduledLabel: "Programar",
    quoteLabel: "Presupuestar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  car_wash: {
    primaryModuleLabel: "Nueva orden",
    primaryActionLabel: "Guardar orden",
    customerLabel: "Cliente",
    itemGroupLabel: "Servicios",
    immediateLabel: "Atender ahora",
    scheduledLabel: "Programar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Agenda",
  },
  fast_food: {
    primaryModuleLabel: "Punto de venta",
    primaryActionLabel: "Cobrar ahora",
    customerLabel: "Cliente",
    itemGroupLabel: "Productos",
    immediateLabel: "Cobrar ahora",
    scheduledLabel: "Programar",
    quoteLabel: "Cotizar",
    pendingLabel: "Pendientes",
    agendaLabel: "Pedidos",
  },
};

function inferBusinessTypeFromPreset(presetKey?: string | null) {
  if (!presetKey) {
    return null;
  }

  const normalized = presetKey as QuoteConfigPresetKey;
  if (!(normalized in QUOTE_CONFIG_PRESETS)) {
    return null;
  }

  return normalized
    .replace(/_demo$/, "")
    .replace(/^none$/, "");
}

export function getIndustryPresentation(input: IndustryPresentationInput): IndustryPresentation {
  const businessType = input.businessType?.trim() || inferBusinessTypeFromPreset(input.presetKey);

  if (!businessType) {
    return DEFAULT_PRESENTATION;
  }

  return PRESENTATION_BY_BUSINESS_TYPE[businessType] ?? DEFAULT_PRESENTATION;
}
