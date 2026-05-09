import assert from "node:assert/strict";
import test from "node:test";

import {
  getCaptureSummaryStatus,
  getManualAdjustmentDetail,
  getManualAdjustmentLabel,
  isValidManualAdjustmentAmount,
  normalizeSignedMoney,
} from "./capture-amounts";

test("normalizeSignedMoney preserves positive and negative rounded amounts", () => {
  assert.equal(normalizeSignedMoney(300.4), 300);
  assert.equal(normalizeSignedMoney(-299.6), -300);
  assert.equal(normalizeSignedMoney("not-a-number"), 0);
});

test("isValidManualAdjustmentAmount accepts signed values and rejects zero", () => {
  assert.equal(isValidManualAdjustmentAmount(300), true);
  assert.equal(isValidManualAdjustmentAmount(-300), true);
  assert.equal(isValidManualAdjustmentAmount(0), false);
  assert.equal(isValidManualAdjustmentAmount(0.4), false);
});

test("manual adjustment copy changes when the amount is a discount", () => {
  assert.equal(getManualAdjustmentLabel(180), "Ajuste manual");
  assert.equal(getManualAdjustmentLabel(-180), "Descuento manual");
  assert.equal(getManualAdjustmentDetail(-180), "Este ajuste se resta del total.");
});

test("capture summary status distinguishes empty and zero-total captures", () => {
  assert.equal(getCaptureSummaryStatus(0, 0), "Sin conceptos");
  assert.equal(getCaptureSummaryStatus(0, 2), "Total en cero");
  assert.equal(getCaptureSummaryStatus(250, 2), "Listo para cerrar");
  assert.equal(getCaptureSummaryStatus(-50, 2), "Revisa descuentos");
});
