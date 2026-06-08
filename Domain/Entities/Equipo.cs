using System.Collections.Generic;

namespace Domain.Entities
{
    public class Equipo
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string Estado { get; set; } = "Activo";
        public int? CapitanId { get; set; }
        public virtual Persona? Capitan { get; set; }

        public virtual ICollection<Usuario> Jugadores { get; set; } = new List<Usuario>();
        public virtual ICollection<InscripcionLiga> InscripcionesLiga { get; set; } = new List<InscripcionLiga>();
        public virtual ICollection<InscripcionTorneo> InscripcionesTorneo { get; set; } = new List<InscripcionTorneo>();
        public virtual ICollection<InscripcionEquipo> InscripcionesEquipo { get; set; } = new List<InscripcionEquipo>();
    }
}
