using Application.Handlers;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Queries;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Ticketinador2000.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ─── Serialización JSON ────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
        opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

// ─── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath);

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description  = "Ingresá el token JWT"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ─── Base de datos ─────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var cs = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(cs) && (cs.Contains("localdb") || cs.Contains("Server=") || cs.Contains("Database=")))
        options.UseSqlServer(cs);
    else
        options.UseSqlite(cs);
});

// ─── JWT ───────────────────────────────────────────────────────────────────────
var jwtSecret   = builder.Configuration["Jwt:Secret"]!;
var jwtIssuer   = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
var permitLimit  = builder.Configuration.GetValue<int>("RateLimiting:AuthPermitLimit", 10);
var windowMinutes = builder.Configuration.GetValue<int>("RateLimiting:AuthWindowMinutes", 1);

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", cfg =>
    {
        cfg.PermitLimit   = permitLimit;
        cfg.Window        = TimeSpan.FromMinutes(windowMinutes);
        cfg.QueueLimit    = 0;
        cfg.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    options.OnRejected = async (context, _) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsync("Demasiados intentos. Esperá un momento.");
    };
});

// ─── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// ─── Repositorios y servicios de dominio ───────────────────────────────────────
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<ICanchaRepository, CanchaRepository>();
builder.Services.AddScoped<IReservaRepository, ReservaRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IPersonaRepository, PersonaRepository>();
builder.Services.AddScoped<IVirtualWalletService, FakeVirtualWalletService>();
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();

// ─── Command / Query handlers ──────────────────────────────────────────────────
builder.Services.AddScoped<RegisterPersonaCommandHandler>();
builder.Services.AddScoped<LoginPersonaCommandHandler>();
builder.Services.AddScoped<GoogleLoginPersonaCommandHandler>();
builder.Services.AddScoped<GetPersonasQueryHandler>();
builder.Services.AddScoped<GetPersonaByIdQueryHandler>();
builder.Services.AddScoped<UpdatePersonaCommandHandler>();
builder.Services.AddScoped<DeletePersonaCommandHandler>();
builder.Services.AddScoped<CreateReservaCommandHandler>();
builder.Services.AddScoped<UpdateReservaEstadoCommandHandler>();
builder.Services.AddScoped<IGetCanchaCatalogQueryHandler, GetCanchaCatalogQueryHandler>();
builder.Services.AddScoped<GetCanchaByIdQueryHandler>();
builder.Services.AddScoped<CreateCanchaCommandHandler>();
builder.Services.AddScoped<GetReservasQueryHandler>();

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ─── Seed ──────────────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var log = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        log.LogError(ex, "Error inicializando la base de datos.");
    }
}

// ─── Pipeline ──────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
