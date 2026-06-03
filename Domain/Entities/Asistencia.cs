namespace Domain.Entities
{
    public class Asistencia
    {
        public int Id { get; set; }
        public int ClaseId { get; set; }
        public virtual Clase Clase { get; set; } = null!;
        public int UsuarioId { get; set; }
        public virtual Usuario Usuario { get; set; } = null!;
        public bool Presente { get; set; }
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    }
}
