namespace Api.Models
{
    public class EquipoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string Estado { get; set; } = "Activo";
        public int? CapitanId { get; set; }
    }
}
