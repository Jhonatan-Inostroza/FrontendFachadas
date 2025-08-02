
import '../Estilos/ImagenPrevia.css'


type ImagenPreviaProps = {
  ImagenSubir: string | null;
  // rotation: number;
};



// function ImagenPrevia({ ImagenSubir, rotation }: ImagenPreviaProps) {
//   return (
//     <div className={`preview ${rotation % 180 !== 0 ? 'vertical' : 'horizontal'}`}>
//   {ImagenSubir && (
//     <img
//       src={ImagenSubir}
//       alt="Vista previa"
//       style={{
//         transform: `rotate(${rotation}deg)`,
//         transition: 'transform 0.3s ease',
//         // width: '100%',
//         // height: '100%',
//         // display: 'block'
//       }}
//     />
// //   )}
// </div>
// );
function ImagenPrevia({ ImagenSubir }: ImagenPreviaProps) {
  return (
    // 3. OPCIONAL: Puedes simplificar el className si la lógica 'vertical'/'horizontal'
    //    ya no es relevante sin la rotación CSS. O déjalo si lo usas para otros estilos.
    //    Tu código actual:
    //    <div className={`preview ${rotation % 180 !== 0 ? 'vertical' : 'horizontal'}`}>
    <div className="preview">
      {ImagenSubir && (
        <img
          src={ImagenSubir}
          alt="Vista previa"
          style={{
            // 4. ELIMINAR: Quita la propiedad `transform` y `transition`
            //    La imagen ya vendrá rotada a nivel de píxeles desde App.tsx.
            //    Tu código actual:
            //    transform: `rotate(${rotation}deg)`,
            //    transition: 'transform 0.3s ease',
            // width: '100%', // Puedes mantener estas si las necesitas para el tamaño
            // height: '100%',
            // display: 'block'
          }}
        />
      )}
    </div>
  );
}
export default ImagenPrevia;

