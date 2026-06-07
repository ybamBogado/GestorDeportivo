namespace Application.Commands;

public record RegisterPersonaCommand(
    string Email,
    string Password,
    string Rol,
    string Nombre,
    string Apellido
);
