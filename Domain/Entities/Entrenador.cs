namespace Domain.Entities;
public class Entrenador : Persona
{
    public bool Certificado { get; set; }
    public DateTime? FechaVencimientoCertificacion { get; set; }

    public bool TieneCertificacionVigente()
    {
        return Certificado && (!FechaVencimientoCertificacion.HasValue || FechaVencimientoCertificacion.Value.Date >= DateTime.UtcNow.Date);
    }
}
