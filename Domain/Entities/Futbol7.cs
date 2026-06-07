namespace Domain.Entities
{
    /// <summary>
    /// Cancha de Fútbol 7. Duración por defecto: 90 minutos (configurable por Admin).
    /// </summary>
    public class Futbol7 : Cancha
    {
        public int CantJugadores { get; set; } = 7;
        public string NombreTipo { get; set; } = "Fútbol 7";

        public Futbol7()
        {
            DuracionMaximaMinutos = 90; // Default Admin-configurable
        }
    }
}
