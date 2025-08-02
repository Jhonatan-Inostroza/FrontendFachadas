import { useState, useEffect } from 'react';
import './App.css'; // Tu CSS principal, aquí deben estar los estilos de la cuadrícula
import DropZone from '@Vista/DropZone';
import ImagenPrevia from '@Vista/ImagenPrevia';
import BotonesFuncion from '@Vista/Botones';
import { enviarImagenAlBackend } from '@Modelo/Conexion';
import ResultadoImg from '@Vista/ResultadoImagen'; // Importa desde ResultadoImagen
import ModalResultado from '@Vista/ModalEmergente'; // Importa desde ModalEmergente

// --- NUEVA INTERFAZ: Define la estructura de cada slot en la cuadrícula ---
interface ProcessedSlot {
    id: string; // Ej. 'slot1', 'slot2'
    file: File | null; // El archivo Blob/File de la imagen procesada
    url: string | null; // La URL de Blob para mostrar la imagen en <img>
    resultText: string | null; // Para resultados en texto (ej. mediciones)
}

function App() {
    // --- Estados principales de la imagen original/actual ---
    const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
    const currentImageUrl = currentImageFile ? URL.createObjectURL(currentImageFile) : null;

    const [isBlancoNegro, setIsBlancoNegro] = useState(false);

    // --- AÑADIDO: NUEVO ESTADO para guardar la última versión a color (y posiblemente rotada) ---
    const [lastColorImageFile, setLastColorImageFile] = useState<File | null>(null);
    // --- NUEVO ESTADO: Para almacenar la URL de Blob de lastColorImageFile ---
    const [lastColorImageUrl, setLastColorImageUrl] = useState<string | null>(null);

    // --- Estado para manejar los 6 resultados procesados en la cuadrícula ---
    const [processedSlots, setProcessedSlots] = useState<ProcessedSlot[]>(
        Array.from({ length: 6 }, (_, i) => ({
            id: `slot${i + 1}`,
            file: null,
            url: null,
            resultText: null
        }))
    );

    // --- NUEVOS ESTADOS PARA LA MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [modalResultText, setModalResultText] = useState<string | null>(null);
    const [modalImageFile, setModalImageFile] = useState<File | null>(null); // Nuevo estado para el File de la modal
    const [modalSourceSlotId, setModalSourceSlotId] = useState<string | null>(null); // AÑADIDO: ID del slot que abrió la modal

    // --- Mapeo de Acciones del Backend a Slots Específicos ---
    const actionToSlotIdMap: { [key: string]: string } = {
        'remover': 'slot1',
        'remover_carvekit': 'slot2',
        'remover_blurfusion': 'slot3',
        'remover_briaai': 'slot4',
        'remover_u2net': 'slot5',
        'remover_basnet': 'slot6',
        // NOTA: 'medir_yolo' y 'medir_plano' no necesitan estar aquí
        // porque su actualización de slot se maneja de forma dinámica
        // usando modalSourceSlotId cuando se llaman desde el modal.
    };

    // --- Lista de TODAS las acciones avanzadas que se ejecutarán con el botón único ---
    const allAdvancedActions = [
        'remover',
        'remover_carvekit',
        'remover_blurfusion',
        'remover_briaai',
        'remover_u2net',
        'remover_basnet',
    ];

    // --- useEffect para limpiar URLs de Blob (Esencial para evitar fugas de memoria) ---
    // Ahora solo se encarga de currentImageUrl y lastColorImageUrl.
    // Las URLs de los slots se gestionan explícitamente en handleFile y procesarImagen.
    useEffect(() => {
        return () => {
            if (currentImageUrl) {
                URL.revokeObjectURL(currentImageUrl);
                console.log("DEBUG: URL de Blob revocada (currentImageUrl):", currentImageUrl);
            }
            if (lastColorImageUrl) { // Revocar la URL de la última imagen a color si existe
                URL.revokeObjectURL(lastColorImageUrl);
                console.log("DEBUG: lastColorImageUrl revocada:", lastColorImageUrl);
            }
            // Las URLs de processedSlots se revocarán en handleFile o cuando se sobrescriban.
        };
    }, [currentImageUrl, lastColorImageUrl]); // Dependencias ajustadas

    // --- Función para manejar la selección de un nuevo archivo ---
    const handleFile = (f: File) => {
        // Revocar TODAS las URLs de Blob existentes (incluyendo slots) antes de cargar una nueva imagen
        if (currentImageFile && currentImageUrl && currentImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentImageUrl);
            console.log("DEBUG: Old currentImageUrl revoked during new file load:", currentImageUrl);
        }
        if (lastColorImageUrl) { 
            URL.revokeObjectURL(lastColorImageUrl);
            console.log("DEBUG: Old lastColorImageUrl revoked during new file load:", lastColorImageUrl);
        }
        // Revocar URLs de todos los slots procesados
        processedSlots.forEach(slot => {
            if (slot.url && slot.url.startsWith('blob:')) {
                URL.revokeObjectURL(slot.url);
                console.log("DEBUG: Old slot URL revoked during new file load:", slot.url);
            }
        });
        
        // Limpiar estados de la modal y de las imágenes guardadas
        setModalImageUrl(null);
        setModalImageFile(null);
        setModalResultText(null);
        setModalSourceSlotId(null); // Limpiar también el ID del slot de origen
        setCurrentImageFile(f);
        setLastColorImageFile(f); // La imagen original es la primera imagen a color
        setLastColorImageUrl(URL.createObjectURL(f)); // Crea y guarda la URL para esta imagen a color inicial
        setIsBlancoNegro(false);
        setProcessedSlots(
            Array.from({ length: 6 }, (_, i) => ({
                id: `slot${i + 1}`,
                file: null,
                url: null,
                resultText: null
            }))
        );
        setIsModalOpen(false); // Cerrar modal al cargar nueva imagen
        console.log("DEBUG: Nueva imagen cargada. Slots y URLs previas limpiadas.");
    };

    // --- Función para abrir la modal con el contenido del slot clicado ---
    // Ahora recibe el File del slot también
    const handleResultClick = (imageUrl: string | null, resultText: string | null, file: File | null, slotId: string) => {
        console.log("DEBUG: handleResultClick llamado.");
        console.log("DEBUG: imageUrl recibido para modal:", imageUrl);
        console.log("DEBUG: resultText recibido para modal:", resultText);
        console.log("DEBUG: file recibido para modal:", file);
        console.log("DEBUG: slotId recibido para modal:", slotId); // AÑADIDO: Log del ID del slot

        setModalImageUrl(imageUrl);
        setModalResultText(resultText);
        setModalImageFile(file); // Establece el File para la modal
        setModalSourceSlotId(slotId); // AÑADIDO: Guarda el ID del slot de origen
        setIsModalOpen(true);

        console.log("DEBUG: Estados de modal configurados. isModalOpen:", true);
    };

    // --- Función para cerrar la modal ---
    const handleCloseModal = () => {
        setIsModalOpen(false);
        // No revocamos modalImageUrl aquí, ya que es una referencia a un slot.url
        // y la revocación de slot.url se maneja en el useEffect general de App.
        setModalImageUrl(null); 
        setModalResultText(null);
        setModalImageFile(null); // Limpiar el File de la modal al cerrar
        setModalSourceSlotId(null); // Limpiar el ID del slot de origen al cerrar
    };

    // --- Función principal para procesar imágenes (frontend o backend) ---
    // Modificada para devolver el resultado si la acción es de medición y se pasa un sourceFile
    // El parámetro 'fromModal' nos permite saber si la llamada viene de la modal
    const procesarImagen = async (accion: string, sourceFile: File | null = null, fromModal: boolean = false): Promise<string | null> => {
        const fileToProcess = sourceFile || currentImageFile;

        if (!fileToProcess) {
            console.warn("No hay archivo para procesar para la acción:", accion);
            return null; // Devuelve null si no hay archivo
        }

        // --- Lógica específica para Blanco y Negro (toggle en el frontend) ---
        if (accion === 'blanco_negro') {
            // Revocar la URL de la imagen actual ANTES de cambiarla
            if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentImageUrl);
                console.log("DEBUG: URL de currentImageFile revocada antes de B&N.");
            }
            
            if (isBlancoNegro) { // Si ya está en B&N, volver a Color
                if (lastColorImageFile) {
                    setCurrentImageFile(lastColorImageFile);
                    setIsBlancoNegro(false);
                    // Una vez que volvemos a color, lastColorImageFile y su URL ya no son "la última imagen a color guardada"
                    // porque la imagen actual es ahora la de color.
                    if (lastColorImageUrl) {
                        URL.revokeObjectURL(lastColorImageUrl);
                        console.log("DEBUG: lastColorImageUrl revocada al volver a color:", lastColorImageUrl);
                    }
                    setLastColorImageFile(null); 
                    setLastColorImageUrl(null);
                    setProcessedSlots(prevSlots => prevSlots.map(slot => ({ ...slot, file: null, url: null, resultText: null })));
                    console.log("DEBUG: Imagen revertida a color. Slots procesados limpiados.");
                } else {
                    console.warn("No se encontró la imagen a color guardada para revertir.");
                    setProcessedSlots(prevSlots => prevSlots.map(slot => ({ ...slot, file: null, url: null, resultText: 'Error: No se pudo revertir a color.' })));
                }
            } else { // Si está en Color, convertir a B&N
                // Guardar la imagen actual a color en lastColorImageFile y su URL antes de convertir a B&N
                if (currentImageFile) {
                    setLastColorImageFile(currentImageFile);
                    const newLastColorUrl = URL.createObjectURL(currentImageFile);
                    setLastColorImageUrl(newLastColorUrl);
                    console.log("DEBUG: lastColorImageUrl establecida a:", newLastColorUrl);
                }

                try {
                    const img = new Image();
                    img.src = URL.createObjectURL(fileToProcess); // fileToProcess es la imagen actual (color)

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) { console.error("No se pudo obtener el contexto 2D del canvas."); return; }
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                            data[i] = avg; data[i + 1] = avg; data[i + 2] = avg;
                        }
                        ctx.putImageData(imageData, 0, 0);

                        canvas.toBlob((blob) => {
                            if (blob) {
                                const newFile = new File([blob], fileToProcess.name, { type: blob.type });
                                setCurrentImageFile(newFile); // Esta es la imagen B&N
                                setIsBlancoNegro(true);
                                setProcessedSlots(prevSlots => prevSlots.map(slot => ({ ...slot, file: null, url: null, resultText: null })));
                                console.log("DEBUG: Imagen convertida a B&N. Slots procesados limpiados.");
                            } else {
                                console.error("No se pudo crear Blob desde el canvas para B&N.");
                            }
                            URL.revokeObjectURL(img.src); // Revocar la URL temporal de la fuente del canvas
                        }, fileToProcess.type);
                    };
                    img.onerror = (error) => { console.error("Error al cargar la imagen para B&N:", error); };
                } catch (error) { console.error("ERROR en lógica B&N:", error); }
            }
            return null; // No devuelve un resultado para acciones de frontend
        }
        // --- Lógica específica para ROTAR EN EL FRONTEND (modifica la imagen actual) ---
        else if (accion === 'rotar') {
            // Revocar la URL de la imagen actual ANTES de crear una nueva para la rotada
            if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentImageUrl);
                console.log("DEBUG: URL de currentImageFile revocada antes de rotar.");
            }
            // lastColorImageFile y lastColorImageUrl NO deben ser tocados por la rotación.
            // Su gestión es exclusiva de la acción 'blanco_negro'.
            // La bandera isBlancoNegro NO debe cambiar por la rotación.
            // Si la imagen estaba en B&N, sigue en B&N después de rotar.

            try {
                const img = new Image();
                img.src = URL.createObjectURL(fileToProcess); // fileToProcess es la currentImageFile

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { console.error("No se pudo obtener el contexto 2D del canvas."); return; }

                    canvas.width = img.height;
                    canvas.height = img.width;
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(90 * Math.PI / 180);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newRotatedFile = new File([blob], fileToProcess.name, { type: blob.type });
                            setCurrentImageFile(newRotatedFile);
                            // NO CAMBIAR isBlancoNegro aquí. Debe mantener su estado.
                            // NO CAMBIAR lastColorImageFile ni lastColorImageUrl aquí.
                            setProcessedSlots(prevSlots => prevSlots.map(slot => ({ ...slot, file: null, url: null, resultText: null })));
                            console.log("DEBUG: Imagen rotada. Slots procesados limpiados.");
                        } else {
                            console.error("No se pudo crear Blob para la imagen rotada.");
                        }
                        URL.revokeObjectURL(img.src);
                    }, fileToProcess.type);
                };
                img.onerror = (error) => { console.error("Error al cargar la imagen para rotar:", error); };
            } catch (error) { console.error("ERROR en lógica rotar:", error); }
            return null; // No devuelve un resultado para acciones de frontend
        }
        // --- Lógica para TODAS LAS ACCIONES del BACKEND ---
        else {
            // Determinar el targetSlotId. Si viene de la modal, usa modalSourceSlotId.
            // De lo contrario, usa el mapeo de acción a slot.
            const currentTargetSlotId = fromModal ? modalSourceSlotId : actionToSlotIdMap[accion];
            
            // Si la llamada NO viene de la modal y es una acción de slot,
            // actualizamos el estado del slot y mostramos "Procesando..."
            if (!fromModal && currentTargetSlotId) { 
                setProcessedSlots(prevSlots =>
                    prevSlots.map(slot => {
                        if (slot.id === currentTargetSlotId) {
                            // Revocar la URL del slot ANTES de sobrescribirla
                            if (slot.url && slot.url.startsWith('blob:')) {
                                URL.revokeObjectURL(slot.url);
                                console.log("DEBUG: Old slot URL revoked:", slot.url);
                            }
                            return { ...slot, file: null, url: null, resultText: 'Procesando...' };
                        }
                        return slot;
                    })
                );
            }

            try {
                const response = await enviarImagenAlBackend(fileToProcess, accion);

                if (!response) {
                    const errorMessage = 'Error: Sin respuesta del servidor.';
                    if (fromModal) { // Si la llamada viene de la modal, actualiza el estado de la modal
                        setModalImageUrl(null);
                        setModalResultText(errorMessage);
                    } else if (currentTargetSlotId) { // Si no, actualiza el slot en la cuadrícula principal
                        setProcessedSlots(prevSlots =>
                            prevSlots.map(slot =>
                                slot.id === currentTargetSlotId
                                    ? { ...slot, file: null, url: null, resultText: errorMessage }
                                    : slot
                            )
                        );
                    }
                    return errorMessage; // Devuelve el mensaje de error
                }

                // Acciones que devuelven datos JSON puros (ej. 'medida_rapida', 'medir_manualmente' si solo dan texto)
                // NOTA: 'medir_yolo' y 'medir_plano' devuelven IMÁGENES, por lo que NO deben estar aquí.
                const jsonResponseActions = ['medida_rapida', 'medir_manualmente']; 
                
                if (jsonResponseActions.includes(accion)) {
                    try {
                        const data = await response.json();
                        const resultJsonString = JSON.stringify(data, null, 2);
                        console.log(`DEBUG: Datos JSON para ${accion} recibidos:`, data);
                        
                        if (fromModal) { // Si la llamada viene de la modal, actualiza el estado de la modal
                            setModalResultText(resultJsonString);
                            setModalImageUrl(null); // Limpia la imagen si se muestra texto
                        } else if (currentTargetSlotId) { // Si no, actualiza el slot en la cuadrícula principal
                            setProcessedSlots(prevSlots =>
                                prevSlots.map(slot =>
                                    slot.id === currentTargetSlotId
                                        ? { ...slot, file: null, url: null, resultText: resultJsonString }
                                        : slot
                                )
                            );
                        }
                        return resultJsonString; // Devuelve el resultado JSON
                    } catch (error) {
                        const errorMessage = `Error al parsear JSON para ${accion}: ${String(error)}`;
                        console.error(errorMessage);
                        if (fromModal) { // Si la llamada viene de la modal, actualiza el estado de la modal
                            setModalResultText(errorMessage);
                            setModalImageUrl(null);
                        } else if (currentTargetSlotId) { // Si no, actualiza el slot en la cuadrícula principal
                            setProcessedSlots(prevSlots =>
                                prevSlots.map(slot =>
                                    slot.id === currentTargetSlotId
                                        ? { ...slot, file: null, url: null, resultText: errorMessage }
                                        : slot
                                )
                            );
                        }
                        return errorMessage; // Devuelve el error como string
                    }
                } 
                // Todas las demás acciones (incluyendo remover, mejorar, bordear, medir_yolo, medir_plano) devuelven imágenes
                else {
                    try {
                        const imageBlob = await response.blob();
                        if (imageBlob.size === 0) {
                            const warningMessage = `Resultado vacío o inválido.`;
                            console.warn(`WARNING: Blob para ${accion} es de tamaño 0. ${warningMessage}`);
                            if (fromModal) { // Si la llamada viene de la modal, actualiza el estado de la modal
                                setModalImageUrl(null);
                                setModalResultText(warningMessage);
                            } else if (currentTargetSlotId) { // Si no, actualiza el slot en la cuadrícula principal
                                setProcessedSlots(prevSlots =>
                                    prevSlots.map(slot =>
                                        slot.id === currentTargetSlotId
                                            ? { ...slot, file: null, url: null, resultText: warningMessage }
                                            : slot
                                    )
                                );
                            }
                            return warningMessage; // Devuelve el mensaje de advertencia
                        }
                        const newProcessedFile = new File([imageBlob], fileToProcess.name, { type: imageBlob.type });
                        const newUrl = URL.createObjectURL(newProcessedFile);

                        console.log(`DEBUG: Imagen procesada para ${accion} cargada. URL: ${newUrl}`);

                        if (fromModal) { // Si la llamada viene de la modal, actualiza el estado de la modal
                            // Revocar la URL anterior del modal si existe y es de Blob,
                            // PERO SOLO SI LA ACCIÓN NO ES MEDIR_YOLO O MEDIR_PLANO.
                            // Si es medir_yolo/plano, la modalImageUrl anterior es la URL del slot,
                            // y no queremos revocarla porque el slot principal la sigue usando.
                            if (modalImageUrl && modalImageUrl.startsWith('blob:') && accion !== 'medir_yolo' && accion !== 'medir_plano') {
                                URL.revokeObjectURL(modalImageUrl);
                                console.log("DEBUG: Old modalImageUrl revocada before new one (non-YOLO from modal):", modalImageUrl);
                            } else if (modalImageUrl && modalImageUrl.startsWith('blob:') && (accion === 'medir_yolo' || accion === 'medir_plano')) {
                                console.log("DEBUG: modalImageUrl (original slot URL) NOT revocada because action is YOLO/Plano from modal:", modalImageUrl);
                            }
                            
                            setModalImageUrl(newUrl); // Siempre actualiza la imagen visible en la modal
                            setModalResultText(null); // Limpia cualquier texto de resultado anterior

                            // El slot en processedSlots NO debe actualizarse por acciones de YOLO/Plano desde el modal.
                            if (currentTargetSlotId && accion !== 'medir_yolo' && accion !== 'medir_plano') { 
                                setProcessedSlots(prevSlots =>
                                    prevSlots.map(slot => {
                                        if (slot.id === currentTargetSlotId) {
                                            if (slot.url && slot.url.startsWith('blob:') && slot.url !== newUrl) {
                                                URL.revokeObjectURL(slot.url);
                                                console.log("DEBUG: Old slot URL revocada during fromModal update (non-YOLO):", slot.url);
                                            }
                                            return { ...slot, file: newProcessedFile, url: newUrl, resultText: null };
                                        }
                                        return slot;
                                    })
                                );
                                console.log(`DEBUG: Slot ${currentTargetSlotId} actualizado con nueva URL de imagen (non-YOLO): ${newUrl}`);
                            } else if (accion === 'medir_yolo' || accion === 'medir_plano') {
                                console.log("DEBUG: medir_yolo/medir_plano desde modal. El slot NO se actualiza, solo la imagen de la modal.");
                                // setModalImageFile(newProcessedFile); // Esta línea ya fue eliminada, lo cual es correcto.
                            }

                        } else if (currentTargetSlotId) { // Si no (llamada no viene de la modal), actualiza el slot en la cuadrícula principal
                            setProcessedSlots(prevSlots =>
                                prevSlots.map(slot => {
                                    if (slot.id === currentTargetSlotId && slot.url && slot.url.startsWith('blob:')) {
                                        URL.revokeObjectURL(slot.url); // Revocar la URL antigua del slot
                                        console.log("DEBUG: Old slot URL revocada:", slot.url);
                                    }
                                    return slot.id === currentTargetSlotId
                                        ? { ...slot, file: newProcessedFile, url: newUrl, resultText: null }
                                        : slot;
                                })
                            );
                        }
                        return newUrl; // Devuelve la URL del Blob para el llamador
                    } catch (error) {
                        const errorMessage = `Error al cargar imagen para ${accion}: ${String(error)}`;
                        console.error(errorMessage);
                        if (fromModal) { // Si la llamada viene de la modal, actualiza el estado de la modal
                            setModalImageUrl(null);
                            setModalResultText(errorMessage);
                        } else if (currentTargetSlotId) { // Si no, actualiza el slot en la cuadrícula principal
                            setProcessedSlots(prevSlots =>
                                prevSlots.map(slot =>
                                    slot.id === currentTargetSlotId
                                        ? { ...slot, file: null, url: null, resultText: errorMessage }
                                        : slot
                                )
                            );
                        }
                        return errorMessage; // Devuelve el error como string
                    }
                }
            } catch (error) {
                const errorMessage = `ERROR general en el procesamiento backend para ${accion}: ${String(error)}`;
                console.error(errorMessage);
                if (fromModal) { // Si la llamada viene de la modal, actualiza el estado de la modal
                    setModalImageUrl(null);
                    setModalResultText(errorMessage);
                } else if (currentTargetSlotId) {
                    setProcessedSlots(prevSlots =>
                        prevSlots.map(slot =>
                            slot.id === currentTargetSlotId
                                ? { ...slot, file: null, url: null, resultText: errorMessage }
                                : slot
                        )
                    );
                }
                return errorMessage; // Devuelve el error como string
            }
        }
    };

    // Función adaptadora para el prop 'Procesar' de BotonesFuncion
    // Ahora es async y devuelve el Promise<string | null> de procesarImagen
    const handleProcesarButton = async (accion: string, sourceFile: File | null = null): Promise<string | null> => {
        return procesarImagen(accion, sourceFile, false); // Llama a procesarImagen con fromModal en false
    };

    const rotarImagen = () => {
        procesarImagen('rotar');
    };

    const procesarTodoAvanzado = async () => {
        const fileToProcess = currentImageFile;
        if (!fileToProcess) {
            console.warn("No hay imagen cargada para procesar todas las opciones avanzadas.");
            return;
        }

        setProcessedSlots(prevSlots =>
            prevSlots.map(slot => {
                if (Object.values(actionToSlotIdMap).includes(slot.id)) {
                    if (slot.url && slot.url.startsWith('blob:')) { // Revocar URLs al iniciar nuevos procesos avanzados
                        URL.revokeObjectURL(slot.url);
                        console.log("DEBUG: Old slot URL revocada during allAdvancedActions:", slot.url);
                    }
                    return { ...slot, file: null, url: null, resultText: 'Iniciando proceso...' };
                }
                return slot;
            })
        );
        console.log("DEBUG: Disparando todos los procesos avanzados.");

        await Promise.all(
            allAdvancedActions.map(accion =>
                procesarImagen(accion, fileToProcess) // No pasamos fromModal aquí, ya que actualiza los slots
            )
        ).catch(error => {
            console.error("Una o varias acciones avanzadas fallaron en Promise.all:", error);
        });

        console.log("DEBUG: Todos los procesos avanzados han sido disparados (y sus promesas resueltas/rechazadas).");
    };

    return (
        <>
            <div className="container">
                <h1>Sube tu archivo
                    <br />Holiiii :3
                </h1>
            </div>

            <div>
                <DropZone onFileSelected={handleFile} />
            </div>
            <br />
            <br />

            <div className="container-img">
                {/* Columna Izquierda: Imagen Original y Controles Básicos */}
                <div className="columna">
                    <h3>Imagen Original</h3><br />
                    <div>
                        {/* Pasa la función adaptadora handleProcesarButton */}
                        <BotonesFuncion Procesar={handleProcesarButton} RotarLocal={rotarImagen} tipoImagen='original' />
                    </div>
                    {/* AÑADIDO: Asigna la clase "imagen-previa-container" al div que envuelve ImagenPrevia */}
                    <div className="imagen-previa-container">
                        <ImagenPrevia ImagenSubir={currentImageUrl} />
                    </div>
                </div>

                {/* Columna Derecha: Opciones Avanzadas y Cuadrícula de Resultados */}
                <div className="columna">
                    <h3>Opciones avanzadas y resultados</h3>

                    <div className="columna-contenido-resultados">
                        <div style={{ marginBottom: '20px', width: '100%', maxWidth: '400px' }}>
                            <BotonesFuncion ProcesarTodoAvanzado={procesarTodoAvanzado} tipoImagen='unico_avanzado' />
                        </div>

                        <div className="grid-resultados">
                            {processedSlots.map(slot => (
                                <div key={slot.id} className="grid-item">
                                    <h4>{slot.id.replace('slot', 'Resultado ')}</h4>
                                    <ResultadoImg
                                        imageResult={slot.resultText}
                                        imageSrc={slot.url}
                                        onClick={() => handleResultClick(slot.url, slot.resultText, slot.file, slot.id)} // AÑADIDO: Pasa slot.id
                                        file={slot.file} // Pasa la prop 'file'
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Renderiza el componente ModalResultado */}
            <ModalResultado
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                imageUrl={modalImageUrl}
                resultText={modalResultText}
                modalImageFile={modalImageFile} // Pasa el File a la modal
                onProcessImage={procesarImagen} // Pasa la función procesarImagen
                key={modalImageUrl || 'modal-closed-' + Date.now()} 
            />
        </>
    );
}

export default App;
