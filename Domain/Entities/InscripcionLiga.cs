namespace Domain.Entities
{
    public class InscripcionLiga
    {
        public int Id { get; set; }
        public int LigaId { get; set; }
        public virtual Liga Liga { get; set; } = null!;
        public int EquipoId { get; set; }
        public virtual Equipo Equipo { get; set; } = null!;
        public DateTime FechaInscripcion { get; set; } = DateTime.UtcNow;
        public string Estado { get; set; } = "Activa";
    }
}
