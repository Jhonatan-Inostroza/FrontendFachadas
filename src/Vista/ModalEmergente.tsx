import React, { useState, useEffect } from 'react';
import '../Estilos/ModalEmergente.css'; // Importa el nuevo archivo CSS (ajustado a tu nombre)

interface ModalResultadoProps {
  isOpen: boolean; // Controla si la modal está abierta o cerrada
  onClose: () => void; // Función para cerrar la modal
  imageUrl: string | null; // URL de la imagen a mostrar (proviene de App.tsx)
  resultText: string | null; // Texto del resultado (si aplica)
  
  modalImageFile: File | null; // El objeto File de la imagen mostrada en la modal
  onProcessImage: (action: string, file: File | null, fromModal?: boolean) => Promise<string | null>; 
}

const ModalEmergente: React.FC<ModalResultadoProps> = ({ 
  isOpen, 
  onClose, 
  imageUrl, // Usaremos directamente esta prop
  resultText,
  modalImageFile, 
  onProcessImage 
}) => {
  // Estado para el resultado de la medición (texto de estado/error)
  const [measurementStatus, setMeasurementStatus] = useState<string | null>(null);

  // Reiniciar el estado de la medición cuando la modal se abre o cuando cambia la imagen
  useEffect(() => {
    if (isOpen) {
      setMeasurementStatus(null); // Limpiar estado de medición al abrir o cambiar imagen
      // AÑADIDO PARA DEPURACIÓN:
      console.log("DEBUG (ModalEmergente): Modal se abrió/actualizó. imageUrl prop:", imageUrl);
    }
  }, [isOpen, imageUrl]); // Depende de isOpen y imageUrl para reiniciar el estado

  if (!isOpen) {
    return null; // Si no está abierta, no renderizar nada
  }

  const handleMedirYoloClick = async () => {
    if (modalImageFile) {
      console.log("DEBUG: Llamando a medir_yolo con la imagen de la modal...");
      setMeasurementStatus('Procesando medición con YOLO...'); // Mostrar estado de carga

      try {
        // Llama a procesarImagen de App.tsx, indicando que la llamada viene de la modal (true)
        // App.tsx se encargará de actualizar la prop 'imageUrl' de esta modal si se devuelve una nueva imagen.
        const result = await onProcessImage('medir_yolo', modalImageFile, true); 
        
        // Si result es una URL de Blob, significa que la imagen con mediciones se devolvió.
        // App.tsx ya actualizó modalImageUrl (la prop imageUrl de esta modal).
        // Solo necesitamos actualizar el estado de texto de la medición.
        if (result && result.startsWith('blob:')) {
            setMeasurementStatus('Medición con YOLO completada (imagen actualizada).'); 
        } else if (result) { // Si result es un mensaje de texto (ej. error o datos JSON)
            setMeasurementStatus(result); 
        } else {
            setMeasurementStatus('No se obtuvo resultado de YOLO.'); 
        }

      } catch (error) {
        console.error("ERROR al medir con YOLO desde la modal:", error); 
        setMeasurementStatus(`Error al medir con YOLO: ${String(error)}`); 
      }
    } else {
      console.warn("No hay imagen disponible en la modal para medir_yolo."); 
      setMeasurementStatus('Error: No hay imagen para medir.');
    }
  };

  return (
    // Overlay oscuro de fondo
    <div className="modal-overlay" onClick={onClose}>
      {/* Contenedor de la modal */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Evita que el clic en el contenido cierre la modal */}
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="modal-close-button"
          aria-label="Cerrar"
        >
          &times;
        </button>

        <h2 className="modal-title">Resultado Detallado</h2>
        
        {/* Usamos directamente la prop imageUrl */}
        {imageUrl ? (
          <div className="modal-image-wrapper">
            <img 
              key={imageUrl || 'no-image'} // ¡AÑADIDO AQUÍ! Fuerza la re-renderización de la imagen, con fallback
              src={imageUrl} 
              alt="Resultado del procesamiento" 
              className="modal-image"
            />
          </div>
        ) : (
          <p>No hay imagen para mostrar.</p>
        )}

        {/* Muestra el estado de la medición o el resultado original */}
        {measurementStatus ? (
          <div className="modal-result-text-container">
            <h3>Estado de Medición:</h3> 
            <pre>{measurementStatus}</pre> 
          </div>
        ) : resultText ? (
          <div className="modal-result-text-container">
            <h3>Detalles del Resultado:</h3>
            <p>{resultText}</p>
          </div>
        ) : (
          <div className="modal-result-text-container">
            <p>No hay detalles de resultado disponibles.</p>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <button
            onClick={handleMedirYoloClick} 
            className="modal-action-button"
          >
            Medir con YOLO 
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEmergente;
