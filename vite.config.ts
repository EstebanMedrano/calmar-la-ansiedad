import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * GitHub Pages no sabe nada de rutas de cliente: al entrar directamente en
 * /calmar-la-ansiedad/game/puzzle busca ese archivo, no lo encuentra y sirve su
 * propia página de error. Pero sí sirve el 404.html del sitio si existe, y como
 * este es una copia exacta de index.html, React Router recoge la URL y muestra
 * la pantalla correcta.
 *
 * (public/_redirects hace lo mismo, pero solo lo entiende Netlify.)
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallback()],
  base: '/calmar-la-ansiedad/',

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
