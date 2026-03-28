# Rediseño `/organization-admin/captura`

## Objetivo

Convertir el módulo actual de configuración de captura en una experiencia guiada, clara y moderna que se sienta como:

`"Deja lista tu forma de vender en unos minutos"`

y no como:

`"Llena un wizard administrativo"`

---

## Diagnóstico del estado actual

### Lo que ya está bien

- El flujo ya está reducido a 4 pasos.
- Cambiar de giro aplica presets útiles.
- El usuario puede cambiar de paso sin perder el estado local.
- El guardado no depende de completar todos los campos opcionales.

### Lo que hoy genera fricción

1. La navegación se siente separada del contenido.
   - El header, stepper, tarjeta del paso y footer sticky viven como piezas independientes.
   - El usuario entiende que está "en un wizard", pero no siempre entiende "qué está terminando de dejar listo".

2. El patrón actual funciona mejor como checklist técnico que como asistente guiado.
   - El stepper horizontal ocupa mucho peso visual.
   - En desktop compite con el contenido.
   - En mobile el progreso sticky y el footer sticky pueden sentirse como dos capas fijas más el header.

3. El paso de catálogo concentra demasiada edición en una sola pantalla.
   - Categorías, opciones, extras y tipos de cobro viven en la misma lógica mental.
   - Esto sube la carga cognitiva.

4. El estado está demasiado acoplado al componente principal.
   - `QuoteConfigWizardV2` concentra navegación, carga, guardado, subida de logo, mutaciones de catálogo y render de pasos.
   - Escala mal para futuras variantes o validaciones más ricas.

5. No existe una noción visible de "borrador guardado".
   - Hoy el usuario puede avanzar sin perder el estado local, pero la experiencia no comunica claramente autosave, cambios pendientes o guardado exitoso por sección.

---

## Propuesta de UX

## Nuevo modelo mental

No tratarlo como un wizard tradicional.

Tratarlo como una:

`Configuración guiada con mapa persistente`

La experiencia debe comunicar:

- Ya sé en qué parte estoy.
- Puedo ir a otra parte sin miedo.
- Sé qué ya quedó listo.
- Sé qué sigue pendiente.
- Puedo salir y volver después.

---

## Patrón de navegación recomendado

### Recomendación

Usar **sidebar persistente en desktop** y **resumen compacto de progreso en mobile**.

### Por qué no dejar solo un stepper horizontal

- El contenido de cada paso es largo y denso.
- El stepper horizontal funciona mejor cuando los pasos son cortos y lineales.
- Aquí el usuario necesita volver a revisar secciones específicas, no solo avanzar una por una.
- Cuando el paso crece, el stepper termina siendo decorativo y no realmente útil.

### Patrón final recomendado

#### Desktop

- Sidebar izquierda persistente con:
  - nombre de la organización
  - progreso general
  - lista de secciones
  - estado por sección: `Vacío`, `En progreso`, `Listo`
  - CTA secundaria: `Vista previa de captura`
  - CTA terciaria: `Guardar y salir`

- Área principal derecha estable con:
  - título de la sección actual
  - explicación corta
  - contenido de edición
  - barra inferior de acciones no intrusiva

#### Mobile

- Header compacto con:
  - nombre corto del flujo
  - progreso total
  - acceso a "ver secciones"

- Botón `Secciones` abre bottom sheet con mapa del flujo.
- Acciones primarias pegadas abajo, pero dentro de una sola barra compacta.

### Beneficio UX

- El usuario nunca pierde contexto.
- Puede navegar libremente sin sentir "castigo" por salir de un paso.
- El layout se siente más parecido a una configuración moderna de producto que a un formulario largo.

---

## Flujo rediseñado

## Estructura propuesta

### Sección 1. Giro del negocio

Objetivo:
- Elegir el punto de partida correcto.

Contenido:
- tarjetas visuales grandes por giro
- preview corto de lo que se va a precargar
- opción `Otro negocio`

