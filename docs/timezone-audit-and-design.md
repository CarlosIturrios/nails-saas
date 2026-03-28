# Manejo de Zonas Horarias

## Fase 1: Auditoría

### Hallazgos principales

| Riesgo | Hallazgo | Dónde aparecía | Caso real de falla |
| --- | --- | --- | --- |
| Alto | Strings `datetime-local` llegaban al backend sin zona horaria y se convertían con `new Date(...)` usando la zona del runtime. | `src/app/api/service-orders/route.ts`, `src/app/api/quotes/route.ts`, `src/app/api/service-orders/[id]/schedule/route.ts`, `src/app/api/quotes/[id]/convert/route.ts`, `src/lib/service-orders.ts`, `src/lib/quotes.ts` | Una cita capturada a las `10:00` en `America/Tijuana` podía guardarse como `10:00` del servidor si el backend corría en otra zona. |
| Alto | Los filtros de día/semana/mes se calculaban con `setHours`, `setDate`, `getMonth`, `getDay` y `getTimezoneOffset` del runtime. | `src/features/v2/lib/filters.ts`, `src/lib/pending-operations.ts`, `src/lib/service-orders.ts`, `src/lib/dates.ts` | “Hoy” y “este mes” podían incluir o excluir registros equivocados al cambiar horario de verano o al usar SSR con una zona distinta al navegador. |
| Alto | Cliente y servidor resolvían fechas con zonas implícitas diferentes. | Páginas `src/app/v2/*` + boards `src/components/orders/*`, `src/components/quotes/QuotesBoard.tsx`, `src/components/operations/PendingOperationsBoard.tsx` | El servidor filtraba una orden fuera del rango, pero el cliente la mostraba con hora local “correcta”, ocultando el bug hasta caja o reportes. |
| Medio | La UI convertía ISO UTC a `datetime-local` restando `getTimezoneOffset()`, acoplando el input a la zona actual del navegador. | `src/components/orders/ServiceAgendaBoard.tsx`, `src/components/quotes/QuotesBoard.tsx`, `src/admin/components/AdminModelClient.tsx` | Reprogramar una cita al viajar de ciudad podía desplazar la hora o dejar el input desalineado contra lo guardado. |
| Medio | La zona por default de organización no existía en el modelo, así que no había fallback determinístico. | `prisma/schema.prisma`, contexto de organización y páginas operativas | Si el navegador no exponía una zona válida, la app caía a la zona del servidor o a UTC implícito. |
| Medio | La preferencia explícita del usuario no existía en datos ni en UI. | `prisma/schema.prisma`, `src/app/v2/mas/page.tsx` | Un usuario con dispositivo mal configurado no podía fijar su propia zona. |
| Bajo | El admin genérico editaba y mostraba fechas con timezone implícita. | `src/admin/components/AdminModelClient.tsx`, `src/admin/lib/data.ts` | Un ajuste manual desde Admin podía guardar una fecha distinta a la que el operador veía. |

### Suposiciones implícitas detectadas

- Que `new Date("YYYY-MM-DDTHH:mm")` era “seguro” para citas.
- Que `getTimezoneOffset()` del navegador bastaba para SSR y filtros.
- Que “hoy” podía calcularse igual en servidor y cliente sin resolver primero una zona horaria compartida.
- Que la persistencia UTC por sí sola evitaba bugs, aunque la entrada y el filtrado fueran locale-dependent.

## Fase 2: Diseño de la solución

### Modelo de datos

- `User.timezone` es opcional.
- `Organization.defaultTimezone` es requerido.
- Toda persistencia sigue en UTC.

### Resolución determinística

Prioridad final:

1. `user.timezone`
2. Zona detectada del dispositivo
3. `organization.defaultTimezone`
4. `UTC` solo como red de seguridad extrema

### Capa central

La app ahora concentra la lógica en `src/lib/dates.ts`.

Funciones clave:

- `resolveTimezonePreference(...)`
- `formatDate(...)`
- `formatCalendarDate(...)`
- `parseToUTC(...)`
- `serializeDateTimeForApi(...)`
- `toUserTimezone(...)`
- `startOfDay(...)`
- `endOfDay(...)`
- `normalizeCalendarDateParam(...)`

Objetivos de esta capa:

- No depender de la zona local del runtime.
- Ser segura para SSR.
- Resolver DST y cambios históricos usando `Intl` e IANA timezone IDs.
- Mantener la interpretación de rangos de fecha en la zona resuelta, no en UTC directo.

### UI/UX

- Usuario: configuración en `Más > Zona horaria`.
- Organización: configuración del fallback en `Organización > Fallback operativo`.
- Primer login: se detecta la zona del dispositivo desde la pantalla de acceso y se guarda en cookie.
- Sesión activa: un runtime cliente sincroniza cambios del dispositivo y muestra sugerencias.

### Backend

- APIs operativas aceptan y normalizan a UTC antes de persistir.
- Si un cliente viejo todavía manda una fecha naive, el backend la interpreta con la zona resuelta del request para no romper compatibilidad.
- Respuestas siguen serializando instantes UTC.

### Reportes, cortes y filtros

- “Hoy”, “semana”, “mes”, agenda y caja se calculan con `startOfDay/endOfDay` en la zona resuelta del usuario.
- El backend filtra por rangos UTC derivados de esa zona.
- La UI formatea los instantes con la misma zona resuelta.

## Fase 3: Edge cases críticos

### DST

- Entradas inexistentes por salto DST se rechazan en `parseToUTC(...)`.
- Horas ambiguas por retroceso DST se resuelven de forma determinística.

### Cambios históricos de timezone

- La conversión usa zonas IANA y `Intl`, no offsets hardcodeados.

### Múltiples regiones en la misma cuenta

- Cada usuario puede fijar su zona.
- Si no la fija, la app usa el dispositivo.
- Si eso falla, cae al timezone organizacional.

### Datos existentes

- El despliegue agrega `Organization.defaultTimezone` con default `UTC` para no romper datos.
- Recomendación operativa inmediata post-deploy: cada organización debe configurar su timezone real desde el panel de organización.
- Los datos históricos ya guardados en UTC no se migran; lo que cambia es la interpretación consistente en UI y filtros.

## Despliegue seguro

1. Ejecutar la migración que agrega `User.timezone` y `Organization.defaultTimezone`.
2. Configurar el fallback timezone de cada organización.
3. Validar agenda, pendientes, órdenes, propuestas, caja y tablero con usuarios en al menos dos zonas distintas.
4. Probar un caso DST real antes de habilitar cambios masivos de horario.

## Archivos clave tocados

- `prisma/schema.prisma`
- `prisma/migrations/20260328000100_timezone_support/migration.sql`
- `src/lib/dates.ts`
- `src/lib/organizations/context.ts`
- `src/features/v2/lib/filters.ts`
- `src/lib/service-orders.ts`
- `src/lib/quotes.ts`
- `src/app/api/preferences/timezone/route.ts`
- `src/app/v2/mas/page.tsx`
- `src/components/timezone/*`
