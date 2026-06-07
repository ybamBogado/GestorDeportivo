namespace Application.DTOs
{
    public class CanchaCatalogDto
    {
        public int Id { get; set; }
        public string Superficie { get; set; } = string.Empty;
        public int Capacidad { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string TipoCancha { get; set; } = string.Empty;
        /// <summary>Duración máxima por turno en minutos (configurable por el Administrador).</summary>
        public int DuracionMaximaMinutos { get; set; } = 60;
        /// <summary>Precio por hora en ARS (configurable por el Administrador).</summary>
        public decimal PrecioHora { get; set; } = 4500;
    }
}
