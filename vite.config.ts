import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // Necesario para abrir la app desde el móvil en la misma wifi durante el
    // desarrollo. Sin esto, Vite solo escucha en localhost y el teléfono no
    // puede conectarse.
    host: true,
  },

  build: {
    rollupOptions: {
      output: {
        // three.js + drei + postprocessing son casi todo el peso. Separarlos
        // del código de la app hace que el navegador pueda cachearlos entre
        // despliegues: al cambiar un texto no hay que volver a bajar 1 MB.
        //
        // Rolldown (el empaquetador de Vite 8) solo acepta la forma de
        // función; el objeto {nombre: [paquetes]} da "manualChunks is not a
        // function".
        manualChunks(id: string) {
          // En Windows las rutas llegan con barras invertidas; sin normalizar,
          // ninguna comprobación de '/three/' llega a coincidir.
          const path = id.replace(/\\/g, '/');
          if (!path.includes('node_modules')) return;
          if (path.includes('node_modules/three/')) return 'three';
          if (path.includes('@react-three') || path.includes('node_modules/postprocessing/')) return 'r3f';
          if (path.includes('framer-motion') || path.includes('motion-dom')) return 'motion';
        },
      },
    },
    // El trozo de three + drei ronda 1.2 MB (330 kB comprimido) y es lo
    // esperado en una app con ocho escenas 3D. Lo que importa es que está
    // separado del código de la app: al cambiar un texto, el navegador
    // reutiliza este archivo en vez de volver a bajarlo.
    chunkSizeWarningLimit: 1300,
  },
})
