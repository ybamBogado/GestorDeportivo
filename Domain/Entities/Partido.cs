namespace Domain.Entities
{
    public class Partido
    {
        public int Id { get; set; }
        public int? LigaId { get; set; }
        public virtual Liga? Liga { get; set; }
        public int? TorneoId { get; set; }
        public virtual Torneo? Torneo { get; set; }
        public int EquipoLocalId { get; set; }
        public virtual Equipo EquipoLocal { get; set; } = null!;
        public int EquipoVisitanteId { get; set; }
        public virtual Equipo EquipoVisitante { get; set; } = null!;
        public DateTime FechaHora { get; set; }
        public int? GolesLocal { get; set; }
        public int? GolesVisitante { get; set; }
        public string Estado { get; set; } = "Programado";
        public string Resultado => GolesLocal.HasValue && GolesVisitante.HasValue
            ? $"{GolesLocal}-{GolesVisitante}"
            : "Pendiente";
    }
}
