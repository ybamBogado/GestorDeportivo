namespace Domain.Entities
{
    public class Descuento
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string TipoServicio { get; set; } = string.Empty;
        public decimal Porcentaje { get; set; }
        public bool Activo { get; set; } = true;
    }
}