Resultado visible:
- preset base aplicado
- template sugerido
- modo de trabajo sugerido

### Sección 2. Lo que ofreces

Objetivo:
- Ajustar la base mínima del catálogo.

Contenido:
- bloque `Servicios principales`
- bloque `Extras rápidos`
- edición en tarjetas compactas
- CTA rápidos:
  - `Agregar servicio`
  - `Agregar categoría`
  - `Agregar extra`
  - `Restaurar recomendados`

Decisión UX:
- separar visualmente servicios y extras
- no mezclar todo en un mismo bloque largo

### Sección 3. Cómo atiendes

Objetivo:
- Definir el comportamiento principal de captura.

Contenido:
- selección visual entre:
  - `Cobro al momento`
  - `Solo con cita`
  - `Ambos`
- preview del launcher de `/capturar`

Resultado:
- el usuario entiende qué verá su equipo en operación

### Sección 4. Identidad básica

Objetivo:
- Cargar datos mínimos del negocio sin presión.

Contenido:
- nombre
- teléfono
- dirección
- logo

Importante:
- todos opcionales salvo nombre si realmente hace falta
- mostrar estado `Opcional` con claridad

### Sección 5. Estilo y activación

Objetivo:
- Elegir look and feel y confirmar que todo quedó listo.

Contenido:
- selector de estilos
- preview visual simple
- checklist final:
  - giro elegido
  - catálogo base listo
  - modo de trabajo definido
  - datos opcionales cargados o omitidos

CTA principal:
- `Dejar listo`

CTA secundaria:
- `Guardar borrador`

---

## Wireframes

## Desktop

```text
+---------------------------------------------------------------+
| Configura tu captura                           [Org selector] |
| Deja lista la forma de vender, agendar o cotizar              |
+--------------------------+------------------------------------+
| PROGRESO                 | Giro del negocio                   |
| 72% completo             | ¿Qué tipo de negocio tienes?       |
|                          | Texto corto de ayuda               |
| [✓] Giro                 |                                    |
| [~] Lo que ofreces       | [ Dentista ] [ Barbería ]          |
| [ ] Cómo atiendes        | [ Uñas     ] [ Taller   ]          |
| [ ] Identidad básica     | [ Comida   ] [ Otro     ]          |
| [ ] Estilo y activación  |                                    |
|                          | Preview de lo que se cargará       |
| [Vista previa]           |                                    |
| [Guardar y salir]        |                                    |
+--------------------------+------------------------------------+
| Ayuda breve                                       [Siguiente] |
+---------------------------------------------------------------+
```

## Mobile

```text
+----------------------------------------+
| Configurar captura        Paso 2 de 5  |
| 40% listo                             |
+----------------------------------------+
| Lo que ofreces                         |
| Ya cargamos una base. Ajusta solo      |
| lo que sí necesites hoy.               |
|                                        |
| [Servicios principales]                |
| Corte clásico     $250    [Editar]     |
| Barba             $150    [Editar]     |
| [+ Agregar servicio]                   |
|                                        |
| [Extras rápidos]                       |
| Urgencia          $100    [Editar]     |
| [+ Agregar extra]                      |
+----------------------------------------+
| [Secciones]             [Guardar]      |
|                     [Siguiente]         |
+----------------------------------------+
```

## Bottom sheet de navegación mobile

```text
+----------------------------------------+
| Secciones                              |
| ✓ Giro                                 |
| ~ Lo que ofreces                       |
| • Cómo atiendes                        |
| • Identidad básica                     |
| • Estilo y activación                  |
|                                        |
| [Cerrar]                               |
+----------------------------------------+
```

---

## Comportamientos UX clave

### 1. Autosave visible

- Guardar automáticamente cambios por sección con debounce.
- Mostrar estado persistente:
  - `Guardado`
  - `Guardando...`
  - `Tienes cambios sin guardar`

### 2. Validación contextual

- No bloquear por campos opcionales.
- Validar solo lo mínimo necesario para activar el sistema.
- Los errores deben aparecer cerca del campo y con lenguaje humano.

