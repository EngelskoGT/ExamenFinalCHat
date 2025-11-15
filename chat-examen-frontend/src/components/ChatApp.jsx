import React, { useState, useEffect, useRef } from 'react'; 
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
// Importamos el componente de Emoji y el logo
import EmojiPickerContainer from './EmojiPickerContainer'; 
import logoUMG from '../assets/logo-umg.png'; 

// URLs y Constantes
const EXTERNAL_MESSAGE_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/Mensajes';
const AZURE_VISUALIZATION_URL = 'https://chatbridgeapi20251115094402-gndhbmcfexbdcqej.chilecentral-01.azurewebsites.net/api/Mensajes';
const COLOR_PALETTE = ['success', 'info', 'warning', 'danger', 'secondary', 'dark']; 
const titleStyle = { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'bold', letterSpacing: '1px' };

function ChatApp({ authToken, onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    
    // ESTADO: Controla la visibilidad del selector de emojis
    const [showPicker, setShowPicker] = useState(false);

    // REFERENCIAS Y ESTADOS
    const messagesEndRef = useRef(null); 
    const [userColors, setUserColors] = useState({}); 
    const loginEmisor = localStorage.getItem('username') || 'UsuarioDesconocido'; 

    // FUNCIÓN DE SCROLL
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // FUNCIÓN DE ASIGNACIÓN DE COLOR CONSISTENTE
    const getEmisorColor = (emisor) => {
        if (emisor === loginEmisor) {
            return 'primary';
        }
        if (userColors[emisor]) {
            return userColors[emisor];
        }
        let hash = 0;
        for (let i = 0; i < emisor.length; i++) {
            hash = emisor.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % COLOR_PALETTE.length;
        const newColor = COLOR_PALETTE[index];
        setUserColors(prevColors => ({ ...prevColors, [emisor]: newColor }));
        return newColor;
    };

    // FETCH DE MENSAJES (SERIE III)
    const fetchMessages = async () => {
        setLoadingMessages(true);
        setError(null);
        try {
            const response = await fetch(AZURE_VISUALIZATION_URL);
            
            if (response.ok) {
                const data = await response.json();
                setMessages(data); 
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
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // FUNCIÓN PARA INSERTAR EMOJI EN EL CAMPO DE TEXTO
    const handleEmojiSelect = (emojiData) => {
        setNewMessage(prevMsg => prevMsg + emojiData.emoji);
        // Opcional: Cierra el selector después de seleccionar el emoji
        // setShowPicker(false); 
    };

    // ENVÍO DE MENSAJES (SERIE II)
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        setError(null);
        
        try {
            const payload = { Cod_Sala: 0, Login_Emisor: loginEmisor, Contenido: newMessage };

            const response = await fetch(EXTERNAL_MESSAGE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`, 
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setNewMessage('');
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
            <Row className="mb-3 align-items-center">
                <Col>
                    <div className="d-flex align-items-center">
                        <img src={logoUMG} alt="Logo UMG" style={{ height: '40px', marginRight: '10px' }} />
                        {/* 💡 TÍTULO EN BLANCO CORREGIDO */}
                        <h2 className="text-white mb-0" style={titleStyle}>Chat UMG</h2>
                    </div>
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
                    <Card style={{ height: '70vh', overflowY: 'auto' }} className="mb-3 bg-transparent border-0">
                        <Card.Header className="text-center bg-transparent border-0 text-dark fw-bold">
                            Visualización de Mensajes (Serie III)
                        </Card.Header>
                        
                        <Card.Body className="chat-background"> 
                            {loadingMessages && <div className="text-center"><Spinner animation="border" size="sm" /> Cargando mensajes...</div>}
                            
                            {messages.map((msg, index) => {
                                const assignedColor = getEmisorColor(msg.emisor);
                                const date = new Date(msg.fecha); 
                                const isValidDate = !isNaN(date.getTime());
                                const formattedTime = isValidDate ? date.toLocaleTimeString() : '';
                                const formattedDate = isValidDate ? date.toLocaleDateString() : 'Fecha Inválida';
                                
                                const borderColor = `var(--bs-${assignedColor})`;
                                const isDarkBackground = (assignedColor === 'dark' || assignedColor === 'primary' || assignedColor === 'danger' || assignedColor === 'success');
                                const textColor = isDarkBackground ? 'white' : 'black';

                                // 💡 NUEVA LÓGICA DE DETECCIÓN Y ESTILO DE EMOJI
                                // Regex comprueba si la cadena contiene SOLAMENTE emojis o espacios
                                const isOnlyEmoji = /^[\p{Emoji}\s]+$/u.test(msg.contenido);

                                return (
                                    <div 
                                        key={index} 
                                        className={`mb-2 p-2 rounded-pill bubble-glass 
                                                   bg-${assignedColor} bg-opacity-75 
                                                   ${msg.emisor === loginEmisor ? 'ms-auto' : ''}`} 
                                        
                                        style={{ 
                                            maxWidth: '80%', 
                                            color: textColor,
                                            border: `2px solid ${borderColor}`,
                                            // ESTILO CONDICIONAL
                                            fontSize: isOnlyEmoji ? '2.5em' : '1em', 
                                            padding: isOnlyEmoji ? '5px 15px' : '0.5rem',
                                        }}
                                    >
                                        {/* Ocultamos el Emisor y la Fecha si es solo un Emoji */}
                                        {!isOnlyEmoji && <div className="fw-bold">{msg.emisor}</div>} 
                                        
                                        {/* Contenido del mensaje */}
                                        <div>{msg.contenido}</div> 
                                        
                                        {!isOnlyEmoji && (
                                            <small className="text-end d-block" style={{ fontSize: '0.7em', opacity: 0.7, color: 'inherit' }}>
                                                {formattedDate} {formattedTime}
                                            </small>
                                        )}
                                    </div>
                                );
                            })}
                            
                            <div ref={messagesEndRef} /> 
                        </Card.Body>
                    </Card>
                </Col>

                {/* Formulario de Envío (Serie II) */}
                <Col md={12}>
                    <Card>
                        <Card.Body>
                            {/* 💡 CONTENEDOR FLOTANTE DE EMOJIS */}
                            {showPicker && (
                                <EmojiPickerContainer onEmojiClick={handleEmojiSelect} />
                            )}
                            
                            <Form onSubmit={handleSend} className="position-relative">
                                <Form.Group className="d-flex align-items-center">
                                    {/* BOTÓN PARA ABRIR/CERRAR EL SELECTOR */}
                                    <Button 
                                        variant="light" 
                                        onClick={() => setShowPicker(prev => !prev)} 
                                        className="me-2"
                                        title="Seleccionar Emoji"
                                    >
                                        😀
                                    </Button>
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