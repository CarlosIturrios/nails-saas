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
  resource: "users" | "organizations";
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
      {
        name: "role",
        label: "Rol",
        type: "select",
        options: ["ADMIN", "EMPLOYEE"],
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
  organizations: {
    label: "Organizaciones",
    singularLabel: "Organización",
    model: "organization",
    description: "Gestiona todas las organizaciones y los usuarios ligados a cada una.",
    pageSize: 10,
    searchFields: ["name"],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
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
        label: "Plantilla inicial de cotizaciones",
        type: "select",
        options: [
          "none",
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
        ],
        persisted: false,
        list: false,
        helperText:
          "Elige si quieres iniciar esta organización con una demo de ejemplo o con la configuración vacía.",
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
        options: ["ADMIN", "MEMBER"],
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
