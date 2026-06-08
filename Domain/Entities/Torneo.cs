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

        // Nuevos campos requeridos por el enunciado
        public DateTime FechaInicio { get; set; } = DateTime.UtcNow;
        public DateTime FechaFin { get; set; } = DateTime.UtcNow.AddMonths(1);
        public string Categoria { get; set; } = "Primera";
        public int PremioUSD { get; set; } = 0;
        public string Modalidad { get; set; } = "Eliminacion"; // "TodosVsTodos" | "Eliminacion"
        public decimal CostoInscripcion { get; set; } = 0;

        public virtual ICollection<InscripcionTorneo> Inscripciones { get; set; } = new List<InscripcionTorneo>();
        public virtual ICollection<Partido> Partidos { get; set; } = new List<Partido>();
        public virtual ICollection<Fixture> Fixtures { get; set; } = new List<Fixture>();
    }
}
