using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using System.IO;
using System.Text.Json;

namespace Infrastructure.Persistence
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

            string? connectionString = null;
            try
            {
                var apiPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Api", "appsettings.json");
                if (!File.Exists(apiPath))
                {
                    apiPath = Path.Combine(Directory.GetCurrentDirectory(), "Api", "appsettings.json");
                }

                if (File.Exists(apiPath))
                {
                    var json = File.ReadAllText(apiPath);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("ConnectionStrings", out var connStrings) &&
                        connStrings.TryGetProperty("DefaultConnection", out var defConn))
                    {
                        connectionString = defConn.GetString();
                    }
                }
            }
            catch
            {
                // Fallback
            }

            if (string.IsNullOrEmpty(connectionString))
            {
                connectionString = "Data Source=../Api/golahora.db";
            }

            if (connectionString.Contains("Data Source=") && !connectionString.Contains("/") && !connectionString.Contains("\\"))
            {
                connectionString = connectionString.Replace("Data Source=", "Data Source=../Api/");
            }

            if (connectionString.Contains("localdb") || connectionString.Contains("Server=") || connectionString.Contains("Database="))
            {
                optionsBuilder.UseSqlServer(connectionString);
            }
            else
            {
                optionsBuilder.UseSqlite(connectionString);
            }

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}