### 3. Layout estable

- El sidebar o mapa de pasos no debe moverse.
- La altura del footer no debe tapar contenido.
- Evitar dos o tres elementos sticky compitiendo entre sí.

### 4. Feedback inmediato

- Cambiar giro debe mostrar confirmación:
  - `Cargamos una base para barbería`
- Guardar borrador:
  - `Tus cambios quedaron guardados`
- Subir logo:
  - preview inmediato + progreso simple

### 5. Reanudación

- Si el usuario sale y vuelve, debe entrar exactamente donde se quedó o en la última sección incompleta.

---

## Arquitectura técnica recomendada

## Separación por capas

### 1. Orquestación

`CaptureSetupExperience`

Responsable de:
- cargar organización
- restaurar draft
- guardar
- resolver navegación
- exponer estado global

### 2. Estado del flujo

Usar un reducer o state machine para separar:

- `draft`
- `persisted`
- `dirty`
- `saving`
- `activeSection`
- `validation`

### 3. Secciones desacopladas

Cada sección debe vivir como componente independiente:

- `BusinessTypeSection`
- `CatalogSection`
- `WorkModeSection`
- `BusinessIdentitySection`
- `ActivationSection`

### 4. Shell compartido

`CaptureSetupShell`

Responsable de:
- header
- sidebar / section map
- footer actions
- layout responsive

### 5. Servicios

- `quoteConfigService`
  - fetch config
  - save config
  - load org config
- `draftPersistenceService`
  - local draft
  - restore draft
  - clear draft

---

## Patrón de estado recomendado

### Opción recomendada

Reducer + autosave side effects

Por qué:
- suficiente para la complejidad actual
- fácil de probar
- menos sobrecarga que una state machine completa

### Opción ideal si crecerá pronto

State machine con estados explícitos:

- `idle`
- `loading`
- `editing`
- `saving`
- `error`
- `saved`

Eventos:
- `LOAD_CONFIG`
- `CHANGE_SECTION`
- `UPDATE_FIELD`
- `APPLY_PRESET`
- `SAVE_DRAFT`
- `SAVE_SUCCESS`
- `SAVE_ERROR`

Esto ayuda mucho si después habrá:
- colaboración
- drafts remotos
- versiones
- validación por reglas complejas

---

## Componentes recomendados

- `SectionStatusRail`
- `SectionProgressCard`
- `SectionContainer`
- `InlineSaveIndicator`
- `CatalogCategoryCard`
- `ServiceRowEditor`
- `ExtraRowEditor`
- `WorkModePreview`
- `ThemePreviewGallery`
- `ActivationChecklist`
- `UnsavedChangesDialog`
- `MobileSectionSheet`

---

## Principios visuales

- Una sola superficie principal por sección.
- Máximo una acción primaria visible por momento.
- Acciones destructivas siempre separadas visualmente.
- Menos bloques grandes apilados.
- Más tarjetas semánticas pequeñas y agrupadas.
- Textos de ayuda cortos y accionables.

---

## Recomendación de implementación

### Fase 1

- Crear shell nueva con sidebar persistente + mobile section sheet.
- Migrar navegación y progreso.
- Mantener lógica actual de config.

### Fase 2

- Separar estado del wizard en reducer.
- Introducir autosave visible y draft persistence.

### Fase 3

- Rehacer sección de catálogo en componentes desacoplados.
- Añadir preview real de captura y activación final.

---

## Decisión final de UX

La mejor solución no es un stepper clásico.

La mejor solución para este módulo es una **experiencia guiada con mapa persistente**, porque:

- el contenido es demasiado rico para un stepper lineal puro
- el usuario necesita libertad para volver y revisar
- la interfaz debe sentirse estable, no como una secuencia de pantallas
- el usuario debe entender progreso y control al mismo tiempo

Ese patrón mantiene la claridad del wizard, pero elimina la sensación de formulario largo y frágil.
