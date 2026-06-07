namespace Application.Commands
{
    public class CreateReservaCommand
    {
        public int CanchaId { get; set; }
        public int PersonaId { get; set; }
        public DateTime Fecha { get; set; }
        public string HoraInicio { get; set; } = string.Empty;
        public string HoraFin { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public bool Pago { get; set; }
        /// <summary>tarjeta | transferencia | efectivo</summary>
        public string? MetodoPago { get; set; }
    }
}
