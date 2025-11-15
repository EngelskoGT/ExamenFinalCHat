import React, { useState } from 'react';
import { Form, Button, Card, Container, Alert } from 'react-bootstrap';
// Importamos el logo. Asegúrate de que logo-umg.png esté en src/assets/
import logoUMG from '../assets/logo-umg.png'; 

// URL de la API de autenticación del examen (Serie I)
const AUTH_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/login/authenticate';

// Estilos del título
const titleStyle = { 
    fontFamily: 'Georgia, serif', 
    fontStyle: 'italic', 
    fontWeight: 'bold', 
    letterSpacing: '1px' 
};

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginUsername = username.split('@')[0];

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: loginUsername,
          Password: password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const token = data.token || data.Token || data.result; 

        if (token) {
          localStorage.setItem('authToken', token);
          onLoginSuccess(token, loginUsername); 
        } else {
          setError('Autenticación exitosa, pero no se encontró el Token en la respuesta.');
        }
      } else {
        setError(data.message || 'Credenciales inválidas o error de servidor.');
      }
    } catch (err) {
      setError('Error de conexión con la API de autenticación.');
      console.error('Error de autenticación:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        
        {/* LOGO Y TÍTULO FUERA DE LA CARD, CON TEXTO BLANCO */}
        <div className="d-flex align-items-center mb-4 text-white">
            <img 
                src={logoUMG} 
                alt="Logo UMG" 
                style={{ height: '80px', marginRight: '20px' }} 
            />
            {/* Título con estilo cursivo aplicado por CSS global */}
            <h2 className="text-white mb-0" style={titleStyle}>
                Chat UMG
            </h2>
        </div>
        
        {/* CARD DE INICIO DE SESIÓN */}
        <Card className="shadow-sm mx-auto" style={{ maxWidth: '400px' }}>
            <Card.Body>
                <Card.Title className="text-center mb-4">Iniciar Sesión</Card.Title>
          
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

                    <Button variant="danger" type="submit" className="w-100" disabled={loading}>
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