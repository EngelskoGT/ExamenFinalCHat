import React, { useState, useEffect, useRef } from 'react'; // 💡 1. Importar useRef
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';

// URL de la API Externa para el ENVÍO de mensajes (Serie II)
const EXTERNAL_MESSAGE_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/Mensajes';

// URL de TU API de Azure para la VISUALIZACIÓN de mensajes (Serie III)
const AZURE_VISUALIZATION_URL = 'https://chatbridgeapi20251115094402-gndhbmcfexbdcqej.chilecentral-01.azurewebsites.net/api/Mensajes';

function ChatApp({ authToken, onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    // 💡 2. CREAR LA REFERENCIA
    const messagesEndRef = useRef(null); 
    
    // Obtener el nombre de usuario de localStorage
    const loginEmisor = localStorage.getItem('username') || 'UsuarioDesconocido'; 

    // Función para hacer scroll
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // **********************************************
    // SERIE III: Obtener y Visualizar Mensajes
    // **********************************************
    const fetchMessages = async () => {
        setLoadingMessages(true);
        setError(null);
        try {
            const response = await fetch(AZURE_VISUALIZATION_URL);
            
            if (response.ok) {
                const data = await response.json();
                setMessages(data.reverse()); // Mostrar más recientes al final
            } else {
                setError(`Error ${response.status} al cargar mensajes de Azure. Verifique el Backend.`);
            }
        } catch (err) {
            setError('Error de red al conectar con su Backend de Azure (Serie III).');
            console.error('Error de fetchMessages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); 
        return () => clearInterval(interval);
    }, []);
    
    // 💡 3. EFECTO PARA EL SCROLL: Se ejecuta cada vez que 'messages' cambia
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // **********************************************
    // SERIE II: Enviar Mensajes
    // **********************************************
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        setError(null);
        
        try {
            const payload = {
                Cod_Sala: 0,
                Login_Emisor: loginEmisor, 
                Contenido: newMessage,
            };

            const response = await fetch(EXTERNAL_MESSAGE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`, // Token Bearer
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setNewMessage('');
                // Al recargar mensajes, el useEffect de scroll se disparará
                fetchMessages(); 
            } else {
                if (response.status === 401) {
                    setError('ERROR 401: Token Bearer no válido. La API externa rechazó la petición.');
                } else {
                    setError(`Error ${response.status} al enviar. Revise el payload.`);
                }
            }
        } catch (err) {
            setError('Error de red al intentar enviar mensaje (Serie II).');
        } finally {
            setSending(false);
        }
    };
    
    // **********************************************
    // INTERFAZ DE USUARIO Y RENDERIZADO
    // **********************************************
    return (
        <Container className="my-4">
            {/* ... Encabezado ... */}
            <Row className="mb-3 align-items-center">
                <Col>
                    <h2 className="text-primary">Chat UMG</h2>
                </Col>
                <Col className="text-end">
                    <span className="me-3 text-muted">Usuario: **{loginEmisor}**</span>
                    <Button variant="danger" onClick={onLogout}>Cerrar Sesión</Button>
                </Col>
            </Row>
            <hr />

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                {/* Visualización de Mensajes (Serie III) */}
                <Col md={12}>
                    <Card style={{ height: '70vh', overflowY: 'auto' }} className="mb-3">
                        <Card.Header className="text-center bg-light">
                            Visualización de Mensajes (Serie III)
                        </Card.Header>
                        {/* 💡 4. ASIGNAR LA REFERENCIA AL CUERPO PARA EL SCROLL */}
                        <Card.Body ref={messagesEndRef}> 
                            {loadingMessages && <div className="text-center"><Spinner animation="border" size="sm" /> Cargando mensajes...</div>}
                            
                            {messages.map((msg, index) => {
                                // CORRECCIÓN DE FECHA
                                const date = new Date(msg.fecha); 
                                const isValidDate = !isNaN(date.getTime());
                                const formattedTime = isValidDate ? date.toLocaleTimeString() : '';
                                const formattedDate = isValidDate ? date.toLocaleDateString() : 'Fecha Inválida';
                                
                                return (
                                    <div 
                                        key={index} 
                                        className={`mb-2 p-2 rounded ${msg.emisor === loginEmisor ? 'bg-primary text-white ms-auto' : 'bg-light border'}`} 
                                        style={{ maxWidth: '80%' }}
                                    >
                                        <div className="fw-bold">{msg.emisor}</div> 
                                        <div>{msg.contenido}</div> 
                                        <small className="text-end d-block" style={{ fontSize: '0.7em', opacity: 0.7 }}>
                                            {formattedDate} {formattedTime}
                                        </small>
                                    </div>
                                );
                            })}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Formulario de Envío (Serie II) */}
                <Col md={12}>
                    <Card>
                        <Card.Body>
                            <Form onSubmit={handleSend}>
                                <Form.Group className="d-flex">
                                    <Form.Control
                                        type="text"
                                        placeholder="Escribe tu mensaje..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        disabled={sending}
                                        required
                                    />
                                    <Button variant="success" type="submit" className="ms-2" disabled={sending}>
                                        {sending ? <Spinner animation="border" size="sm" /> : 'Enviar'}
                                    </Button>
                                </Form.Group>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ChatApp;