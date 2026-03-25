import { AdminModelConfig, getEditableFields } from "@/src/admin/config/models";

export function getInitialFormValues(config: AdminModelConfig) {
  return getEditableFields(config).reduce<Record<string, unknown>>((acc, field) => {
    if (field.type === "boolean") {
      acc[field.name] = false;
      return acc;
    }

    if (field.type === "multiselect") {
      acc[field.name] = [];
      return acc;
    }

    acc[field.name] = "";
    return acc;
  }, {});
}
