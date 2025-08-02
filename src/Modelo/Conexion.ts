export const enviarImagenAlBackend = async (file: File, accion: string): Promise<Response | null> =>{
  const formData = new FormData();
  // formData.append('imagen', file);
  // formData.append('accion', accion);

  // try {
  //   const response = await fetch('http://127.0.0.1:5000/', {
  //     method: 'POST',
  //     body: formData,
  //   });
  formData.append('image', file);
  formData.append('action', accion);

  try {
    const response = await fetch('https://787fae3317cd.ngrok-free.app/api/procesar-imagen/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest', // Añade esta línea
        // Si necesitaras CSRF: 'X-CSRFToken': getCookie('csrftoken'),
    },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en la petición al backend: ${response.status} - ${errorText}`);
      // Considera usar un sistema de notificación en lugar de alert() en una app real
      alert(`Error al procesar la imagen en el servidor: ${errorText}`);
      return null;
    }

    return response;
  } catch (error) {
    console.error('Error al conectar con el backend:', error);
    return null;
  }
};
