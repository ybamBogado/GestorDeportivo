namespace Domain.Entities;

public class Usuario : Persona
{
    public virtual ICollection<Asistencia> Asistencias { get; set; } = new List<Asistencia>();
    public virtual ICollection<Equipo> Equipos { get; set; } = new List<Equipo>();
    public virtual ICollection<Entrenamiento> Entrenamientos { get; set; } = new List<Entrenamiento>();
    public virtual ICollection<InscripcionClase> InscripcionesClase { get; set; } = new List<InscripcionClase>();
    public virtual ICollection<InscripcionEntrenamiento> InscripcionesEntrenamiento { get; set; } = new List<InscripcionEntrenamiento>();
    public virtual ICollection<InscripcionEquipo> InscripcionesEquipo { get; set; } = new List<InscripcionEquipo>();
}
