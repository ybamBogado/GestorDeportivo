namespace Domain.Entities
{
    public class CanchaBloqueo
    {
        public int Id { get; set; }
        public int CanchaId { get; set; }
        public virtual Cancha Cancha { get; set; } = null!;
        public DateTime FechaHoraInicio { get; set; }
        public DateTime FechaHoraFin { get; set; }
        public string Motivo { get; set; } = "Mantenimiento";
        public string Estado { get; set; } = "Activo";
    }
}
