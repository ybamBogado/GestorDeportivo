# Mejora de los Módulos de Reservas y Cobros

Basado en el enunciado oficial de "Gol Ahora", he analizado el sistema actual y propongo las siguientes implementaciones para cumplir profesionalmente con todos los requisitos de negocio relacionados con **Reservas**, **Cobros** y **Cancelaciones**.

## User Review Required
> [!IMPORTANT]
> Revisa este plan para confirmar si la política de reembolso sugerida (porcentaje retenido vs. reembolso total) se alinea con la visión del club, y si los tiempos de antelación sugeridos son correctos.



## Proposed Changes

### 1. Validación de Reservas y Reglas de Negocio en el Backend
Actualmente el sistema crea las reservas pero carece de validaciones de negocio estrictas.

#### `[MODIFY]` `ReservaService` (o Controlador correspondiente)
- **Regla de Antelación Máxima:** Agregar validación para rechazar reservas donde `Fecha > DateTime.Now.AddDays(30)`.
- **Regla de Duración Máxima Dinámica:** Validar que `(HoraFin - HoraInicio).TotalHours` no exceda el límite permitido (`DuracionMaxima`) configurado para ese tipo de cancha en la base de datos.
- **Regla de Solapamiento:** Mejorar la validación para asegurar que no se superponga con *Canchas Bloqueadas por Mantenimiento* ni con otras reservas aprobadas.

#### `[NEW]` Configuración de Canchas (Admin vs Empleado)
Para evitar que las duraciones (1h, 1.5h) estén "harcodeadas" (escritas fijas en el código), se implementará una separación estricta de responsabilidades (RBAC):

- **Rol Administrador (Gestión Estructural):** Es el "Dueño" del club. Tendrá acceso total para **Crear, Editar y Eliminar** los Tipos de Cancha. En su formulario, podrá configurar libremente la `DuracionMaxima` (ej. 60 min, 90 min) y los precios de cada tipo. *Ejemplo práctico:* Entra una vez al mes a cambiar los precios por inflación o a registrar que se construyó una nueva "Cancha Techada" que dura 90 minutos.
- **Rol Empleado (Gestión Operativa Diaria):** Es el "Recepcionista" que atiende al público. Tendrá un panel enfocado en el día a día. **No podrá borrar ni crear tipos de cancha ni alterar precios o duraciones**. Su módulo de "Gestión de Canchas" le permitirá exclusivamente:
  1. **Visualizar la Grilla:** Ver qué canchas están libres, ocupadas o reservadas en tiempo real.
  2. **Bloquear horarios por mantenimiento:** *Ejemplo práctico:* Se rompe la red de la Cancha 2. El empleado entra y la bloquea de 18:00 a 20:00 con el motivo "Mantenimiento". Esto oculta ese horario en la web para que nadie lo reserve.
  3. **Gestión Manual:** Crear reservas manualmente para clientes que llaman por teléfono o llegan al mostrador, y cobrarles en efectivo.

---

### 2. Máquina de Estados: Reserva ↔ Cobro y Concurrencia
El enunciado dicta: *"Para que una reserva de cancha sea confirmada, el pago completo de la misma debe ser registrado y validado por el sistema. No se confirmarán reservas pendientes de pago."*

**Gestión de Concurrencia (Soft-Lock):** ¿Qué pasa si el Usuario A y el Usuario B quieren reservar la misma cancha al mismo tiempo?
- Cuando el Usuario A selecciona el horario y avanza a la pantalla de pago, el sistema crea la Reserva en estado **"Pendiente"** y le otorga un "bloqueo temporal" (ej. 10 a 15 minutos).
- Mientras el Usuario A esté en su ventana de pago, si el Usuario B entra, verá ese horario como **"Ocupado"**.
- Si el Usuario A paga a tiempo, la reserva pasa a **"Confirmada"**.
- Si el tiempo expira sin pago, el sistema pasa la reserva automáticamente a **"Expirada/Cancelada"**, liberando la cancha inmediatamente para que el Usuario B pueda reservarla.

#### `[MODIFY]` `CobroService` / `CobroController`
- Modificar el endpoint de pago para que verifique que el tiempo de pago no haya expirado. Si todo es correcto, **cambia automáticamente el `Estado` de la Reserva de "Pendiente" a "Confirmada"**.
- Implementar un proceso en segundo plano (o validación en tiempo de consulta) que cancele las reservas "Pendientes" que superen los 15 minutos de antigüedad.

---

