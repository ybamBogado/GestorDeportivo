namespace Domain.Entities
{
    /// <summary>
    /// Cancha de Fútbol 5. Duración por defecto: 60 minutos (configurable por Admin).
    /// </summary>
    public class Futbol5 : Cancha
    {
        public int CantJugadores { get; set; } = 5;
        public string NombreTipo { get; set; } = "Fútbol 5";

        public Futbol5()
        {
            DuracionMaximaMinutos = 60; // Default Admin-configurable
        }
    }
}
