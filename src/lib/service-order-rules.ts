import { ServiceOrderStatus } from "@prisma/client";

interface ServiceOrderRescheduleState {
  status: ServiceOrderStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  paidAt: Date | null;
}

export function canRescheduleServiceOrderStatus(status: ServiceOrderStatus) {
  return status === ServiceOrderStatus.DRAFT || status === ServiceOrderStatus.CONFIRMED;
}

export function getServiceOrderRescheduleBlockedReason(status: ServiceOrderStatus) {
  if (status === ServiceOrderStatus.IN_PROGRESS) {
    return "Esta orden ya inició y ya no se puede reprogramar.";
  }

  if (status === ServiceOrderStatus.COMPLETED) {
    return "Esta orden ya terminó y ya no se puede reprogramar.";
  }

  if (status === ServiceOrderStatus.PAID) {
    return "Esta orden ya fue cobrada y ya no se puede reprogramar.";
  }

  if (status === ServiceOrderStatus.CANCELLED) {
    return "Esta orden fue cancelada y ya no se puede reprogramar.";
  }

  return null;
}

export function getServiceOrderRescheduleDeniedMessage(
  order: ServiceOrderRescheduleState
) {
  if (order.paidAt || order.status === ServiceOrderStatus.PAID) {
    return "La orden ya fue cobrada y ya no se puede reprogramar.";
  }

  if (order.completedAt || order.status === ServiceOrderStatus.COMPLETED) {
    return "La orden ya terminó y ya no se puede reprogramar.";
  }

  if (order.startedAt || order.status === ServiceOrderStatus.IN_PROGRESS) {
    return "La orden ya inició y ya no se puede reprogramar.";
  }

  if (order.status === ServiceOrderStatus.CANCELLED) {
    return "La orden fue cancelada y ya no se puede reprogramar.";
  }

  if (!canRescheduleServiceOrderStatus(order.status)) {
    return "Esta orden ya no se puede reprogramar.";
  }

  return null;
}

export function canRescheduleServiceOrder(order: ServiceOrderRescheduleState) {
  return getServiceOrderRescheduleDeniedMessage(order) === null;
}
