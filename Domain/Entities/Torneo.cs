using System.Collections.Generic;

namespace Domain.Entities
{
    public class Torneo
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Reglamento { get; set; } = string.Empty;
        public string Formato { get; set; } = "EliminacionDirecta";
        public string Estado { get; set; } = "Abierto";
        public int CupoEquipos { get; set; } = 16;
        public int? ComplejoId { get; set; }
        public virtual Complejo? Complejo { get; set; }

        public virtual ICollection<InscripcionTorneo> Inscripciones { get; set; } = new List<InscripcionTorneo>();
        public virtual ICollection<Partido> Partidos { get; set; } = new List<Partido>();
    }
}
