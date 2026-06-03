namespace Api.Models
{
    public class CobroRequest
    {
        public int? ReservaId { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public decimal Descuento { get; set; }
        public string Estado { get; set; } = "Pendillo";
        public string MetodoPago { get; set; } = string.Empty;
    }

    public class PagoRequest
    {
        public bool Aprobado { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
        public decimal Monto { get; set; }
    }
}
