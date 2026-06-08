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

        // "Pendiente" hasta que se pague, luego "Confirmado"
        public string Estado { get; set; } = "Pendiente";

        // Cobro generado al inscribirse (para el flujo de pago)
        public int? CobroId { get; set; }
        public virtual Cobro? Cobro { get; set; }
    }
}
