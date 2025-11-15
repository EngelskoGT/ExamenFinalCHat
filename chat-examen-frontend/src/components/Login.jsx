import React, { useState } from 'react';
import { Form, Button, Card, Container, Alert } from 'react-bootstrap';

// URL de la API de autenticación del examen (Serie I)
const AUTH_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/login/authenticate';

// El componente ahora recibe la función onLoginSuccess
function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // CRÍTICO: El usuario a enviar es solo la parte antes del @miumg.edu.gt
    const loginUsername = username.split('@')[0];

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Cuerpo de la petición JSON
        body: JSON.stringify({
          Username: loginUsername,
          Password: password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // La API devuelve el Token Bearer. Intentamos extraerlo.
        const token = data.token || data.Token || data.result; 

        if (token) {
          // **CRÍTICO: 1. Guardar el Token en localStorage**
          localStorage.setItem('authToken', token);
          
          // **CRÍTICO: 2. Notificar éxito a App.jsx y pasar el Token Y el Usuario**
          onLoginSuccess(token, loginUsername); 
        } else {
          setError('Autenticación exitosa, pero no se encontró el Token en la respuesta. (Error de mapeo)');
        }
      } else {
        // Mostrar error del servidor (ej: credenciales inválidas)
        setError(data.message || 'Credenciales inválidas o error de servidor.');
      }
    } catch (err) {
      // Mostrar error de red o de CORS
      setError('Error de conexión con la API de autenticación. Asegúrese de que la URL es correcta.');
      console.error('Error de autenticación:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm mx-auto" style={{ maxWidth: '400px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Iniciar Sesión</Card.Title>
          
          {/* Mostrar el error de credenciales si existe */}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicUsername">
              <Form.Label>Usuario (Parte del correo antes del @miumg.edu.gt)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: ctezop"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="123456a (Prueba)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Cargando...' : 'Acceder'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <p className="text-center mt-3 text-muted">Contraseña de prueba: 123456a</p>
    </Container>
  );
}

export default Login;