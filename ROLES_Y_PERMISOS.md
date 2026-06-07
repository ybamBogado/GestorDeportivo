# 🎭 Roles y Permisos — Sistema "Gol Ahora"

> Documento de referencia para el equipo de desarrollo.  
> Basado en el enunciado oficial del proyecto "El Buen Deporte".

---

## 📌 Contexto general

El sistema **Gol Ahora** gestiona un complejo de alquiler de canchas de fútbol. Existen **5 roles** diferenciados, cada uno con un conjunto de permisos y responsabilidades específicas dentro del sistema.

---

## 👤 Usuario (Cliente)

**Es el actor principal del sistema.** Interactúa desde el portal web de forma autónoma.

### ✅ Puede:
- Registrarse y administrar su perfil personal
- Consultar la disponibilidad de canchas en tiempo real
- **Hacer reservas de canchas** y pagar online
- Cancelar reservas (respetando el plazo mínimo de antelación)
- Inscribirse en ligas y torneos
- Anotarse en clases y entrenamientos grupales
- Ver su historial de reservas y pagos
- Descargar recibos y comprobantes de pago

### ❌ No puede:
- Gestionar otros usuarios
- Configurar precios, horarios ni canchas
- Ver información de otros clientes
- Generar reportes del sistema

---

## 🔧 Administrador

**Máximo nivel de acceso.** Controla y configura todo el sistema.

### ✅ Puede:
- CRUD completo de usuarios, canchas, reservas, cobros y recibos
- Configurar tipos de canchas, precios y duraciones máximas de reserva
- Gestionar la disponibilidad y el mantenimiento de canchas (bloqueo de horarios)
- Programar clases y entrenamientos
- Asignar profesores y entrenadores a clases
- **Verificar y validar certificaciones** de profesores y entrenadores
- Gestionar ligas y torneos (inscripciones, fixtures, resultados)
- Configurar y aplicar descuentos (por paquetes, equipos en ligas, etc.)
- Generar reportes de ingresos, asistencia y reservas
- Imprimir datos de usuarios, canchas, cobros y recibos

### ❌ No puede / No hace:
- Hacer reservas como cliente (no es su rol)
- El administrador **gestiona** el sistema; los clientes son quienes reservan

---

## 📋 Empleado

**Asistente operativo del Administrador.** Atiende el día a día del club.

### ✅ Puede:
- Registrar reservas **en nombre de usuarios presenciales** (clientes que llegan al club sin usar la app)
- Procesar pagos y generar recibos manualmente
- Consultar y modificar reservas existentes
- Gestionar la disponibilidad diaria de canchas
- Ver listados de usuarios, canchas y cobros
- Generar reportes básicos de operación

### ❌ No puede:
- Eliminar usuarios ni datos sensibles del sistema
- Configurar precios, descuentos ni parámetros del sistema
- Hacer reservas a su propio nombre como si fuera cliente
- Acceder a reportes financieros avanzados (exclusivo del Admin)

> **Diferencia clave con el Admin:** el Empleado opera dentro de los parámetros que el Administrador configuró. No puede cambiar reglas del sistema, solo ejecutarlas.

---

## 🏫 Profesor

**Recurso del sistema.** El sistema lo gestiona, no al revés.

### ✅ Puede:
- Ver su propia agenda de clases asignadas
- Registrar y modificar la asistencia de sus alumnos
- Consultar el listado de alumnos inscriptos en sus clases
- Ver su perfil y datos personales

### ❌ No puede:
- Hacer reservas de canchas (las canchas se le asignan cuando el Admin/Empleado programa la clase)
- Programar sus propias clases (las programa el Admin o Empleado)
- Ver datos de otros usuarios o profesores
- Acceder al panel administrativo

### ⚠️ Requisito obligatorio:
> Todos los profesores registrados **deben poseer certificación deportiva vigente**, la cual debe ser verificada y cargada en el sistema. Sin certificación válida, no puede ser asignado a clases.

---

## 🏃 Entrenador

