var builder = WebApplication.CreateBuilder(args);

// **********************************
// 1. CONFIGURACIÓN DE SERVICIOS
// **********************************

// Agregamos el servicio de CORS (necesario para que React se comunique)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            // 💡 CRÍTICO: Usar AllowAnyOrigin()
            policy.AllowAnyOrigin()
                  .AllowAnyHeader() // Permite cualquier encabezado HTTP (incluyendo Authorization)
                  .AllowAnyMethod(); // Permite GET, POST, PUT, DELETE, etc.
        });
});

// Agregamos el servicio de Controladores (para usar el MensajesController)
builder.Services.AddControllers();

// Estos servicios son para la documentación (Swagger)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// **********************************
// 2. CONFIGURACIÓN DE MIDDLEWARE
// **********************************

// Configurar Swagger/OpenAPI solo en modo desarrollo
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Usar la política de CORS que definimos
app.UseCors();

app.UseAuthorization();

// CRÍTICO: Mapear los controladores
app.MapControllers();

app.Run();