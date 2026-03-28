import {
  UserOrganizationPermissionProfile,
  UserOrganizationRole,
  UserRole,
} from "@prisma/client";

export interface OperationalFrontendAccess {
  canCreateQuotes: boolean;
  canConvertQuotes: boolean;
  canCreateOrders: boolean;
  canScheduleOrders: boolean;
  canProgressOrders: boolean;
  canChargeOrders: boolean;
  canViewClients: boolean;
  canUsePending: boolean;
  canUseNewSale: boolean;
  canUseAgenda: boolean;
  canUseClients: boolean;
  canUseCash: boolean;
  canUseQuotes: boolean;
  canUseOrders: boolean;
  canUseDashboard: boolean;
}

export function isSuperAdminRole(role: UserRole) {
  return role === UserRole.SUPER_ADMIN;
}

export function isSaasAdminRole(role: UserRole) {
  return role === UserRole.SAAS_ADMIN;
}

export function isPlatformAdminRole(role: UserRole) {
  return isSuperAdminRole(role) || isSaasAdminRole(role);
}

export function canUsePlatformDebug(role: UserRole) {
  return isSuperAdminRole(role);
}

export function canAccessPlatformAdmin(role: UserRole) {
  return isPlatformAdminRole(role);
}

export function canCreateOrganizations(role: UserRole) {
  return isPlatformAdminRole(role);
}

export function isOrganizationAdminRole(role: UserOrganizationRole | null | undefined) {
  return role === UserOrganizationRole.ORG_ADMIN;
}

export function canManageOrganization(
  userRole: UserRole,
  membershipRole: UserOrganizationRole | null | undefined
) {
  return isPlatformAdminRole(userRole) || isOrganizationAdminRole(membershipRole);
}

export function canManageOtherOrganizationAdmins(userRole: UserRole) {
  return isPlatformAdminRole(userRole);
}

export function canRemoveMembership(params: {
  actingUserId: string;
  actingUserRole: UserRole;
  targetUserId: string;
  targetMembershipRole: UserOrganizationRole;
}) {
  if (isPlatformAdminRole(params.actingUserRole)) {
    return true;
  }

  if (params.targetMembershipRole === UserOrganizationRole.ORG_ADMIN) {
    return params.actingUserId === params.targetUserId;
  }

  return true;
}

export function canManageQuoteConfig(
  userRole: UserRole,
  membershipRole: UserOrganizationRole | null | undefined
) {
  return canManageOrganization(userRole, membershipRole);
}

export function canUseManualAdjustments(
  userRole: UserRole,
  membershipRole: UserOrganizationRole | null | undefined
) {
  return canManageOrganization(userRole, membershipRole);
}

export function canPerformOperationalAction(
  profile: UserOrganizationPermissionProfile | null | undefined,
  action:
    | "create_quote"
    | "convert_quote"
    | "create_order"
    | "schedule_order"
    | "progress_order"
    | "charge_order"
    | "view_clients"
) {
  const effectiveProfile = profile ?? UserOrganizationPermissionProfile.FULL_SERVICE;

  switch (effectiveProfile) {
    case UserOrganizationPermissionProfile.FULL_SERVICE:
      return true;
    case UserOrganizationPermissionProfile.FRONT_DESK:
      return action !== "progress_order";
    case UserOrganizationPermissionProfile.SALES_ONLY:
      return action === "create_quote" || action === "view_clients";
    case UserOrganizationPermissionProfile.OPERATOR:
      return action === "progress_order";
    case UserOrganizationPermissionProfile.VIEW_ONLY:
    default:
      return false;
  }
}

export function getOperationalFrontendAccess(
  userRole: UserRole,
  membershipRole: UserOrganizationRole | null | undefined,
  permissionProfile: UserOrganizationPermissionProfile | null | undefined
): OperationalFrontendAccess {
  const managerOverride = canManageOrganization(userRole, membershipRole);
  const canCreateQuotes =
    managerOverride || canPerformOperationalAction(permissionProfile, "create_quote");
  const canConvertQuotes =
    managerOverride || canPerformOperationalAction(permissionProfile, "convert_quote");
  const canCreateOrders =
    managerOverride || canPerformOperationalAction(permissionProfile, "create_order");
  const canScheduleOrders =
    managerOverride || canPerformOperationalAction(permissionProfile, "schedule_order");
  const canProgressOrders =
    managerOverride || canPerformOperationalAction(permissionProfile, "progress_order");
  const canChargeOrders =
    managerOverride || canPerformOperationalAction(permissionProfile, "charge_order");
  const canViewClients =
    managerOverride || canPerformOperationalAction(permissionProfile, "view_clients");

  return {
    canCreateQuotes,
    canConvertQuotes,
    canCreateOrders,
    canScheduleOrders,
    canProgressOrders,
    canChargeOrders,
    canViewClients,
    canUsePending:
      canConvertQuotes || canCreateOrders || canProgressOrders || canChargeOrders,
    canUseNewSale: canCreateQuotes || canCreateOrders,
    canUseAgenda: canScheduleOrders || canProgressOrders || canChargeOrders,
    canUseClients: canViewClients,
    canUseCash: canChargeOrders,
    canUseQuotes: canCreateQuotes || canConvertQuotes,
    canUseOrders:
      canCreateOrders || canScheduleOrders || canProgressOrders || canChargeOrders,
    canUseDashboard: managerOverride || canProgressOrders || canChargeOrders,
  };
}

export function canPerformOperationalActionForContext(
  userRole: UserRole,
  membershipRole: UserOrganizationRole | null | undefined,
  permissionProfile: UserOrganizationPermissionProfile | null | undefined,
  action:
    | "create_quote"
    | "convert_quote"
    | "create_order"
    | "schedule_order"
    | "progress_order"
    | "charge_order"
    | "view_clients"
) {
  return (
    canManageOrganization(userRole, membershipRole) ||
    canPerformOperationalAction(permissionProfile, action)
  );
}

export function getUserRoleLabel(role: UserRole) {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "Super admin";
    case UserRole.SAAS_ADMIN:
      return "Admin SaaS";
    case UserRole.STANDARD_USER:
    default:
      return "Usuario";
  }
}

export function getOrganizationRoleLabel(role: UserOrganizationRole | null | undefined) {
  switch (role) {
    case UserOrganizationRole.ORG_ADMIN:
      return "Admin organización";
    case UserOrganizationRole.EMPLOYEE:
      return "Empleado";
    default:
      return null;
  }
}

export function getPermissionProfileLabel(
  profile: UserOrganizationPermissionProfile | null | undefined
) {
  switch (profile) {
    case UserOrganizationPermissionProfile.FULL_SERVICE:
      return "Servicio completo";
    case UserOrganizationPermissionProfile.FRONT_DESK:
      return "Recepción";
    case UserOrganizationPermissionProfile.SALES_ONLY:
      return "Solo ventas";
    case UserOrganizationPermissionProfile.OPERATOR:
      return "Operador";
    case UserOrganizationPermissionProfile.VIEW_ONLY:
      return "Solo lectura";
    default:
      return null;
  }
}
