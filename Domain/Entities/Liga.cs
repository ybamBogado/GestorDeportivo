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

        // Nuevos campos requeridos por el enunciado
        public DateTime FechaInicio { get; set; } = DateTime.UtcNow;
        public DateTime FechaFin { get; set; } = DateTime.UtcNow.AddMonths(3);
        public int CantidadFechas { get; set; } = 1;
        public string Categoria { get; set; } = "Primera";
        public decimal CostoInscripcion { get; set; } = 0;

        public virtual ICollection<InscripcionLiga> Inscripciones { get; set; } = new List<InscripcionLiga>();
        public virtual ICollection<Partido> Partidos { get; set; } = new List<Partido>();
        public virtual ICollection<Fixture> Fixtures { get; set; } = new List<Fixture>();
    }
}
