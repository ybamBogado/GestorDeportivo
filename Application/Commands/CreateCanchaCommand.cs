namespace Application.Commands
{
    public class CreateCanchaCommand
    {
        public string Superficie { get; set; } = string.Empty;
        public int Capacidad { get; set; }
        public string Estado { get; set; } = "Disponible";
        public string TipoCancha { get; set; } = "Futbol5"; // Futbol5, Futbol7, Futbol11
    }
}
