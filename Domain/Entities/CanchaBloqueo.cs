namespace Domain.Entities
{
    public enum TipoBloqueo
    {
        Reserva,
        Clase,
        Entrenamiento,
        Partido,
        Mantenimiento
    }

    public class CanchaBloqueo
    {
        public int Id { get; set; }
        public int CanchaId { get; set; }
        public virtual Cancha Cancha { get; set; } = null!;
        public DateTime FechaHoraInicio { get; set; }
        public DateTime FechaHoraFin { get; set; }
        public string Motivo { get; set; } = "Mantenimiento";
        public string Estado { get; set; } = "Activo";
        public TipoBloqueo Tipo { get; set; } = TipoBloqueo.Mantenimiento;

        // Referencias opcionales para saber qué generó el bloqueo
        public int? PartidoId { get; set; }
        public int? ClaseId { get; set; }
        public int? EntrenamientoId { get; set; }
    }
}
