// src/Vista/DropZone.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import '../Estilos/DropZone.css'
 // <--- ¡Asegúrate de que esta línea esté presente y sea correcta!

interface DropZoneProps {
    onFileSelected: (file: File) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileSelected }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileSelected(acceptedFiles[0]);
        }
    }, [onFileSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': [],
            // Agrega más tipos de imagen si es necesario
        },
        maxFiles: 1,
    });

    return (
        <div {...getRootProps()} className={`drop-area ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p>📂 Suelta la imagen aquí... 📂</p> :
                    <p>📂 Arrastra y suelta una imagen aquí, o haz clic para seleccionarla</p>
            }
        </div>
    );
};

export default DropZone;