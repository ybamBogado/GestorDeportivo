namespace Application.DTOs
{
    public class ReservaDto
    {
        public int Id { get; set; }
        public int CanchaId { get; set; }
        public string Cancha { get; set; } = string.Empty;
        public int PersonaId { get; set; }
        public string Cliente { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string HoraInicio { get; set; } = string.Empty;
        public string HoraFin { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public bool Pago { get; set; }
        public string? MetodoPago { get; set; }
        public DateTime? FechaExpiracion { get; set; }
        public string? CodigoPagoExterno { get; set; }
        public string? ComprobantePdf { get; set; }
    }
}
