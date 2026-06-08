using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    public class Entrenamiento
    {
        public int Id { get; set; } // idEntrenamiento
        public DateTime Fecha { get; set; }
        public string Cronograma { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;

        // Relación con Cancha
        public int CanchaId { get; set; }
        public virtual Cancha Cancha { get; set; } = null!;

        // Relación con Profesor (Entrenador)
        public int EntrenadorId { get; set; }
        public virtual Entrenador Profesor { get; set; } = null!;

        // Relación con Alumnos (Lista de Usuarios)
        public virtual ICollection<Usuario> Alumnos { get; set; } = new List<Usuario>();
        public virtual ICollection<InscripcionEntrenamiento> Inscripciones { get; set; } = new List<InscripcionEntrenamiento>();
    }
}
