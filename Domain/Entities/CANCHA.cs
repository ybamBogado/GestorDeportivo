using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    public abstract class Cancha
    {
        public int Id { get; set; }
        public string Superficie { get; set; } = string.Empty;
        public int Capacidad { get; set; }
        public string Estado { get; set; } = string.Empty;
        public int? ComplejoId { get; set; }
        public virtual Complejo? Complejo { get; set; }

        /// <summary>
        /// Duración máxima de reserva en minutos, configurable por el Administrador.
        /// Valores sugeridos: Fútbol 5 = 60, Fútbol 7 = 90, Fútbol 11 = 120.
        /// </summary>
        public int DuracionMaximaMinutos { get; set; } = 60;

        /// <summary>Precio por hora en la moneda local, configurable por el Administrador.</summary>
        public decimal PrecioHora { get; set; } = 4500;

        // Relaciones basadas en el UML
        public virtual ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
        public virtual ICollection<Reporte> Reportes { get; set; } = new List<Reporte>();
        public virtual ICollection<Entrenamiento> Entrenamientos { get; set; } = new List<Entrenamiento>();
        public virtual ICollection<CanchaBloqueo> Bloqueos { get; set; } = new List<CanchaBloqueo>();

        /// <summary>Retorna la duración máxima en minutos desde la propiedad configurable.</summary>
        public virtual int GetDuracionMaxima() => DuracionMaximaMinutos;
    }
}
