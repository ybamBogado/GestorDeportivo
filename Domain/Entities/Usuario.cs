namespace Domain.Entities;

public class Usuario : Persona
{
    public virtual ICollection<Asistencia> Asistencias { get; set; } = new List<Asistencia>();
    public virtual ICollection<Equipo> Equipos { get; set; } = new List<Equipo>();
    public virtual ICollection<Entrenamiento> Entrenamientos { get; set; } = new List<Entrenamiento>();
}
