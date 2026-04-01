"use client";

import { CalendarDays, PlayCircle } from "lucide-react";
import { ServiceOrderFlowType } from "@prisma/client";

import type { ClientSearchMatch } from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";
import {
  formatMoney,
  type QuoteCalculatorTheme,
} from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";
import type { CaptureIntentMode } from "@/src/features/quote-calculator-v2/lib/capture-flow";

interface CaptureDetailsStepProps {
  intentMode: CaptureIntentMode;
  customerLabel: string;
  immediateLabel: string;
  scheduledLabel: string;
  customerName: string;
  customerPhone: string;
  selectedClient: ClientSearchMatch | null;
  clientMatches: ClientSearchMatch[];
  searchingClients: boolean;
  flowType: ServiceOrderFlowType;
  scheduledFor: string;
  canScheduleOrders: boolean;
  showOptionalDetails: boolean;
  orderNotes: string;
  assignedToUserId: string;
  assignableUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  currency: string;
  language: string;
  theme: QuoteCalculatorTheme;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onApplyClientSuggestion: (client: ClientSearchMatch) => void;
  formatClientActivity: (value: string | null) => string;
  onFlowTypeChange: (value: ServiceOrderFlowType) => void;
  onScheduledForChange: (value: string) => void;
  onToggleOptionalDetails: () => void;
  onOrderNotesChange: (value: string) => void;
  onAssignedToUserChange: (value: string) => void;
}

