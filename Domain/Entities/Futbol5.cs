namespace Domain.Entities
{
    public class Futbol5 : Cancha
    {
        public int CantJugadores { get; set; } = 5;
        public string NombreTipo { get; set; } = "Fútbol 5";

        public override int GetDuracionMaxima()
        {
            return 60; // Ejemplo: 60 minutos
        }
    }
}
