using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    public class Reporte
    {
        public int Id { get; set; } // idReporte
        public string Tipo { get; set; } = string.Empty;
        public DateTime FechaGeneracion { get; set; }
        public string Periodo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public string Formato { get; set; } = string.Empty;

        // Relación con Cancha (1 a muchos o muchos a muchos según se implemente)
        public virtual ICollection<Cancha> Canchas { get; set; } = new List<Cancha>();
    }
}