**Similar al Profesor, pero orientado a equipos y competencias.** El sistema lo gestiona como recurso.

### ✅ Puede:
- Ver su propia agenda de entrenamientos asignados
- Registrar la asistencia de los jugadores de su equipo
- Consultar el fixture y los resultados de las ligas/torneos en los que participa su equipo
- Ver su perfil y datos personales

### ❌ No puede:
- Hacer reservas de canchas (las sesiones se le asignan)
- Programar sus propios entrenamientos
- Acceder al panel administrativo

### ⚠️ Requisito obligatorio:
> Al igual que los profesores, los entrenadores **deben poseer certificación deportiva vigente** registrada y verificada en el sistema.

---

## 📊 Tabla resumen de permisos

| Acción                          | Usuario | Empleado     | Profesor | Entrenador | Admin |
|---------------------------------|:-------:|:------------:|:--------:|:----------:|:-----:|
| Hacer reservas propias          | ✅      | ⚠️ por cliente | ❌       | ❌         | ❌    |
| Ver disponibilidad de canchas   | ✅      | ✅           | ✅       | ✅         | ✅    |
| Ver historial propio            | ✅      | ✅           | ✅       | ✅         | ✅    |
| Gestionar usuarios (CRUD)       | ❌      | ⚠️ limitado  | ❌       | ❌         | ✅    |
| Programar clases                | ❌      | ✅           | ❌       | ❌         | ✅    |
| Registrar asistencia a clases   | ❌      | ❌           | ✅       | ✅         | ✅    |
| Procesar pagos / generar recibos| ❌      | ✅           | ❌       | ❌         | ✅    |
| Configurar canchas y precios    | ❌      | ❌           | ❌       | ❌         | ✅    |
| Aplicar descuentos              | ❌      | ❌           | ❌       | ❌         | ✅    |
| Gestionar ligas y torneos       | ❌      | ⚠️ básico    | ❌       | ❌         | ✅    |
| Ver fixture y resultados        | ✅      | ✅           | ❌       | ✅         | ✅    |
| Generar reportes                | ❌      | ⚠️ básicos   | ❌       | ❌         | ✅    |
| Validar certificaciones         | ❌      | ❌           | ❌       | ❌         | ✅    |
| Bloquear canchas (mantenimiento)| ❌      | ✅           | ❌       | ❌         | ✅    |

> **Referencias:** ✅ Permitido · ❌ No permitido · ⚠️ Permitido con restricciones

---

## 🔐 Flujo de acceso al sistema

```
Inicio de sesión
      │
      ├─▶ Rol: Usuario      ──▶ Portal de Cliente (reservas, pagos, clases, torneos)
      │
      ├─▶ Rol: Empleado     ──▶ Panel Operativo (gestión diaria, pagos, asistencia)
      │
      ├─▶ Rol: Profesor     ──▶ Vista de Agenda (mis clases, asistencia de alumnos)
      │
      ├─▶ Rol: Entrenador   ──▶ Vista de Equipo (mis entrenamientos, fixture, asistencia)
      │
      └─▶ Rol: Admin        ──▶ Panel Completo (configuración total del sistema)
```

---

## 📌 Reglas de negocio clave

1. **Las reservas solo las hacen los Usuarios** (o el Empleado en su nombre si son presenciales).
2. **Las canchas se asignan** a profesores/entrenadores cuando el Admin/Empleado programa una clase o entrenamiento. No la reservan ellos.
3. **Sin certificación verificada**, un Profesor o Entrenador **no puede ser asignado** a clases/entrenamientos.
4. **Sin pago completo**, una reserva no puede ser confirmada por el sistema.
5. **Las cancelaciones** deben hacerse con la antelación mínima configurada; de lo contrario se aplica un cargo.
6. Las reservas tienen un **límite máximo de anticipación** (ej: 30 días).
7. Los **descuentos** solo pueden ser configurados por personal autorizado (Admin/Empleado con permiso).

---

*Generado para el proyecto "Gol Ahora" — El Buen Deporte*  
*Ingeniería de Software — 2026*
