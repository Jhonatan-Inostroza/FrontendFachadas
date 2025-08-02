import React from 'react';

interface ResultadoImgProps {
  imageSrc: string | null;
  imageResult: string | null;
  // Modificado: onClick ahora también recibe el File
  onClick?: (imageUrl: string | null, resultText: string | null, file: File | null) => void; 
  file: File | null; // Nueva prop: el objeto File asociado a este resultado
}

const ResultadoImg: React.FC<ResultadoImgProps> = ({ imageSrc, imageResult, onClick, file }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(imageSrc, imageResult, file); // Pasa el 'file' al hacer clic
    }
  };

  return (
    <div 
      className="resultado-img-container flex items-center justify-center bg-gray-50 rounded-lg shadow-inner overflow-hidden relative"
      onClick={handleClick} // Hace que el contenedor sea clicable
      style={{ cursor: onClick ? 'pointer' : 'default', minHeight: '150px' }} // Cambia el cursor si es clicable
    >
      {imageSrc ? (
        <img 
          src={imageSrc} 
          alt="Resultado" 
          className="max-w-full max-h-full object-contain" 
        />
      ) : imageResult ? (
        <p className="text-gray-600 text-center p-2 text-sm whitespace-pre-wrap break-words">
          {imageResult}
        </p>
      ) : (
        <p className="text-gray-400 text-sm">Esperando resultado...</p>
      )}
    </div>
  );
};

export default ResultadoImg;
