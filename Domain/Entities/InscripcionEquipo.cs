namespace Domain.Entities
{
    public class InscripcionEquipo
    {
        public int Id { get; set; }
        public int EquipoId { get; set; }
        public virtual Equipo Equipo { get; set; } = null!;
        public int UsuarioId { get; set; }
        public virtual Usuario Usuario { get; set; } = null!;
        public int? CobroId { get; set; }
        public virtual Cobro? Cobro { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public DateTime FechaInscripcion { get; set; } = DateTime.UtcNow;
    }
}
