"use client";

import {
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  StatCard,
  StatusBadge,
} from "@/src/components/ui/OperationsUI";
import Toast from "@/src/components/ui/Toast";
import {
  QUOTE_CONFIG_PRESETS,
  QuoteConfigPresetKey,
} from "@/src/features/quote-calculator-v2/lib/presets";
import { V2PageHero } from "@/src/features/v2/shell/V2Shell";
import {
  getOrganizationRoleLabel,
  getPermissionProfileLabel,
} from "@/src/lib/authorization";

interface OrganizationAdminClientProps {
  canCreateOrganization: boolean;
  currentUserId: string;
  canManageOtherAdmins: boolean;
  currentOrganizationId: string | null;
  currentOrganizationName: string | null;
  manageableOrganizations: Array<{
    id: string;
    name: string;
  }>;
  members: Array<{
    id: string;
    role: string;
    permissionProfile: string;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

const ROLE_HELPERS: Record<string, string> = {
  ORG_ADMIN: "Puede editar la organización, gestionar usuarios y configurar el flujo.",
  EMPLOYEE: "Usa la operación diaria según el perfil operativo que le asignes.",
};

const PROFILE_HELPERS: Record<string, string> = {
  FULL_SERVICE: "Puede crear propuestas, registrar trabajos, programar, avanzar y cobrar.",
  FRONT_DESK: "Ideal para recepción. Puede vender, agendar y cobrar.",
  SALES_ONLY: "Solo registra propuestas. No opera ni cobra.",
  OPERATOR: "Solo trabaja órdenes asignadas. No vende ni cobra.",
  VIEW_ONLY: "Solo consulta información sin modificarla.",
};

const DEFAULT_NEW_MEMBER_ROLE = "EMPLOYEE";
const DEFAULT_NEW_MEMBER_PROFILE = "VIEW_ONLY";
type OrganizationAdminSection = "team" | "permissions" | "organization";

function OrganizationSectionCard({
  icon,
  eyebrow,
  label,
  description,
  active,
  onClick,
}: {
  icon: ReactNode;
  eyebrow: string;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[28px] border p-5 text-left transition sm:p-6 ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
          : "border-[#e8dece] bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.04)] hover:border-[#d6c8b3] hover:bg-[#fffdf9]"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
            active
              ? "border-white/10 bg-white/10 text-white"
              : "border-[#eadfcb] bg-[#fff7eb] text-slate-900"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.16em] ${
              active ? "text-white/70" : "text-slate-500"
            }`}
          >
            {eyebrow}
          </p>
          <h2 className="mt-2 font-poppins text-lg font-semibold">{label}</h2>
          <p
            className={`mt-2 text-sm leading-6 ${
              active ? "text-white/80" : "text-slate-600"
            }`}
          >
            {description}
          </p>
          <p
            className={`mt-4 text-sm font-semibold ${
              active ? "text-white" : "text-slate-700"
            }`}
          >
            {active ? "Sección activa" : "Abrir sección"}
          </p>
        </div>
      </div>
    </button>
  );
}

export function OrganizationAdminClient({
  canCreateOrganization,
  currentUserId,
  canManageOtherAdmins,
  currentOrganizationId,
  currentOrganizationName,
  manageableOrganizations,
  members,
}: OrganizationAdminClientProps) {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [quoteConfigPreset, setQuoteConfigPreset] = useState<QuoteConfigPresetKey>("none");
  const [email, setEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<string>(DEFAULT_NEW_MEMBER_ROLE);
  const [newMemberPermissionProfile, setNewMemberPermissionProfile] =
    useState<string>(DEFAULT_NEW_MEMBER_PROFILE);
  const [activeSection, setActiveSection] =
    useState<OrganizationAdminSection>("team");
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [assigningUser, setAssigningUser] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [memberEdits, setMemberEdits] = useState<
    Record<string, { role: string; permissionProfile: string }>
  >(() =>
    Object.fromEntries(
      members.map((member) => [
        member.id,
        {
          role: member.role,
          permissionProfile: member.permissionProfile,
        },
      ])
    )
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const adminCount = members.filter((member) => member.role === "ORG_ADMIN").length;
  const employeeCount = members.filter((member) => member.role === "EMPLOYEE").length;
  const sectionOptions: Array<{
    id: OrganizationAdminSection;
    eyebrow: string;
    label: string;
    description: string;
    icon: ReactNode;
  }> = [
    {
      id: "team",
      eyebrow: "Personas",
      label: "Equipo",
      description: "Agrega personas y revisa quién ya trabaja en esta organización.",
      icon: <Users size={20} />,
    },
    {
      id: "permissions",
      eyebrow: "Acceso",
      label: "Permisos",
      description: "Define qué puede hacer cada persona dentro de la operación.",
      icon: <ShieldCheck size={20} />,
    },
    {
      id: "organization",
      eyebrow: "Negocio",
      label: "Organización",
      description: "Revisa la organización activa y crea nuevas organizaciones si aplica.",
      icon: <Building2 size={20} />,
    },
  ];

  async function createOrganization() {
    if (!organizationName.trim()) {
      setToast({
        message: "Escribe un nombre para la organización",
        type: "info",
      });
      return;
    }

    setCreatingOrganization(true);

    try {
      const response = await fetch("/api/organization-admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: organizationName, quoteConfigPreset }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo crear la organización");
      }

      setOrganizationName("");
      setToast({
        message: "Organización creada correctamente",
        type: "success",
      });
      router.push("/organization-admin");
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setCreatingOrganization(false);
    }
  }

  async function assignExistingUser() {
    if (!currentOrganizationId) {
      setToast({
        message: "Selecciona primero la organización que quieres administrar",
        type: "info",
      });
      return;
    }

    if (!email.trim()) {
      setToast({
        message: "Escribe el correo del usuario",
        type: "info",
      });
      return;
    }

    setAssigningUser(true);

    try {
      const response = await fetch("/api/organization-admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          organizationId: currentOrganizationId,
          role: newMemberRole,
          permissionProfile:
            newMemberRole === "ORG_ADMIN" ? "FULL_SERVICE" : newMemberPermissionProfile,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo asignar el usuario");
      }

      setEmail("");
      setNewMemberRole(DEFAULT_NEW_MEMBER_ROLE);
      setNewMemberPermissionProfile(DEFAULT_NEW_MEMBER_PROFILE);
      setToast({
        message: payload.message || "Usuario asignado correctamente",
        type: payload.status === "existing" ? "info" : "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setAssigningUser(false);
    }
  }

  async function updateMember(memberId: string) {
    const member = members.find((entry) => entry.id === memberId);
    const nextRole = memberEdits[memberId]?.role ?? member?.role ?? "EMPLOYEE";

    if (
      member &&
      member.role !== "ORG_ADMIN" &&
      nextRole === "ORG_ADMIN" &&
      !window.confirm(
        "Esta persona tendrá acceso total a la organización. ¿Quieres convertirla en admin de organización?"
      )
    ) {
      return;
    }

    setUpdatingMemberId(memberId);

    try {
      const response = await fetch("/api/organization-admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: memberId,
          role: memberEdits[memberId]?.role,
          permissionProfile: memberEdits[memberId]?.permissionProfile,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron guardar los permisos");
      }

      setToast({
        message: payload.message || "Permisos actualizados correctamente",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function removeMember(memberId: string) {
    setRemovingMemberId(memberId);

    try {
      const response = await fetch("/api/organization-admin/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: memberId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo desvincular al usuario");
      }

      setToast({
        message: payload.message || "Usuario desvinculado correctamente",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setRemovingMemberId(null);
    }
  }

  return (
    <>
      <div className="space-y-5">
        <V2PageHero
          kicker="Organización"
          title="Equipo y permisos"
          description="Aquí decides quién entra a esta organización, qué nivel de acceso tiene cada persona y cómo se reparte la operación."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Organización activa"
            value={currentOrganizationName ?? "Sin selección"}
            hint="Todo lo que cambies aquí se aplica a esta organización."
          />
          <StatCard
            label="Usuarios ligados"
            value={members.length}
            hint={`${adminCount} admin${adminCount === 1 ? "" : "s"} y ${employeeCount} empleado${employeeCount === 1 ? "" : "s"}.`}
          />
          <StatCard
            label="Organizaciones que administras"
            value={manageableOrganizations.length}
            hint="Puedes cambiar entre ellas desde el panel lateral."
          />
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              ¿Qué quieres administrar?
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Entra directo al bloque que necesitas sin tener que pensar en estructura interna.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
          {sectionOptions.map((section) => {
            const active = activeSection === section.id;

            return (
              <OrganizationSectionCard
                key={section.id}
                icon={section.icon}
                eyebrow={section.eyebrow}
                label={section.label}
                description={section.description}
                active={active}
                onClick={() => setActiveSection(section.id)}
              />
            );
          })}
          </div>
        </section>

        {activeSection === "team" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <section className="space-y-6">
              <div className="admin-surface rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="admin-label text-sm font-medium">Agregar usuario existente</p>
                    <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                      {currentOrganizationName ?? "Selecciona una organización"}
                    </h2>
                  </div>
                  {currentOrganizationName ? (
                    <StatusBadge tone="info">Organización activa</StatusBadge>
                  ) : null}
                </div>
                <p className="admin-muted mt-3 text-sm leading-6">
                  {currentOrganizationName
                    ? "Escribe el correo exacto del usuario. Si ya existe en la base, quedará ligado a esta organización sin crear una cuenta nueva."
                    : "Primero elige una organización del panel lateral para poder administrar su equipo."}
                </p>

                <div className="mt-6 space-y-4">
                  <label className="block space-y-2">
                    <span className="admin-label block text-sm font-medium">
                      Correo del usuario
                    </span>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="usuario@correo.com"
                      className="admin-input px-4 py-3 text-sm"
                    />
                    <p className="admin-muted text-xs leading-5">
                      Usa el mismo correo con el que esa persona inicia sesión en el sistema.
                    </p>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="admin-label block text-sm font-medium">Rol inicial</span>
                      <select
                        value={newMemberRole}
                        onChange={(event) => {
                          const nextRole = event.target.value;
                          setNewMemberRole(nextRole);
                          if (nextRole === "ORG_ADMIN") {
                            setNewMemberPermissionProfile("FULL_SERVICE");
                          }
                        }}
                        className="admin-input px-4 py-3 text-sm"
                      >
                        {canManageOtherAdmins ? (
                          <option value="ORG_ADMIN">Admin organización</option>
                        ) : null}
                        <option value="EMPLOYEE">Empleado</option>
                      </select>
                      <p className="admin-muted text-xs leading-5">
                        {newMemberRole === "ORG_ADMIN"
                          ? "Tendrá acceso total para administrar la organización."
                          : "Úsalo para operación diaria dentro del negocio."}
                      </p>
                    </label>

                    <label className="block space-y-2">
                      <span className="admin-label block text-sm font-medium">Perfil inicial</span>
                      {newMemberRole === "ORG_ADMIN" ? (
                        <>
                          <div className="admin-input flex items-center px-4 py-3 text-sm text-slate-600">
                            No aplica para admins
                          </div>
                          <p className="admin-muted text-xs leading-5">
                            Los admins de organización ya tienen acceso completo.
                          </p>
                        </>
                      ) : (
                        <>
                          <select
                            value={newMemberPermissionProfile}
                            onChange={(event) => setNewMemberPermissionProfile(event.target.value)}
                            className="admin-input px-4 py-3 text-sm"
                          >
                            <option value="FULL_SERVICE">Servicio completo</option>
                            <option value="FRONT_DESK">Recepción</option>
                            <option value="SALES_ONLY">Solo ventas</option>
                            <option value="OPERATOR">Operador</option>
                            <option value="VIEW_ONLY">Solo lectura</option>
                          </select>
                          <p className="admin-muted text-xs leading-5">
                            {PROFILE_HELPERS[newMemberPermissionProfile]}
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={assignExistingUser}
                    disabled={assigningUser || !currentOrganizationId}
                    className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60 sm:w-auto"
                  >
                    {assigningUser ? "Asignando..." : "Asignar usuario existente"}
                  </button>
                </div>
              </div>

              <div className="admin-surface rounded-3xl p-6 sm:p-8">
                <p className="admin-label text-sm font-medium">Equipo actual</p>
                <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                  Personas ligadas
                </h2>
                <p className="admin-muted mt-3 text-sm leading-6">
                  Aquí ves quién ya pertenece a esta organización antes de entrar a editar permisos.
                </p>

                {members.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {members.map((member) => (
                      <article
                        key={member.id}
                        className="admin-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="admin-muted mt-1 break-words text-sm">
                            {member.user.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
                            {getOrganizationRoleLabel(member.role as never) || member.role}
                          </span>
                          <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
                            {member.role === "ORG_ADMIN"
                              ? "Acceso total"
                              : getPermissionProfileLabel(member.permissionProfile as never) ||
                                member.permissionProfile}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-[#eadfcb] bg-[#fffaf4] p-5">
                    <p className="text-sm font-medium text-slate-700">
                      Aún no hay usuarios ligados a esta organización.
                    </p>
                    <p className="admin-muted mt-2 text-sm leading-6">
                      Usa el formulario superior para agregar a la primera persona.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="admin-surface rounded-3xl p-6 sm:p-8">
                <p className="admin-label text-sm font-medium">Organización en edición</p>
                <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                  {currentOrganizationName ?? "Sin organización activa"}
                </h2>
                <p className="admin-muted mt-3 text-sm leading-6">
                  Todo lo que cambies aquí se aplica a esta organización. Si necesitas moverte a otra,
                  usa la acción global de navegación.
                </p>
                <div className="mt-4 inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
                  {manageableOrganizations.length} organización{manageableOrganizations.length === 1 ? "" : "es"} administrable{manageableOrganizations.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="admin-surface rounded-3xl p-6 sm:p-8">
                <p className="admin-label text-sm font-medium">Siguiente paso recomendado</p>
                <div className="mt-4 rounded-[24px] border border-[#e8dece] bg-[#fffdf9] p-5">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#eadfcb] bg-[#fff7eb] text-slate-900">
                      <ShieldCheck size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="admin-title font-poppins text-xl font-semibold text-slate-950">
                        Ajusta permisos si el equipo ya está completo
                      </h2>
                      <p className="admin-muted mt-3 text-sm leading-6">
                        Cuando ya ligaste a las personas correctas, entra a Permisos para decidir quién vende, quién opera y quién solo consulta.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveSection("permissions")}
                        className="admin-secondary mt-5 w-full px-4 py-3 text-sm font-semibold sm:w-auto"
                      >
                        Ir a permisos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {activeSection === "permissions" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <section className="space-y-6">
            <div className="admin-surface rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="admin-label text-sm font-medium">Permisos por persona</p>
                  <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                    Roles y perfiles operativos
                  </h2>
                  <p className="admin-muted mt-3 text-sm leading-6">
                    Aquí decides si una persona administra, vende, opera o solo consulta.
                  </p>
                </div>
                {currentOrganizationName ? (
                  <span className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                    {currentOrganizationName}
                  </span>
                ) : null}
              </div>

              {members.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {members.map((member) => {
                    const editedRole = memberEdits[member.id]?.role ?? member.role;
                    const editedProfile =
                      editedRole === "ORG_ADMIN"
                        ? "FULL_SERVICE"
                        : memberEdits[member.id]?.permissionProfile ?? member.permissionProfile;
                    const originalProfile =
                      member.role === "ORG_ADMIN" ? "FULL_SERVICE" : member.permissionProfile;
                    const isDirty =
                      editedRole !== member.role || editedProfile !== originalProfile;
                    const isSelf = member.user.id === currentUserId;
                    const isAdminMember = member.role === "ORG_ADMIN";
                    const isLastAdmin = isAdminMember && adminCount <= 1;
                    const canChangeRole =
                      !isLastAdmin &&
                      (canManageOtherAdmins || (isAdminMember && isSelf));
                    const roleLockedReason = isLastAdmin
                      ? "Debe existir al menos un admin en la organización."
                      : isAdminMember && !canManageOtherAdmins && !isSelf
                        ? "Solo un admin SaaS puede cambiar el rol de otro admin."
                        : !isAdminMember && !canManageOtherAdmins
                          ? "Solo un admin SaaS puede promover a otra persona como admin."
                          : null;
                    const removeLockedReason = isLastAdmin
                      ? "Debe quedar al menos un admin en la organización."
                      : isAdminMember && !canManageOtherAdmins && !isSelf
                        ? "Solo puedes desvincularte a ti mismo o pedir apoyo a un admin SaaS."
                        : null;

                    return (
                      <div
                        key={member.id}
                        className="admin-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="admin-muted mt-1 break-words text-sm">
                          {member.user.email}
                        </p>
                        <p className="admin-muted mt-1 text-xs leading-5">
                          {getOrganizationRoleLabel(member.role as never) || member.role} ·{" "}
                          {getPermissionProfileLabel(member.permissionProfile as never) ||
                            member.permissionProfile}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:min-w-[360px] sm:grid-cols-2">
                        <label className="space-y-1">
                          <span className="admin-label block text-xs font-medium">Rol</span>
                          {canChangeRole ? (
                            <select
                              value={editedRole}
                              onChange={(event) =>
                                setMemberEdits((current) => ({
                                  ...current,
                                  [member.id]: {
                                    ...current[member.id],
                                    role: event.target.value,
                                    permissionProfile:
                                      event.target.value === "ORG_ADMIN"
                                        ? "FULL_SERVICE"
                                        : current[member.id]?.permissionProfile ??
                                          member.permissionProfile,
                                  },
                                }))
                              }
                              className="admin-input px-3 py-2 text-sm"
                            >
                              <option value="ORG_ADMIN">Admin organización</option>
                              <option value="EMPLOYEE">Empleado</option>
                            </select>
                          ) : (
                            <div className="admin-input flex items-center px-3 py-2 text-sm text-slate-700">
                              {getOrganizationRoleLabel(editedRole as never) || editedRole}
                            </div>
                          )}
                          <p className="admin-muted text-xs leading-5">
                            {roleLockedReason || ROLE_HELPERS[editedRole]}
                          </p>
                        </label>
                        <label className="space-y-1">
                          <span className="admin-label block text-xs font-medium">Perfil</span>
                          {editedRole === "ORG_ADMIN" ? (
                            <>
                              <div className="admin-input flex items-center px-3 py-2 text-sm text-slate-700">
                                Acceso total
                              </div>
                              <p className="admin-muted text-xs leading-5">
                                Los admins de organización tienen acceso completo. El perfil operativo no aplica.
                              </p>
                            </>
                          ) : (
                            <>
                              <select
                                value={editedProfile}
                                onChange={(event) =>
                                  setMemberEdits((current) => ({
                                    ...current,
                                    [member.id]: {
                                      ...current[member.id],
                                      permissionProfile: event.target.value,
                                    },
                                  }))
                                }
                                className="admin-input px-3 py-2 text-sm"
                              >
                                <option value="FULL_SERVICE">Servicio completo</option>
                                <option value="FRONT_DESK">Recepción</option>
                                <option value="SALES_ONLY">Solo ventas</option>
                                <option value="OPERATOR">Operador</option>
                                <option value="VIEW_ONLY">Solo lectura</option>
                              </select>
                              <p className="admin-muted text-xs leading-5">
                                {PROFILE_HELPERS[editedProfile]}
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {isDirty ? (
                          <button
                            type="button"
                            onClick={() => updateMember(member.id)}
                            disabled={updatingMemberId === member.id}
                            className="admin-secondary px-4 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            {updatingMemberId === member.id ? "Guardando..." : "Guardar"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          disabled={
                            removingMemberId === member.id ||
                            Boolean(removeLockedReason)
                          }
                          className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-60"
                        >
                          {removingMemberId === member.id ? "Quitando..." : "Desvincular"}
                        </button>
                      </div>
                      {removeLockedReason ? (
                        <p className="admin-muted text-xs leading-5 sm:ml-auto">
                          {removeLockedReason}
                        </p>
                      ) : null}
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-[#eadfcb] bg-[#fffaf4] p-5">
                  <p className="text-sm font-medium text-slate-700">
                    Aún no hay usuarios ligados a esta organización.
                  </p>
                  <p className="admin-muted mt-2 text-sm leading-6">
                    Usa el campo de correo para agregar a un usuario existente.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <div className="admin-surface rounded-3xl p-6 sm:p-8">
              <p className="admin-label text-sm font-medium">Cómo se interpreta el acceso</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-[24px] border border-[#e8dece] bg-[#fffdf9] p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadfcb] bg-[#fff7eb] text-slate-900">
                      <BriefcaseBusiness size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Admin organización</p>
                      <p className="admin-muted mt-1 text-sm leading-6">
                        Administra la organización, el equipo y la configuración. El perfil operativo no limita este acceso.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[24px] border border-[#e8dece] bg-[#fffdf9] p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadfcb] bg-[#fff7eb] text-slate-900">
                      <Users size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Empleado</p>
                      <p className="admin-muted mt-1 text-sm leading-6">
                        Su acceso depende del perfil que le asignes: recepción, operador, ventas o solo lectura.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : null}

        {activeSection === "organization" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
            <section className="space-y-6">
              <div className="admin-surface rounded-3xl p-6 sm:p-8">
                <p className="admin-label text-sm font-medium">Organización en edición</p>
                <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                  {currentOrganizationName ?? "Sin organización activa"}
                </h2>
                <p className="admin-muted mt-3 text-sm leading-6">
                  Todo lo que cambies aquí se aplica a esta organización. Si necesitas cambiar de organización, usa la acción global de navegación.
                </p>
                <div className="mt-4 inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
                  {manageableOrganizations.length} organización{manageableOrganizations.length === 1 ? "" : "es"} administrable{manageableOrganizations.length === 1 ? "" : "s"}
                </div>
              </div>

              {canCreateOrganization ? (
                <div className="admin-surface rounded-3xl p-6 sm:p-8">
                  <p className="admin-label text-sm font-medium">Nueva organización</p>
                  <h2 className="admin-title mt-2 font-poppins text-2xl font-semibold text-slate-950">
                    Crea otra organización
                  </h2>
                  <p className="admin-muted mt-3 text-sm leading-6">
                    Al crearla, quedarás ligado como administrador y la app dejará lista una base inicial para empezar más rápido.
                  </p>

                  <div className="mt-6 space-y-4">
                    <label className="block space-y-2">
                      <span className="admin-label block text-sm font-medium">
                        Nombre de la organización
                      </span>
                      <input
                        value={organizationName}
                        onChange={(event) => setOrganizationName(event.target.value)}
                        placeholder="Ejemplo: GICA Dental"
                        className="admin-input px-4 py-3 text-sm"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="admin-label block text-sm font-medium">
                        Configuración inicial de captura
                      </span>
                      <select
                        value={quoteConfigPreset}
                        onChange={(event) =>
                          setQuoteConfigPreset(event.target.value as QuoteConfigPresetKey)
                        }
                        className="admin-input px-4 py-3 text-sm"
                      >
                        {Object.entries(QUOTE_CONFIG_PRESETS).map(([value, preset]) => (
                          <option key={value} value={value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                      <p className="admin-muted text-sm leading-6">
                        {QUOTE_CONFIG_PRESETS[quoteConfigPreset].description}
                      </p>
                    </label>

                    <button
                      type="button"
                      onClick={createOrganization}
                      disabled={creatingOrganization}
                      className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-60 sm:w-auto"
                    >
                      {creatingOrganization ? "Creando..." : "Crear organización"}
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="space-y-6">
              <div className="admin-surface rounded-3xl p-6 sm:p-8">
                <p className="admin-label text-sm font-medium">Qué puedes hacer aquí</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-[24px] border border-[#e8dece] bg-[#fffdf9] p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadfcb] bg-[#fff7eb] text-slate-900">
                        <Building2 size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Administrar esta organización</p>
                        <p className="admin-muted mt-1 text-sm leading-6">
                          Revisa a qué organización afectan tus cambios y usa el menú global si necesitas cambiar de espacio.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[#e8dece] bg-[#fffdf9] p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadfcb] bg-[#fff7eb] text-slate-900">
                        <BriefcaseBusiness size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Crear nuevas organizaciones</p>
                        <p className="admin-muted mt-1 text-sm leading-6">
                          Si tu cuenta lo permite, puedes crear otra organización y dejarle una base inicial de captura.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
