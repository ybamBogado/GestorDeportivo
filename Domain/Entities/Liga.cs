using System.Collections.Generic;

namespace Domain.Entities
{
    public class Liga
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Reglamento { get; set; } = string.Empty;
        public string Estado { get; set; } = "Abierta";
        public int CupoEquipos { get; set; } = 16;
        public int? ComplejoId { get; set; }
        public virtual Complejo? Complejo { get; set; }

        public virtual ICollection<InscripcionLiga> Inscripciones { get; set; } = new List<InscripcionLiga>();
        public virtual ICollection<Partido> Partidos { get; set; } = new List<Partido>();
    }
}
