namespace Domain.Entities
{
    public class Recibo
    {
        public int Id { get; set; }
        public int CobroId { get; set; }
        public virtual Cobro Cobro { get; set; } = null!;
        public string Numero { get; set; } = string.Empty;
        public DateTime FechaEmision { get; set; } = DateTime.UtcNow;
        public string Datos { get; set; } = string.Empty;
    }
}