export function CaptureDetailsStep({
  intentMode,
  customerLabel,
  immediateLabel,
  scheduledLabel,
  customerName,
  customerPhone,
  selectedClient,
  clientMatches,
  searchingClients,
  flowType,
  scheduledFor,
  canScheduleOrders,
  showOptionalDetails,
  orderNotes,
  assignedToUserId,
  assignableUsers,
  currency,
  language,
  theme,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onApplyClientSuggestion,
  formatClientActivity,
  onFlowTypeChange,
  onScheduledForChange,
  onToggleOptionalDetails,
  onOrderNotesChange,
  onAssignedToUserChange,
}: CaptureDetailsStepProps) {
  const isAppointmentIntent = intentMode === "appointment";
  const isQuoteIntent = intentMode === "quote";
  const isPosLayout = theme.layoutVariant !== "stacked";
  const isTouch = theme.layoutVariant === "pos_touch";
  const optionalDetailsCount = Number(Boolean(orderNotes.trim())) + Number(Boolean(assignedToUserId));

  if (isPosLayout) {
    return (
      <div
        className={`admin-surface rounded-[28px] ${isTouch ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}
        style={{
          background: theme.surfaceBackground,
          borderColor: theme.surfaceBorder,
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.badgeText }}>
              {isAppointmentIntent ? "Agenda" : "Cliente"}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {isAppointmentIntent
                ? "Referencia y agenda"
                : isQuoteIntent
                  ? "Referencia opcional"
                  : "Datos rápidos"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isAppointmentIntent
                ? "Aparta la fecha y deja una referencia sin salirte del flujo de venta."
                : isQuoteIntent
                  ? "Solo captura lo mínimo para ubicar esta cotización después."
                  : "Si no necesitas cliente, puedes cobrar sin detenerte aquí."}
            </p>
          </div>

          <span
            className="inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: theme.badgeBorder,
              background: theme.badgeBackground,
              color: theme.badgeText,
            }}
          >
            {isAppointmentIntent ? "Paso corto" : "Opcional"}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div
            className="rounded-[24px] border p-3.5 sm:p-4"
            style={{
              borderColor: theme.panelBorder,
              background: theme.panelBackground,
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  {isAppointmentIntent ? "Persona o referencia" : `${customerLabel} o referencia`}
                </span>
                <input
                  value={customerName}
                  onChange={(event) => onCustomerNameChange(event.target.value)}
                  placeholder={
                    isAppointmentIntent
                      ? "Nombre para ubicar la cita"
                      : `Nombre de ${customerLabel.toLowerCase()} o referencia`
                  }
                  className="admin-input border-[#d7dee8] bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Teléfono</span>
                <input
                  value={customerPhone}
                  onChange={(event) => onCustomerPhoneChange(event.target.value)}
                  placeholder="Teléfono opcional"
                  className="admin-input border-[#d7dee8] bg-white px-4 py-3 text-sm"
                />
              </label>
            </div>
          </div>

          {selectedClient ? (
            <div
              className="rounded-[24px] border p-3.5 sm:p-4"
              style={{
                borderColor: theme.ticketBorder,
                background: theme.ticketMutedBackground,
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{selectedClient.name}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {[selectedClient.phone, selectedClient.email].filter(Boolean).join(" · ") || "Cliente ya registrado"}
                  </p>
                </div>
                <span
                  className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: theme.badgeBorder,
                    background: theme.ticketAccentBackground,
                    color: theme.ticketAccentText,
                  }}
                >
                  Historial encontrado
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Propuestas
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {selectedClient.quoteCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Ordenes
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {selectedClient.orderCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Pagado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {formatMoney(selectedClient.totalPaid, currency, language)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Ultima actividad: {formatClientActivity(selectedClient.lastActivityAt)}
              </p>
            </div>
          ) : null}

          {!selectedClient && (clientMatches.length > 0 || searchingClients) ? (
            <div
              className="rounded-[24px] border p-3.5 sm:p-4"
              style={{
                borderColor: theme.panelBorder,
                background: "#ffffff",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Coincidencias</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Toca una opción para reutilizar historial en segundos.
                  </p>
                </div>
                {searchingClients ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Buscando...
                  </span>
                ) : null}
              </div>

              {!searchingClients ? (
                <div className="mt-4 grid gap-2">
                  {clientMatches.slice(0, 4).map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => onApplyClientSuggestion(client)}
                      className="rounded-2xl border px-4 py-3 text-left transition hover:bg-slate-50"
                      style={{ borderColor: theme.panelBorder }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">{client.name}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {[client.phone, `${client.orderCount} ordenes`, `${client.quoteCount} propuestas`]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">Usar</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {isAppointmentIntent ? (
            <div
              className="rounded-[24px] border p-3.5 sm:p-4"
              style={{
                borderColor: theme.panelBorder,
                background: theme.panelBackground,
              }}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Fecha y forma de atencion</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Si cambia el plan, puedes moverlo a atencion inmediata sin salirte.
                  </p>
                </div>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-slate-700">Cuando lo vas a atender</span>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(event) => onScheduledForChange(event.target.value)}
                  className="admin-input border-[#d7dee8] bg-white px-4 py-3 text-sm"
                />
              </label>

              <div
                className="mt-5 grid gap-3 border-t pt-5 sm:mt-6 sm:grid-cols-2"
                style={{ borderColor: theme.panelBorder }}
              >
                <button
                  type="button"
                  onClick={() => onFlowTypeChange(ServiceOrderFlowType.SCHEDULED)}
                  disabled={!canScheduleOrders}
                  className="rounded-[22px] border p-4 text-left transition disabled:opacity-50"
                  style={{
                    borderColor:
                      flowType === ServiceOrderFlowType.SCHEDULED
                        ? theme.optionActiveBorder
                        : theme.optionInactiveBorder,
                    background:
                      flowType === ServiceOrderFlowType.SCHEDULED
                        ? theme.optionActiveBackground
                        : "#ffffff",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                      style={{
                        background: theme.ticketMutedBackground,
                        color: theme.ticketAccentText,
                      }}
                    >
                      <CalendarDays size={18} />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">{scheduledLabel}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Dejalo programado con fecha y hora.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onFlowTypeChange(ServiceOrderFlowType.WALK_IN)}
                  className="rounded-[22px] border p-4 text-left transition"
                  style={{
                    borderColor:
                      flowType === ServiceOrderFlowType.WALK_IN
                        ? theme.optionActiveBorder
                        : theme.optionInactiveBorder,
                    background:
                      flowType === ServiceOrderFlowType.WALK_IN
                        ? theme.optionActiveBackground
                        : "#ffffff",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                      style={{
                        background: theme.ticketMutedBackground,
                        color: theme.ticketAccentText,
                      }}
                    >
                      <PlayCircle size={18} />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">{immediateLabel}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Si se movio para hoy, puedes cobrarlo o guardarlo al momento.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : null}

          <div
            className="rounded-[24px] border p-3.5 sm:p-4"
            style={{
              borderColor: theme.panelBorder,
              background: "#ffffff",
            }}
          >
            <button
              type="button"
              onClick={onToggleOptionalDetails}
              className="flex w-full flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">Notas y responsable</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Agregalos solo si ayudan a operar mejor esta venta o cita.
                </p>
              </div>
              <span
                className="inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: theme.badgeBorder,
                  background: theme.badgeBackground,
                  color: theme.badgeText,
                }}
              >
                {showOptionalDetails
                  ? "Ocultar"
                  : optionalDetailsCount > 0
                    ? `${optionalDetailsCount} dato${optionalDetailsCount === 1 ? "" : "s"}`
                    : "Opcional"}
              </span>
            </button>

            {showOptionalDetails ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nota interna</span>
                  <textarea
                    value={orderNotes}
                    onChange={(event) => onOrderNotesChange(event.target.value)}
                    placeholder="Nota operativa opcional"
                    className="admin-input min-h-24 border-[#d7dee8] bg-white px-4 py-3 text-sm"
                  />
                </label>

                {assignableUsers.length > 0 ? (
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Responsable</span>
                    <select
                      value={assignedToUserId}
                      onChange={(event) => onAssignedToUserChange(event.target.value)}
                      className="admin-input border-[#d7dee8] bg-white px-4 py-3 text-sm"
                    >
                      <option value="">Responsable opcional</option>
                      {assignableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="admin-surface rounded-3xl p-6 sm:p-8"
      style={{
        background: theme.surfaceBackground,
        borderColor: theme.surfaceBorder,
      }}
    >
      <p className="ops-kicker">
        {isAppointmentIntent ? "Datos de la cita" : "Cliente"}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-slate-950">
        {isAppointmentIntent
          ? "Dejalo listo para agendar"
          : isQuoteIntent
            ? "Referencia opcional"
            : "Cobro rapido"}
      </h2>
      <p className="admin-muted mt-2 text-sm leading-6">
        {isAppointmentIntent
          ? "Solo pide lo necesario para apartar la fecha, guardar la nota y seguir trabajando."
          : isQuoteIntent
            ? "Si quieres, deja nombre o telefono para ubicar esta cotizacion despues."
            : "Si no necesitas datos del cliente, puedes cobrar sin detenerte aqui."}
      </p>

      <div className="mt-6 space-y-6">
        <div className="space-y-4 rounded-3xl border border-[#efe6d8] bg-white/70 p-4 sm:p-5">
          <div className="space-y-1">
            <p className="admin-label text-xs font-semibold uppercase tracking-[0.14em]">
              {isAppointmentIntent ? "Persona o referencia" : "Dato rapido"}
            </p>
            <p className="admin-muted text-sm leading-6">
              {isAppointmentIntent
                ? "Te ayuda a ubicar la cita y reutilizar historial si ya existe."
                : "Solo llena esto si te sirve para buscarlo o darle seguimiento despues."}
            </p>
          </div>
          <label className="space-y-2">
            <span className="admin-label block text-sm font-medium">{customerLabel} o referencia</span>
            <input
              value={customerName}
              onChange={(event) => onCustomerNameChange(event.target.value)}
              placeholder={`Nombre de ${customerLabel.toLowerCase()} o referencia`}
              className="admin-input px-4 py-3 text-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="admin-label block text-sm font-medium">Telefono</span>
            <input
              value={customerPhone}
              onChange={(event) => onCustomerPhoneChange(event.target.value)}
              placeholder="Telefono opcional"
              className="admin-input px-4 py-3 text-sm"
            />
          </label>
        </div>
        {selectedClient ? (
          <div className="rounded-2xl border border-[#eadfcb] bg-[#fffaf4] px-4 py-3 text-sm">
            <p className="font-semibold text-slate-950">
              {customerLabel} identificado: {selectedClient.name}
            </p>
            <p className="admin-muted mt-1 text-sm leading-6">
              {selectedClient.quoteCount} propuestas, {selectedClient.orderCount} ordenes y{" "}
              {formatMoney(selectedClient.totalPaid, currency, language)} pagado.
            </p>
            <p className="admin-muted text-xs leading-5">
              Ultima actividad: {formatClientActivity(selectedClient.lastActivityAt)}
            </p>
          </div>
        ) : null}
        {!selectedClient && (clientMatches.length > 0 || searchingClients) ? (
          <div className="rounded-2xl border border-[#eadfcb] bg-[#fffdfa] p-3">
            <p className="admin-label mb-2 text-xs font-semibold uppercase tracking-[0.14em]">
              Coincidencias encontradas
            </p>
            {searchingClients ? (
              <p className="admin-muted text-sm leading-6">Buscando coincidencias...</p>
            ) : (
              <div className="space-y-2">
                {clientMatches.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onApplyClientSuggestion(client)}
                    className="w-full rounded-2xl border border-[#efe6d8] bg-white px-3 py-3 text-left transition hover:border-[#ddd1bf]"
                  >
                    <p className="text-sm font-semibold text-slate-950">{client.name}</p>
                    <p className="admin-muted mt-1 text-xs leading-5">
                      {[client.phone, `${client.orderCount} ordenes`, `${client.quoteCount} propuestas`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {isAppointmentIntent ? (
          <div className="space-y-4 rounded-3xl border border-[#efe6d8] bg-white/70 p-4 sm:p-5">
            <div className="space-y-1">
              <p className="admin-label text-xs font-semibold uppercase tracking-[0.14em]">
                Fecha y hora
              </p>
              <p className="admin-muted text-sm leading-6">
                Aparta el espacio y guardalo sin llenar cosas de mas.
              </p>
            </div>

            <label className="space-y-2">
              <span className="admin-label block text-sm font-medium">Cuando lo vas a atender</span>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => onScheduledForChange(event.target.value)}
                className="admin-input px-4 py-3 text-sm"
              />
            </label>

            <div className="mt-5 grid gap-3 border-t border-[#efe6d8] pt-5 sm:mt-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onFlowTypeChange(ServiceOrderFlowType.SCHEDULED)}
                disabled={!canScheduleOrders}
                className={`rounded-2xl border p-4 text-left transition ${
                  flowType === ServiceOrderFlowType.SCHEDULED
                    ? "border-[var(--ops-primary)] bg-[rgba(21,94,117,0.08)]"
                    : "border-[var(--ops-border)] bg-white"
                } ${!canScheduleOrders ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(21,94,117,0.1)] text-[var(--ops-primary)]">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">{scheduledLabel}</p>
                    <p className="admin-muted mt-1 text-sm leading-6">
                      Dejalo programado con fecha y hora.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onFlowTypeChange(ServiceOrderFlowType.WALK_IN)}
                className={`rounded-2xl border p-4 text-left transition ${
                  flowType === ServiceOrderFlowType.WALK_IN
                    ? "border-[var(--ops-primary)] bg-[rgba(21,94,117,0.08)]"
                    : "border-[var(--ops-border)] bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(21,94,117,0.1)] text-[var(--ops-primary)]">
                    <PlayCircle size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">{immediateLabel}</p>
                    <p className="admin-muted mt-1 text-sm leading-6">
                      Si cambio el plan, tambien puedes dejarlo para hoy.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-[var(--ops-border)] bg-white px-4 py-4">
          <button
            type="button"
            onClick={onToggleOptionalDetails}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="font-semibold text-slate-950">Detalles opcionales</p>
              <p className="admin-muted mt-1 text-sm leading-6">
                {isAppointmentIntent
                  ? "Nota interna y responsable solo si hacen falta."
                  : "Agrega una nota o responsable solo si te ayuda."}
              </p>
            </div>
            <span className="text-sm font-semibold text-[var(--ops-primary)]">
              {showOptionalDetails ? "Ocultar" : "Ver"}
            </span>
          </button>

          {showOptionalDetails ? (
            <div className="mt-4 space-y-3">
              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Nota interna</span>
                <textarea
                  value={orderNotes}
                  onChange={(event) => onOrderNotesChange(event.target.value)}
                  placeholder="Nota operativa opcional"
                  className="admin-input min-h-24 px-4 py-3 text-sm"
                />
              </label>
              {assignableUsers.length > 0 ? (
                <label className="space-y-2">
                  <span className="admin-label block text-sm font-medium">Responsable</span>
                  <select
                    value={assignedToUserId}
                    onChange={(event) => onAssignedToUserChange(event.target.value)}
                    className="admin-input px-4 py-3 text-sm"
                  >
                    <option value="">Responsable opcional</option>
                    {assignableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
