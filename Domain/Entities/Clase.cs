using System.Collections.Generic;

namespace Domain.Entities
{
    public class Clase
    {
        public int Id { get; set; }
        public int CanchaId { get; set; }
        public virtual Cancha Cancha { get; set; } = null!;
        public int ProfesorId { get; set; }
        public virtual Profesor Profesor { get; set; } = null!;
        public string Tipo { get; set; } = string.Empty;
        public DateTime FechaHora { get; set; }
        public int CapacidadMax { get; set; }
        public string Estado { get; set; } = "Programada";
        public int? ComplejoId { get; set; }
        public virtual Complejo? Complejo { get; set; }
        public virtual ICollection<Asistencia> Asistencias { get; set; } = new List<Asistencia>();
        public virtual ICollection<InscripcionClase> Inscripciones { get; set; } = new List<InscripcionClase>();
    }
}
