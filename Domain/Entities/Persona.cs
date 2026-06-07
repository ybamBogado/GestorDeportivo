namespace Domain.Entities
{
    public abstract class Persona 
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public int Dni { get; set; }
        public int Legajo { get; set; }

        // Atributos de Usuario para el Login
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Rol { get; set; } = "Cliente";
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string? FotoPerfil { get; set; }
        public string? CertificadoPdf { get; set; }
        public int? ComplejoId { get; set; }
        public virtual Complejo? Complejo { get; set; }
    }
}
