namespace Application.DTOs;

public record AuthResult(
    int Id,
    string Nombre,
    string Apellido,
    string Email,
    string Rol,
    int Legajo,
    int Dni,
    string Token
);
