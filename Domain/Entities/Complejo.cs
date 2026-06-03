using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    public class Complejo
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;

        public virtual ICollection<Cancha> Canchas { get; set; } = new List<Cancha>();
        public virtual ICollection<Persona> Miembros { get; set; } = new List<Persona>();
        public virtual ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
        public virtual ICollection<Liga> Ligas { get; set; } = new List<Liga>();
        public virtual ICollection<Torneo> Torneos { get; set; } = new List<Torneo>();
        public virtual ICollection<Clase> Clases { get; set; } = new List<Clase>();

        public void RegistrarMiembro(Persona nuevaPersona)
        {
            if (nuevaPersona == null) throw new ArgumentNullException(nameof(nuevaPersona));
            Miembros.Add(nuevaPersona);
        }

        public void AgregarCancha(Cancha nuevaCancha)
        {
            if (nuevaCancha == null) throw new ArgumentNullException(nameof(nuevaCancha));
            Canchas.Add(nuevaCancha);
        }
    }
}
