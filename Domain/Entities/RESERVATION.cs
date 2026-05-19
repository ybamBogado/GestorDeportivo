using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    public class Reserva
    {
        public int Id { get; set; }
        
        // Propiedades del UML
        public int LimiteReserva { get; set; }
        public int LimiteHorario { get; set; }
        public bool Pago { get; set; }

        // Relaciones con Cancha
        public int CanchaId { get; set; }
        public virtual Cancha Cancha { get; set; } = null!;
        
        // Asumo que una Reserva la hace un Usuario (Cliente)
        public int PersonaId { get; set; }
        public virtual Persona Persona { get; set; } = null!;
    }
}