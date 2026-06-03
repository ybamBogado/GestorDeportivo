namespace Domain.Entities
{
    public class InscripcionTorneo
    {
        public int Id { get; set; }
        public int TorneoId { get; set; }
        public virtual Torneo Torneo { get; set; } = null!;
        public int EquipoId { get; set; }
        public virtual Equipo Equipo { get; set; } = null!;
        public DateTime FechaInscripcion { get; set; } = DateTime.UtcNow;
        public string Estado { get; set; } = "Activa";
    }
}
