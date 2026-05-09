export const NEGATIVE_CAPTURE_TOTAL_ERROR_MESSAGE =
  "El total no puede quedar negativo. Ajusta los descuentos antes de guardar.";

export function normalizeSignedMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount);
}

export function hasCaptureConcepts(itemCount: number) {
  return itemCount > 0;
}

export function isNegativeAmount(amount: number) {
  return amount < 0;
}

export function isValidManualAdjustmentAmount(value: unknown) {
  return normalizeSignedMoney(value) !== 0;
}

export function getManualAdjustmentLabel(amount: number) {
  return isNegativeAmount(amount) ? "Descuento manual" : "Ajuste manual";
}

export function getManualAdjustmentDetail(amount: number) {
  return isNegativeAmount(amount)
    ? "Este ajuste se resta del total."
    : "Este ajuste se suma al total.";
}

export function getNegativeAmountDetail(amount: number) {
  return isNegativeAmount(amount) ? "Este concepto se resta del total." : null;
}

export function getCaptureSummaryStatus(total: number, itemCount: number) {
  if (!hasCaptureConcepts(itemCount)) {
    return "Sin conceptos";
  }

  if (total < 0) {
    return "Revisa descuentos";
  }

  if (total === 0) {
    return "Total en cero";
  }

  return "Listo para cerrar";
}
