import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ChatApp from './components/ChatApp';

function App() {
  // Estado para guardar el token de autenticación
  const [authToken, setAuthToken] = useState(null);

  // Revisa localStorage al cargar para ver si ya hay una sesión activa
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  // Función que se llama cuando el Login es exitoso
  const handleLoginSuccess = (token, user) => { 
    setAuthToken(token);
    // 💡 CRÍTICO: Guardamos el usuario para usarlo como Emisor en ChatApp (Serie II)
    localStorage.setItem('username', user); 
  };
  
  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username'); // Limpiar también el usuario
    setAuthToken(null);
  };

  return (
    <div className="App">
      {authToken ? (
        // Si hay token, muestra la aplicación de chat (Series II y III)
        <ChatApp authToken={authToken} onLogout={handleLogout} /> 
      ) : (
        // Si no hay token, muestra el formulario de Login (Serie I)
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;