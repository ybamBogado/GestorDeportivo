namespace Application.Commands;

public record UpdatePersonaCommand(
    int Id,
    string Email,
    string Rol,
    string Nombre,
    string Apellido,
    int Dni,
    int Legajo
);
