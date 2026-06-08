namespace Application.Commands
{
    public class CreateCanchaCommand
    {
        public string Superficie { get; set; } = string.Empty;
        public int Capacidad { get; set; }
        public string Estado { get; set; } = "Disponible";
        public string TipoCancha { get; set; } = "Futbol5"; // Futbol5, Futbol7, Futbol11
        /// <summary>Duración máxima por turno en minutos (Admin configurable).</summary>
        public int DuracionMaximaMinutos { get; set; } = 60;
        /// <summary>Precio por hora en ARS (Admin configurable).</summary>
        public decimal PrecioHora { get; set; } = 4500;
    }
}
