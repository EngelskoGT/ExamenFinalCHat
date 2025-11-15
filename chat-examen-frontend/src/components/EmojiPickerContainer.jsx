// src/components/EmojiPickerContainer.jsx
import React from 'react';
import EmojiPicker from 'emoji-picker-react';

function EmojiPickerContainer({ onEmojiClick }) {
    return (
        // Contenedor flotante: se posiciona con estilo inline en ChatApp.jsx
        <div style={{ position: 'absolute', bottom: '100%', zIndex: 100 }}>
            <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
    );
}

export default EmojiPickerContainer;