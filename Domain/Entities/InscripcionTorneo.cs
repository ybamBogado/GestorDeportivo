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

        // "Pendiente" hasta que se pague, luego "Confirmado"
        public string Estado { get; set; } = "Pendiente";

        // Cobro generado al inscribirse (para el flujo de pago)
        public int? CobroId { get; set; }
        public virtual Cobro? Cobro { get; set; }
    }
}
