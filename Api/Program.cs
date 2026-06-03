using Application.Handlers;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Queries;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Ticketinador2000.Infrastructure.Persistence;
using Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath);
});

builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<ICanchaRepository, CanchaRepository>();
builder.Services.AddScoped<IReservaRepository, ReservaRepository>();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IPersonaRepository, PersonaRepository>();

builder.Services.AddScoped<RegisterPersonaCommandHandler>();
builder.Services.AddScoped<LoginPersonaCommandHandler>();
builder.Services.AddScoped<GetPersonasQueryHandler>();
builder.Services.AddScoped<GetPersonaByIdQueryHandler>();
builder.Services.AddScoped<UpdatePersonaCommandHandler>();
builder.Services.AddScoped<DeletePersonaCommandHandler>();
builder.Services.AddScoped<IVirtualWalletService, FakeVirtualWalletService>();
builder.Services.AddScoped<CreateReservaCommandHandler>();
builder.Services.AddScoped<UpdateReservaEstadoCommandHandler>();

builder.Services.AddScoped<IGetCanchaCatalogQueryHandler, GetCanchaCatalogQueryHandler>();
builder.Services.AddScoped<GetCanchaByIdQueryHandler>();
builder.Services.AddScoped<CreateCanchaCommandHandler>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAnyOrigin", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        context.Database.EnsureCreated();

        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        // Si falla por algún motivo (ej: base de datos apagada), lo podemos ver en la consola
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error inicializando la base de datos.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAnyOrigin");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
