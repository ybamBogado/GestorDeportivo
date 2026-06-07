using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    /// <summary>
    /// Estados válidos: Pendiente, Confirmada, Cancelada, Expirada, PendienteVerificacion
    /// - Pendiente: creada, aguardando pago (soft-lock activo hasta FechaExpiracion)
    /// - PendienteVerificacion: pago por transferencia/efectivo notificado, aguarda validación de empleado
    /// - Confirmada: pago validado
    /// - Cancelada: cancelada por usuario o administrador
    /// - Expirada: soft-lock venció sin pago
    /// </summary>
    public class Reserva
    {
        public int Id { get; set; }

        public DateTime Fecha { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public decimal Precio { get; set; }

        /// <summary>Pendiente | PendienteVerificacion | Confirmada | Cancelada | Expirada</summary>
        public string Estado { get; set; } = "Pendiente";

        /// <summary>Método de pago elegido: Tarjeta, Transferencia, Efectivo</summary>
        public string MetodoPago { get; set; } = string.Empty;

        /// <summary>Código generado para pago en red de cobranza (ej. Rapipago). Ej: RP-59281</summary>
        public string? CodigoPagoExterno { get; set; }

        /// <summary>Ruta al comprobante de pago por transferencia bancaria (ej. PDF o Imagen)</summary>
        public string? ComprobantePdf { get; set; }

        /// <summary>
        /// Soft-lock: fecha/hora límite para confirmar el pago.
        /// Tarjeta: +15 min. Transferencia: +2 horas. Efectivo/Rapipago: +12 horas.
        /// Si DateTime.UtcNow > FechaExpiracion y Estado == "Pendiente" → pasar a Expirada.
        /// </summary>
        public DateTime FechaExpiracion { get; set; }

        public bool Pago { get; set; }

        public int? ComplejoId { get; set; }
        public virtual Complejo? Complejo { get; set; }
        public virtual Cobro? Cobro { get; set; }

        // Relaciones con Cancha
        public int CanchaId { get; set; }
        public virtual Cancha Cancha { get; set; } = null!;

        // Relación con Persona (cliente que reserva)
        public int PersonaId { get; set; }
        public virtual Persona Persona { get; set; } = null!;

        /// <summary>Fecha y hora de inicio combinadas para facilitar comparaciones de disponibilidad.</summary>
        public DateTime FechaHoraInicio => Fecha.Date + HoraInicio;

        /// <summary>Fecha y hora de fin combinadas.</summary>
        public DateTime FechaHoraFin => Fecha.Date + HoraFin;
    }
}
