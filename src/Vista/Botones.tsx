import React from 'react';
import '../Estilos/Botones.css'; // Asegúrate de que esta ruta a tu CSS sea correcta

// Define las props que BotonesFuncion va a recibir de App.tsx
interface BotonesFuncionProps {
    // Estas props son opcionales porque solo se usan cuando tipoImagen es 'original'
    // Modificado: Ahora Procesar puede devolver Promise<string | null>
    Procesar?: (accion: string, sourceFile?: File | null) => Promise<string | null>; 
    RotarLocal?: () => void;

    // Esta es la NUEVA prop para la función que procesa TODOS los avanzados,
    // se usa cuando tipoImagen es 'unico_avanzado'
    ProcesarTodoAvanzado?: () => Promise<void>;

    // Define los tipos de interfaz para los botones que queremos mostrar
    tipoImagen: 'original' | 'unico_avanzado';
}

const BotonesFuncion: React.FC<BotonesFuncionProps> = ({
    Procesar,
    RotarLocal,
    ProcesarTodoAvanzado,
    tipoImagen
}) => {
    return (
        <div className="botones-container">
            {/* --- Botones para la sección de "Imagen Original" (columna izquierda) --- */}
            {tipoImagen === 'original' && (
                <>
                    {/* Botón "Blanco y Negro" */}
                    {Procesar && ( // Se asegura de que la prop 'Procesar' exista
                        <button onClick={() => Procesar('blanco_negro')}>
                            Blanco y Negro
                            <br/> {/* Color */}
                        </button>
                    )}
                    {/* Botón "Rotar" */}
                    {RotarLocal && ( // Se asegura de que la prop 'RotarLocal' exista
                        <button onClick={RotarLocal}>
                            Rotar
                        </button>
                    )}
                    {/* Puedes añadir más botones aquí si tienes otras acciones básicas de frontend */}
                </>
            )}

            {/* --- El ÚNICO BOTÓN para "Opciones avanzadas y resultados" (columna derecha) --- */}
            {tipoImagen === 'unico_avanzado' && (
                <>
                    {/* Botón "Ejecutar Todos los Procesos Avanzados" */}
                    {ProcesarTodoAvanzado && ( // Se asegura de que la prop 'ProcesarTodoAvanzado' exista
                        <button className="boton-principal-avanzado" onClick={ProcesarTodoAvanzado}>
                            Ejecutar Todos los Procesos Avanzados
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default BotonesFuncion;
