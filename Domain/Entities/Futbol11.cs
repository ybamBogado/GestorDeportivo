namespace Domain.Entities
{
    /// <summary>
    /// Cancha de Fútbol 11. Duración por defecto: 120 minutos (configurable por Admin).
    /// </summary>
    public class Futbol11 : Cancha
    {
        public int CantJugadores { get; set; } = 11;
        public string NombreTipo { get; set; } = "Fútbol 11";

        public Futbol11()
        {
            DuracionMaximaMinutos = 120; // Default Admin-configurable
        }
    }
}
