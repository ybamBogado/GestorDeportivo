using System.Collections.Generic;

namespace Domain.Entities
{
    /// <summary>
    /// Representa una "fecha" o jornada dentro de una Liga o Torneo.
    /// Agrupa los partidos que se juegan en un mismo período.
    /// </summary>
    public class Fixture
    {
        public int Id { get; set; }

        /// <summary>Número de jornada: Fecha 1, Fecha 2, ...</summary>
        public int Numero { get; set; }

        public DateTime FechaDesde { get; set; }
        public DateTime FechaHasta { get; set; }

        // Pertenece a Liga o Torneo (uno de los dos)
        public int? LigaId { get; set; }
        public virtual Liga? Liga { get; set; }

        public int? TorneoId { get; set; }
        public virtual Torneo? Torneo { get; set; }

        public virtual ICollection<Partido> Partidos { get; set; } = new List<Partido>();
    }
}
