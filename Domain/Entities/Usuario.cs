namespace Domain.Entities;

public class Usuario : Persona
{
    public string Direccion { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
}
