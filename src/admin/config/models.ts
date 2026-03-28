export type AdminFieldType =
  | "text"
  | "email"
  | "number"
  | "select"
  | "relation"
  | "multiselect"
  | "boolean"
  | "date";

export interface AdminFieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface AdminFieldRelationConfig {
  resource: "users" | "organizations" | "clients" | "quotes" | "serviceOrders";
}

export interface AdminFieldConfig {
  name: string;
  label: string;
  type: AdminFieldType;
  options?: string[];
  relation?: AdminFieldRelationConfig;
  required?: boolean;
  placeholder?: string;
  editable?: boolean;
  list?: boolean;
  persisted?: boolean;
  helperText?: string;
}

export interface AdminModelConfig {
  label: string;
  singularLabel: string;
  model: string;
  description?: string;
  pageSize?: number;
  searchFields?: string[];
  scopedByOrganization?: boolean;
  scopeField?: string;
  fields: AdminFieldConfig[];
}

export const models = {
  users: {
    label: "Usuarios",
    singularLabel: "Usuario",
    model: "user",
    description: "Gestiona accesos globales y las organizaciones relacionadas a cada usuario.",
    pageSize: 10,
    searchFields: ["firstName", "lastName", "email", "phone"],
    fields: [
      { name: "firstName", label: "Nombre", type: "text", required: true },
      { name: "lastName", label: "Apellido", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Teléfono", type: "text", required: true },
      { name: "countryCode", label: "Lada", type: "text", required: true },
      { name: "timezone", label: "Zona horaria", type: "text" },
      {
        name: "role",
        label: "Rol",
        type: "select",
        options: ["SUPER_ADMIN", "SAAS_ADMIN", "STANDARD_USER"],
        required: true,
      },
      { name: "active", label: "Activo", type: "boolean" },
      {
        name: "organizationNames",
        label: "Organizaciones",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "organizationIds",
        label: "Organizaciones relacionadas",
        type: "multiselect",
        relation: { resource: "organizations" },
        persisted: false,
        helperText:
          "Selecciona todas las organizaciones a las que pertenece este usuario. Los roles por organización se gestionan en la tabla Relaciones usuario-organización.",
        list: false,
      },
      {
        name: "createdAt",
        label: "Creado",
        type: "date",
        editable: false,
      },
    ],
  },
  clients: {
    label: "Clientes",
    singularLabel: "Cliente",
    model: "client",
    description: "Administra todos los clientes y la organización a la que pertenecen.",
    pageSize: 10,
    searchFields: ["name", "phone", "email"],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "phone", label: "Teléfono", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      {
        name: "organizationName",
        label: "Organización",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "organizationId",
        label: "Organización",
        type: "relation",
        relation: { resource: "organizations" },
        persisted: true,
        list: false,
      },
      {
        name: "createdAt",
        label: "Creado",
        type: "date",
        editable: false,
      },
    ],
  },
  quotes: {
    label: "Propuestas",
    singularLabel: "Propuesta",
    model: "quote",
    description: "Consulta, corrige o actualiza propuestas registradas por cualquier organización.",
    pageSize: 10,
    searchFields: ["customerName", "customerPhone", "currency", "source"],
    fields: [
      {
        name: "organizationName",
        label: "Organización",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "organizationId",
        label: "Organización",
        type: "relation",
        relation: { resource: "organizations" },
        required: true,
        list: false,
      },
      {
        name: "clientName",
        label: "Cliente",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "clientId",
        label: "Cliente",
        type: "relation",
        relation: { resource: "clients" },
        list: false,
      },
      {
        name: "createdByName",
        label: "Creada por",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "createdByUserId",
        label: "Creada por",
        type: "relation",
        relation: { resource: "users" },
        list: false,
      },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: ["DRAFT", "SENT", "ACCEPTED", "CONVERTED", "CANCELLED", "EXPIRED"],
        required: true,
      },
      {
        name: "flowType",
        label: "Tipo de flujo",
        type: "select",
        options: ["WALK_IN", "SCHEDULED"],
        required: true,
      },
      { name: "customerName", label: "Nombre capturado", type: "text" },
      { name: "customerPhone", label: "Teléfono capturado", type: "text" },
      { name: "notes", label: "Notas", type: "text", list: false },
      { name: "scheduledFor", label: "Programada para", type: "date" },
      { name: "acceptedAt", label: "Aceptada", type: "date" },
      { name: "convertedAt", label: "Convertida", type: "date" },
      { name: "subtotal", label: "Subtotal", type: "number", required: true },
      { name: "total", label: "Total", type: "number", required: true },
      { name: "currency", label: "Moneda", type: "text", required: true },
      { name: "source", label: "Origen", type: "text" },
      { name: "createdAt", label: "Creada", type: "date", editable: false },
    ],
  },
  serviceOrders: {
    label: "Órdenes",
    singularLabel: "Orden",
    model: "serviceOrder",
    description: "Consulta y corrige órdenes, responsables, programación y estados de cobro.",
    pageSize: 10,
    searchFields: ["customerName", "customerPhone", "currency", "source"],
    fields: [
      {
        name: "organizationName",
        label: "Organización",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "organizationId",
        label: "Organización",
        type: "relation",
        relation: { resource: "organizations" },
        required: true,
        list: false,
      },
      {
        name: "clientName",
        label: "Cliente",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "clientId",
        label: "Cliente",
        type: "relation",
        relation: { resource: "clients" },
        list: false,
      },
      {
        name: "sourceQuoteLabel",
        label: "Propuesta origen",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "sourceQuoteId",
        label: "Propuesta origen",
        type: "relation",
        relation: { resource: "quotes" },
        list: false,
      },
      {
        name: "createdByName",
        label: "Creada por",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "createdByUserId",
        label: "Creada por",
        type: "relation",
        relation: { resource: "users" },
        list: false,
      },
      {
        name: "assignedToName",
        label: "Responsable",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "assignedToUserId",
        label: "Responsable",
        type: "relation",
        relation: { resource: "users" },
        list: false,
      },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: ["DRAFT", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "PAID", "CANCELLED"],
        required: true,
      },
      {
        name: "flowType",
        label: "Tipo de flujo",
        type: "select",
        options: ["WALK_IN", "SCHEDULED"],
        required: true,
      },
      { name: "customerName", label: "Nombre capturado", type: "text" },
      { name: "customerPhone", label: "Teléfono capturado", type: "text" },
      { name: "notes", label: "Notas", type: "text", list: false },
      { name: "scheduledFor", label: "Programada para", type: "date" },
      { name: "startedAt", label: "Iniciada", type: "date" },
      { name: "completedAt", label: "Completada", type: "date" },
      { name: "paidAt", label: "Cobrada", type: "date" },
      { name: "subtotal", label: "Subtotal", type: "number", required: true },
      { name: "total", label: "Total", type: "number", required: true },
      { name: "currency", label: "Moneda", type: "text", required: true },
      { name: "source", label: "Origen", type: "text" },
      { name: "createdAt", label: "Creada", type: "date", editable: false },
    ],
  },
  quoteItems: {
    label: "Conceptos de propuesta",
    singularLabel: "Concepto de propuesta",
    model: "quoteItem",
    description: "Edita los conceptos que componen cada propuesta.",
    pageSize: 12,
    searchFields: ["label", "description"],
    fields: [
      {
        name: "quoteLabel",
        label: "Propuesta",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "quoteId",
        label: "Propuesta",
        type: "relation",
        relation: { resource: "quotes" },
        required: true,
        list: false,
      },
      {
        name: "itemType",
        label: "Tipo",
        type: "select",
        options: ["SERVICE", "EXTRA", "ADJUSTMENT"],
        required: true,
      },
      { name: "label", label: "Etiqueta", type: "text", required: true },
      { name: "description", label: "Descripción", type: "text" },
      { name: "quantity", label: "Cantidad", type: "number", required: true },
      { name: "unitPrice", label: "Precio unitario", type: "number", required: true },
      { name: "total", label: "Total", type: "number", required: true },
      { name: "sortOrder", label: "Orden", type: "number", required: true },
      { name: "createdAt", label: "Creado", type: "date", editable: false },
    ],
  },
  serviceOrderItems: {
    label: "Conceptos de orden",
    singularLabel: "Concepto de orden",
    model: "serviceOrderItem",
    description: "Edita los conceptos que componen cada orden.",
    pageSize: 12,
    searchFields: ["label", "description"],
    fields: [
      {
        name: "serviceOrderLabel",
        label: "Orden",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "serviceOrderId",
        label: "Orden",
        type: "relation",
        relation: { resource: "serviceOrders" },
        required: true,
        list: false,
      },
      {
        name: "itemType",
        label: "Tipo",
        type: "select",
        options: ["SERVICE", "EXTRA", "ADJUSTMENT"],
        required: true,
      },
      { name: "label", label: "Etiqueta", type: "text", required: true },
      { name: "description", label: "Descripción", type: "text" },
      { name: "quantity", label: "Cantidad", type: "number", required: true },
      { name: "unitPrice", label: "Precio unitario", type: "number", required: true },
      { name: "total", label: "Total", type: "number", required: true },
      { name: "sortOrder", label: "Orden", type: "number", required: true },
      { name: "createdAt", label: "Creado", type: "date", editable: false },
    ],
  },
  organizations: {
    label: "Organizaciones",
    singularLabel: "Organización",
    model: "organization",
    description: "Gestiona todas las organizaciones y los usuarios ligados a cada una.",
    pageSize: 10,
    searchFields: ["name"],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "defaultTimezone", label: "Zona horaria default", type: "text", required: true },
      {
        name: "memberNames",
        label: "Usuarios ligados",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "memberUserIds",
        label: "Usuarios relacionados",
        type: "multiselect",
        relation: { resource: "users" },
        persisted: false,
        helperText:
          "Puedes ligar varios usuarios a esta organización. Los permisos por organización se gestionan en la tabla Relaciones usuario-organización.",
        list: false,
      },
      {
        name: "quoteConfigPreset",
        label: "Plantilla inicial de captura",
        type: "select",
        options: [
          "none",
          "pos_classic_demo",
          "pos_compact_demo",
          "pos_touch_demo",
          "manicurist_demo",
          "nail_salon_demo",
          "mechanic_shop_demo",
          "auto_body_shop_demo",
          "dentist_demo",
          "psychologist_demo",
          "fisioterapeuta_demo",
          "barber_shop_demo",
          "spa_demo",
          "veterinaria_demo",
          "car_wash_demo",
          "estetica_demo",
          "carpinteria_demo",
          "electricista_demo",
          "fast_food_demo",
        ],
        persisted: false,
        list: false,
        helperText:
          "Elige si quieres iniciar esta organización con una demo de ejemplo o con la configuración vacía del módulo principal.",
      },
      {
        name: "createdAt",
        label: "Creado",
        type: "date",
        editable: false,
      },
    ],
  },
  userOrganizations: {
    label: "Relaciones usuario-organización",
    singularLabel: "Relación",
    model: "userOrganization",
    description: "Administra la relación entre usuarios y organizaciones, incluyendo el rol dentro de cada organización.",
    pageSize: 10,
    fields: [
      {
        name: "userName",
        label: "Usuario",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "userId",
        label: "Usuario",
        type: "relation",
        relation: { resource: "users" },
        required: true,
        list: false,
      },
      {
        name: "organizationName",
        label: "Organización",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "organizationId",
        label: "Organización",
        type: "relation",
        relation: { resource: "organizations" },
        required: true,
        list: false,
      },
      {
        name: "role",
        label: "Rol dentro de la organización",
        type: "select",
        options: ["ORG_ADMIN", "EMPLOYEE"],
        required: true,
      },
      {
        name: "permissionProfile",
        label: "Perfil operativo",
        type: "select",
        options: [
          "FULL_SERVICE",
          "FRONT_DESK",
          "SALES_ONLY",
          "OPERATOR",
          "VIEW_ONLY",
        ],
        required: true,
      },
      {
        name: "createdAt",
        label: "Creado",
        type: "date",
        editable: false,
      },
    ],
  },
  loginCodes: {
    label: "Códigos de acceso",
    singularLabel: "Código de acceso",
    model: "loginCode",
    description: "Consulta y administra los códigos temporales usados para iniciar sesión.",
    pageSize: 10,
    searchFields: ["email", "code"],
    fields: [
      { name: "email", label: "Email", type: "email", required: true },
      { name: "code", label: "Código", type: "text", required: true },
      {
        name: "userName",
        label: "Usuario vinculado",
        type: "text",
        editable: false,
        persisted: false,
      },
      {
        name: "userId",
        label: "Usuario vinculado",
        type: "relation",
        relation: { resource: "users" },
        list: false,
      },
      {
        name: "expiresAt",
        label: "Expira",
        type: "date",
        required: true,
      },
      {
        name: "createdAt",
        label: "Creado",
        type: "date",
        editable: false,
      },
    ],
  },
} satisfies Record<string, AdminModelConfig>;

export type AdminModelKey = keyof typeof models;
export type AdminModelRegistry = typeof models;

export function getAdminModelKeys() {
  return Object.keys(models) as AdminModelKey[];
}

export function getAdminModelEntries() {
  return Object.entries(models) as [AdminModelKey, AdminModelConfig][];
}

export function getAdminModelConfig(modelKey: string) {
  return models[modelKey as AdminModelKey];
}

export function getListFields(config: AdminModelConfig) {
  return config.fields.filter((field) => field.list !== false);
}

export function getEditableFields(config: AdminModelConfig) {
  return config.fields.filter((field) => field.editable !== false);
}