### 3. Sistema de Cancelaciones y Reembolsos (Basado en Recibos)
Repasando el enunciado, este especifica: *"Si la cancelación se realiza dentro del plazo de antelación, se procesará un reembolso total o parcial según la política de reembolsos del club... El sistema debe permitir registrar, modificar, consultar, eliminar e imprimir los recibos de pago."*

Para apegarnos estrictamente a los requerimientos del proyecto, descartaremos la "Billetera Virtual" y utilizaremos una lógica basada en el modelo de **Cobros y Recibos**.

#### `[NEW]` Lógica de Cancelación en `ReservaService` y `CobroService`
- **Flujo de cancelación de usuario:**
  1. El sistema calcula el tiempo restante: `HorasRestantes = Reserva.FechaHoraInicio - DateTime.Now`.
  2. **Si `HorasRestantes >= 6` (Cancelación a tiempo):** La reserva pasa a estado "Cancelada". El `Cobro` original se marca para revisión, y el sistema permite al Empleado/Administrador generar un **Recibo de Reembolso** (devolución) por el 100% del dinero pagado.
  3. **Si `HorasRestantes < 6` (Cancelación tardía):** La reserva pasa a estado "Cancelada". Se aplica un cargo (ej. 50%). El sistema generará un **Recibo de Reembolso** solo por el porcentaje correspondiente (según defina el club), y el resto queda registrado como penalidad.
  4. En ambos casos, la cancha queda "Libre" inmediatamente en la grilla para que otro usuario la reserve.
  5. Esta solución garantiza que todas las devoluciones queden registradas como "Recibos" en el sistema, cumpliendo la regla de *imprimir, consultar y auditar cobros y recibos*.

---

### 4. Gestión Avanzada de Descuentos
El enunciado original dice textualmente:
> *"El club ofrece descuentos a determinados grupos o situaciones específicas (ej. descuentos por alquiler de paquete de horas, descuentos a equipos que participan en ligas regulares, descuentos para socios de escuelas de fútbol afiliadas). La aplicación de estos descuentos debe ser configurada y gestionada por el personal autorizado del club en el sistema."*

**Nuestra propuesta de implementación (Separación Estricta de Roles):**
- **Administrador (Gestión y Configuración):** Es el **único** rol que tendrá un panel para Crear, Editar o Eliminar descuentos. Él define las reglas del juego (ej. nombre: "Afiliados", porcentaje: 15%, activo: Sí/No).
- **Empleado (Uso Operativo):** El empleado **no puede** crear descuentos nuevos ni alterar los porcentajes. En su panel de cobros (cuando atiende presencialmente), solo verá un menú desplegable con la lista de descuentos "Activos" creados por el Administrador. Solo puede seleccionarlos y aplicarlos a la cuenta del cliente.
- **Usuario:** Si el descuento es automático (ej. por sistema para un equipo de liga) o requiere un código promocional, el usuario lo verá reflejado en su pago web.

#### `[MODIFY]` `Descuento.cs` y `CobroService`
- Extender el modelo `Descuento` con: `Nombre`, `Porcentaje`, `CodigoPromocional`, `Activo`, `Condicion`.
- Actualizar `CobroService` para recalcular `MontoFinal` cuando se vincula un `DescuentoId` válido.

---

### 5. Métodos de Pago y Cumplimiento del Enunciado
La imagen de la UI muestra tres métodos de pago: *Tarjeta, Transferencia y Efectivo*. El enunciado es estricto: **"Para que una reserva de cancha sea confirmada, el pago completo de la misma debe ser registrado y validado por el sistema. No se confirmarán reservas pendientes de pago."** 

Para resolver esto a nivel arquitectónico y profesional:

1. **Tarjeta de Crédito/Débito (Pago Electrónico - Mock/Simulado):**
   - **Flujo:** El usuario ingresa los datos de su tarjeta en la web.
   - **Simulación Académica:** El sistema hará una pausa simulada de 2 segundos (Mock) para imitar la conexión con una pasarela real (ej. Visa/Mastercard) y devolverá un "Pago Exitoso". No se utilizarán APIs de pago reales (Stripe/MercadoPago) para evitar complejidades innecesarias en el entorno académico, demostrando en su lugar la *arquitectura* de la integración.
   - **Resultado:** El pago se valida instantáneamente. Se genera el `Recibo` y la `Reserva` pasa automáticamente a **"Confirmada"**.

