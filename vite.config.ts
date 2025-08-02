import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  


   resolve: {
    alias: {
      '@Vista': path.resolve(__dirname, 'src/Vista'),
      '@Modelo': path.resolve(__dirname, 'src/Modelo'),
      '@Estilos': path.resolve(__dirname, 'src/Estilos'),
    },
  },



  
})
