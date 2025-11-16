import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'; 
import { Form, Button, Card, Container, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap'; 
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
    const [showPicker, setShowPicker] = useState(false);
    
    // ESTADO PARA GARANTIZAR QUE EL SCROLL INICIAL SOLO OCURRA UNA VEZ
    const [initialLoadDone, setInitialLoadDone] = useState(false); 

    // NUEVOS ESTADOS PARA EL MODAL DE YOUTUBE
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState(null);

    // REFERENCIA AL CONTENEDOR SCROLLABLE
    const messagesEndRef = useRef(null); 
    
    const [userColors, setUserColors] = useState({}); 
    const loginEmisor = localStorage.getItem('username') || 'UsuarioDesconocido'; 
    
    // CRÍTICO: Normalizar el nombre de usuario logueado UNA VEZ
    const normalizedLoginEmisor = loginEmisor.toLowerCase().trim(); 

    // **********************************************
    // 💡 LÓGICA DE TIEMPO AMIGABLE (NUEVA INTEGRACIÓN)
    // **********************************************
    const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (d) => d.toLocaleDateString();

    const isSameDay = (d1, d2) => 
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();

    const getFriendlyTimeDisplay = (date) => {
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        // 1. Menos de 1 minuto
        if (diffMinutes < 1) {
            const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            return `hace ${diffSeconds < 5 ? 'un instante' : diffSeconds + ' segundos'}`;
        }
        
        // 2. Menos de 60 minutos
        if (diffMinutes < 60) {
            return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        }

        // 3. Hoy (más de 60 minutos)
        if (isSameDay(date, now)) {
            return `Hoy a las ${formatTime(date)}`;
        }

        // 4. Ayer
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (isSameDay(date, yesterday)) {
            return `Ayer a las ${formatTime(date)}`;
        }

        // 5. Más antiguo
        return `${formatDate(date)} ${formatTime(date)}`;
    };
    
    // **********************************************
    // LÓGICA DE UTILIDAD PARA YOUTUBE
    // **********************************************
    
    /**
     * Extrae el ID de video de una URL de YouTube.
     */
    const extractYouTubeVideoId = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube-nocookie\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=))([^"&?\/\n\s]{11})/;
        const match = url.match(regex);
        return (match && match[1].length === 11) ? match[1] : null;
    };
    
    /**
     * Abre el modal y establece el ID del video.
     */
    const handleVideoClick = (videoId) => {
        setCurrentVideoId(videoId);
        setShowVideoModal(true);
    };

    /**
     * Procesa el contenido del mensaje, identificando enlaces de YouTube
     * y convirtiéndolos en componentes <button> clicables.
     */
    const renderMessageContent = (content) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);
        
        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                const videoId = extractYouTubeVideoId(part);
                
                if (videoId) {
                    // Si es un enlace de YouTube, lo convierte en un botón para abrir el modal
                    return (
                        <Button 
                            key={index}
                            variant="link"
                            className="p-0 border-0 text-white-50 text-decoration-underline d-inline-block text-truncate"
                            style={{ maxWidth: '100%', whiteSpace: 'normal', lineHeight: '1.2' }}
                            onClick={() => handleVideoClick(videoId)}
                        >
                            🔗 Ver video: {part}
                        </Button>
                    );
                } else {
                    // Si es otra URL, lo convierte en un enlace normal
                    return (
                        <a 
                            key={index} 
                            href={part} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-white-50 text-decoration-underline"
                        >
                            {part}
                        </a>
                    );
                }
            }
            return part;
        });
    };


    // **********************************************
    // LÓGICA DE SCROLL AVANZADA (USELAYOUTEFFECT)
    // **********************************************
    const forceScrollToBottom = () => {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight; 
    };

    useLayoutEffect(() => {
        const container = messagesEndRef.current;
        if (!container || !initialLoadDone) return;

        const clientHeight = container.clientHeight;
        const currentScrollPosition = container.scrollTop; 
        const scrollableHeight = container.scrollHeight;
        
        const distanceToBottom = scrollableHeight - currentScrollPosition - clientHeight;
        const isUserReadingHistory = distanceToBottom > 150; 
        
        if (!isUserReadingHistory) {
            container.scrollTop = container.scrollHeight;
        }

    }, [messages]); 


    // FUNCIÓN DE ASIGNACIÓN DE COLOR CONSISTENTE
    const getEmisorColor = (emisor) => {
        const normalizedEmisor = emisor.toLowerCase().trim();
        
        if (normalizedEmisor === normalizedLoginEmisor) { 
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
                
                if (data.length !== messages.length || !initialLoadDone) {
                    setMessages(data); 
                }
                
                // SCROLL INICIAL GARANTIZADO UNA SOLA VEZ
                if (!initialLoadDone) {
                    setTimeout(() => forceScrollToBottom(), 100); 
                    setInitialLoadDone(true);
                }
                
            } else {
                setError(`Error ${response.status} al cargar mensajes de Azure. Verifique el Backend.`);
            }
        } catch (err) {
            setError('Error de red al conectar con su Backend de Azure (Serie III).');
            console.error('Error de fetchMessages:', err);
        } finally {
            if(initialLoadDone) {
                 setLoadingMessages(false);
            }
           
        }
    };

    // EFECTO PRINCIPAL: Inicia la carga y el intervalo
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); 
        return () => clearInterval(interval);
    }, []);
    
    // ENVÍO DE MENSAJES (SERIE II)
    const handleEmojiSelect = (emojiData) => {
        setNewMessage(prevMsg => prevMsg + emojiData.emoji);
    };
    
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
                await fetchMessages(); 
                setTimeout(() => forceScrollToBottom(), 100); 
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
        <>
            <Container className="my-4">
                <Row className="mb-3 align-items-center">
                    <Col>
                        <div className="d-flex align-items-center">
                            <img src={logoUMG} alt="Logo UMG" style={{ height: '80px', marginRight: '20px' }} />
                            <h2 className="text-white mb-0" style={titleStyle}>Chat UMG</h2>
                        </div>
                    </Col>
                    
                    <Col className="text-end d-flex align-items-center justify-content-end"> 
                        
                        {/* 1. Perfil Compacto Visual (Fondo Transparente) */}
                        <div className="p-2 d-flex align-items-center rounded-3 bg-transparent me-3" style={{ maxWidth: '200px' }}>
                            
                            {/* Avatar Circle */}
                            <div className="rounded-circle bg-secondary me-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="bi bi-person-fill" style={{ fontSize: '1.5em', color: 'white' }}></i>
                            </div>
                            
                            {/* Info Area */}
                            <div>
                                <div className="fw-bold text-white mb-0" style={{lineHeight: '1.2', fontSize: '0.9em'}}>{loginEmisor}</div>
                                <div className="d-flex align-items-center">
                                    {/* 2. Punto Parpadeante "En línea" */}
                                    <div className="status-pulse me-1"></div> 
                                    <small className="fw-bold" style={{ color: '#39ff14' }}>En línea</small>
                                </div>
                            </div>
                        </div>

                        {/* 3. Botón de Cerrar Sesión */}
                        <Button variant="danger" onClick={onLogout}>Cerrar Sesión</Button>
                    </Col>
                </Row>
                <hr />

                {error && <Alert variant="danger">{error}</Alert>}

                <Row>
                    <Col md={12}>
                        {/* APLICAR REFERENCIA AL CONTENEDOR SCROLLABLE */}
                        <Card style={{ height: '70vh', overflowY: 'auto' }} className="mb-3 bg-transparent border-0" ref={messagesEndRef}> 
                            <Card.Header className="text-center bg-transparent border-0 text-dark fw-bold">
                                Visualización de Mensajes (Serie III)
                            </Card.Header>
                            
                            <Card.Body className="chat-background"> 
                                {loadingMessages && <div className="text-center"><Spinner animation="border" size="sm" /> Cargando mensajes...</div>}
                                
                                {messages.map((msg, index) => {
                                    const assignedColor = getEmisorColor(msg.emisor);
                                    const date = new Date(msg.fecha); 
                                    const isValidDate = !isNaN(date.getTime());
                                    
                                    // 💡 Usa la nueva función para el formato de hora amigable
                                    const friendlyTime = isValidDate ? getFriendlyTimeDisplay(date) : 'Fecha Inválida';
                                    
                                    const borderColor = `var(--bs-${assignedColor})`;
                                    const isDarkBackground = (assignedColor === 'dark' || assignedColor === 'primary' || assignedColor === 'danger' || assignedColor === 'success');
                                    const textColor = isDarkBackground ? 'white' : 'black';

                                    const isOnlyEmoji = /^[\p{Emoji}\s]+$/u.test(msg.contenido);

                                    // LÓGICA DE NORMALIZACIÓN PARA LA ALINEACIÓN
                                    const normalizedMessageEmisor = msg.emisor.toLowerCase().trim();
                                    const isOwnMessage = normalizedMessageEmisor === normalizedLoginEmisor;


                                    // Lógica de visibilidad de metadatos (el fix de la burbuja limpia)
                                    const showHeader = !isOwnMessage && !isOnlyEmoji;
                                    const showFooter = !isOnlyEmoji;

                                    return (
                                        <div 
                                            key={index} 
                                            // CLASES DE CRISTAL Y COLOR
                                            className={`mb-2 p-2 rounded-pill bubble-glass 
                                                        bg-${assignedColor} bg-opacity-75 
                                                        ${isOwnMessage ? 'ms-auto' : ''}`} 
                                            
                                            style={{ 
                                                maxWidth: '80%', 
                                                color: textColor,
                                                border: `2px solid ${borderColor}`,
                                                fontSize: isOnlyEmoji ? '2.5em' : '1em', 
                                                padding: isOnlyEmoji ? '5px 15px' : '0.5rem',
                                            }}
                                        >
                                            {/* Muestra nombre SÓLO si es otro usuario y no es emoji-only */}
                                            {showHeader && <div className="fw-bold">{msg.emisor}</div>} 
                                            
                                            {/* RENDERIZA EL CONTENIDO PROCESADO */}
                                            <div>{renderMessageContent(msg.contenido)}</div> 
                                            
                                            {/* Muestra fecha SÓLO si no es emoji-only */}
                                            {showFooter && (
                                                <small className="text-end d-block" style={{ fontSize: '0.7em', opacity: 0.7, color: 'inherit' }}>
                                                    {/* 💡 Se usa la variable friendlyTime */}
                                                    {friendlyTime}
                                                </small>
                                            )}
                                        </div>
                                    );
                                })}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Formulario de Envío (Serie II) */}
                    <Col md={12}>
                        <Card className="bubble-glass bg-transparent border-0">
                            <Card.Body>
                                {showPicker && (
                                    <EmojiPickerContainer onEmojiClick={handleEmojiSelect} />
                                )}
                                
                                <Form onSubmit={handleSend} className="position-relative">
                                    <Form.Group className="d-flex align-items-center">
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
                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
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

            {/* MODAL PARA REPRODUCIR VIDEO DE YOUTUBE CON ESTILO PERSONALIZADO */}
            <Modal 
                show={showVideoModal} 
                onHide={() => setShowVideoModal(false)} 
                size="lg" 
                centered
            >
                {/* Cabecera del Modal con estilo oscuro y cristal */}
                <Modal.Header 
                    closeButton 
                    className="bg-dark bg-opacity-75 text-white border-bottom-0" 
                    style={{ backdropFilter: 'blur(5px)' }} 
                >
                    <Modal.Title>
                         <i className="bi bi-youtube me-2" style={{ color: '#ff0000' }}></i> 
                        Reproductor de Video de YouTube
                    </Modal.Title>
                </Modal.Header>
                
                {/* Cuerpo del Modal con fondo oscuro y sin padding extra */}
                <Modal.Body className="p-0 bg-dark"> 
                    {currentVideoId && (
                        <div className="ratio ratio-16x9">
                            <iframe
                                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default ChatApp;