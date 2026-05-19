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
    }
}
