namespace Domain.Entities;
public class Profesor : Persona
{
    public bool Certificacion { get; set; }
    public DateTime? FechaVencimientoCertificacion { get; set; }

    public bool TieneCertificacionVigente()
    {
        return Certificacion && (!FechaVencimientoCertificacion.HasValue || FechaVencimientoCertificacion.Value.Date >= DateTime.UtcNow.Date);
    }
}
