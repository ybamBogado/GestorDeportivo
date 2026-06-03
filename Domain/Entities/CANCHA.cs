using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    public abstract class Cancha
    {
        public int Id { get; set; } // Representa idCancha
        public string Superficie { get; set; } = string.Empty;
        public int Capacidad { get; set; }
        public string Estado { get; set; } = string.Empty;
        public int? ComplejoId { get; set; }
        public virtual Complejo? Complejo { get; set; }

        // Relaciones basadas en el UML
        public virtual ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
        public virtual ICollection<Reporte> Reportes { get; set; } = new List<Reporte>();
        public virtual ICollection<Entrenamiento> Entrenamientos { get; set; } = new List<Entrenamiento>();
        public virtual ICollection<CanchaBloqueo> Bloqueos { get; set; } = new List<CanchaBloqueo>();

        // Métodos abstractos/virtuales según UML
        public abstract int GetDuracionMaxima();
    }
}