2. **Transferencia Bancaria:**
   - **Flujo:** El usuario ve el CBU/Alias del club, realiza la transferencia y hace clic en "Ya transferí" (idealmente adjuntando comprobante).
   - **Resultado:** La reserva **NO** se confirma aún (queda en estado `"Pendiente de Verificación"`). El Administrador o Empleado debe entrar a su panel, ver el comprobante, confirmar que el dinero llegó al banco y darle a "Validar Pago". Solo en ese momento se emite el `Recibo` y la reserva pasa a **"Confirmada"**. (Nota: El bloqueo de concurrencia para transferencias se extiende, ej. 2 horas, para dar tiempo al empleado de revisar).

3. **Efectivo en Mostrador:**
3. **Efectivo en Mostrador (Integración con Redes de Cobranza - Mock/Simulado):**
   - **Opción Elegida:** Para permitir el pago en efectivo de forma online sin violar la regla de "No se confirmarán reservas pendientes", se simulará una integración con pasarelas como Rapipago, PagoFácil u Oxxo mediante un sistema de "Mocking".
   - **Flujo de Usuario:**
     1. El usuario elige "Efectivo" en la web.
     2. El sistema genera un "Código de Pago" aleatorio (ej. `RP-59281`) y se lo muestra al usuario indicando que tiene un plazo para ir a abonar.
     3. La reserva queda en estado `"Pendiente de Pago"` y se bloquea el horario temporalmente (ej. por 12 horas).
   - **Simulación Académica (El "Truco" para la Demo):**
     1. Se agregará una herramienta en el Panel del Administrador (o un modo desarrollador) llamada *"Simular Cobro Externo"*.
     2. Durante la presentación, se ingresa el código `RP-59281` en esta herramienta para simular que Rapipago envió el Webhook de confirmación de pago.
     3. Al recibir esta señal simulada, el backend emite el `Recibo` y pasa la Reserva automáticamente a **"Confirmada"**.
   - **Expiración:** Si se vence el tiempo asignado y no se simuló el pago, el sistema cancela la reserva automáticamente.

---

### 5. Interfaz de Usuario (Frontend) y Lógica de Horarios

Basado en la imagen de la interfaz actual, el sistema asume bloques fijos de 1 hora (18:00, 19:00, etc.). Esto entra en conflicto con la regla de duración según tipo de cancha (Fútbol 5, 7, 11).

#### `[MODIFY]` Formularios de Reserva (`SelectCancha.jsx` / `UserPortal.jsx`)
- **Generación Dinámica de Horarios (Opción A):** Para evitar huecos en la agenda del club, el frontend generará "Bloques Fijos Dinámicos" basados en la duración configurada para cada cancha. 
  - Si el usuario selecciona Fútbol 5 (1h), verá slots: `18:00, 19:00, 20:00`.
  - Si selecciona Fútbol 7 (1.5h), verá slots optimizados: `18:00, 19:30, 21:00`.
  - El backend enviará la duración máxima y la UI calculará los bloques correspondientes para ese día.
- **Visualización de Disponibilidad (UI States):** Al seleccionar el día, se consultarán las reservas y bloqueos para esa cancha. Los botones de horarios (slots) tendrán 3 estados visuales claros:
  1. **Libre:** Botón normal (con hover verde), clicable.
  2. **Seleccionado:** Botón con fondo verde brillante (como está ahora en tu diseño).
  3. **Ocupado / Reservado:** Botón atenuado (opacidad al 50%), cursor bloqueado (`cursor: not-allowed`), y texto "18:00 (Ocupado)". No se podrá hacer clic.
- **Límite de 30 días:** Restringir el calendario (Datepicker) para que no permita seleccionar fechas más allá de `Hoy + 30 días`.
- Mostrar una advertencia en la pantalla de pago: *"La reserva no se confirmará hasta completar el pago"*.

#### `[MODIFY]` Panel del Administrador (`AdminPanel.jsx`)
- Mejorar el panel de "Pagos y Recibos" para que el Administrador pueda procesar reembolsos.
- Mostrar indicadores claros de "Bloqueo por mantenimiento" en la grilla de canchas.

---

## Verification Plan
### Automated Tests / Manual Verification
- Intentar reservar a más de 30 días (debe fallar).
- Intentar reservar Fútbol 5 por 3 horas (debe fallar).
- Crear una reserva, verificar que está "Pendiente". Registrar el cobro correspondiente, verificar que la reserva cambió automáticamente a "Confirmada".
- Cancelar una reserva faltando 2 horas para el partido, verificar que se aplica la retención financiera.
- Cancelar faltando 2 días, verificar que se aprueba el reembolso total.
