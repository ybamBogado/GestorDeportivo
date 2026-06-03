using System.Collections.Generic;

namespace Domain.Entities
{
    public class Cobro
    {
        public int Id { get; set; }
        public int? ReservaId { get; set; }
        public virtual Reserva? Reserva { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public decimal Descuento { get; set; }
        public decimal MontoFinal { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
        public string MetodoPago { get; set; } = string.Empty;
        public virtual ICollection<Recibo> Recibos { get; set; } = new List<Recibo>();
    }
}
