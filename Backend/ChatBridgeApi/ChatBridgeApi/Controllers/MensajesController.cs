using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

[Route("api/[controller]")] // Ruta: /api/Mensajes
[ApiController]
public class MensajesController : ControllerBase
{
    private readonly IConfiguration _config;

    // Constructor: Inyecta la configuración para leer appsettings.json
    public MensajesController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet] // Método GET para obtener los mensajes
    public async Task<IActionResult> ObtenerMensajes()
    {
        // 1. Obtener la cadena de conexión
        var connectionString = _config.GetConnectionString("ChatDBConnection");
        var mensajes = new List<object>();

        if (string.IsNullOrEmpty(connectionString))
        {
            return StatusCode(500, "Error: Cadena de conexión 'ChatDBConnection' no configurada en appsettings.json.");
        }

        // 2. Consulta SQL con el nombre de columna CORREGIDO (Fecha_Envio)
        string sql = "SELECT Login_Emisor, Contenido, Fecha_Envio FROM [dbo].[Chat_Mensaje] ORDER BY Fecha_Envio ASC";

        try
        {
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                SqlCommand command = new SqlCommand(sql, connection);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        // Mapeamos los datos usando los nombres de columna exactos de la tabla
                        mensajes.Add(new
                        {
                            Emisor = reader["Login_Emisor"],
                            Contenido = reader["Contenido"],
                            Fecha = reader["Fecha_Envio"]
                        });
                    }
                }
            }
            // 3. Devolver los mensajes (Serie III cumplida)
            return Ok(mensajes);
        }
        catch (Exception ex)
        {
            // Capturar y devolver errores de conexión/credenciales
            return StatusCode(500, $"Error al acceder a la base de datos: {ex.Message}");
        }
    }
}