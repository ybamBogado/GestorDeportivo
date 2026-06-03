namespace Application.Commands;

public record UpdatePersonaCommand(
    int Id,
    string Email,
    string Rol,
    string Nombre,
    string Apellido,
    int Dni,
    int Legajo,
    string? Direccion = null,
    string? Telefono = null,
    bool? Certificacion = null,
    System.DateTime? FechaVencimientoCertificacion = null,
    string? CertificadoPdf = null
);

