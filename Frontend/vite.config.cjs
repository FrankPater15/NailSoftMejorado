const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react-swc');
const compression = require('vite-plugin-compression');

module.exports = defineConfig(({ command }) => ({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),
  ],
  esbuild: {
    // En producción se quitan los mensajes de depuración (pueden llevar datos de clientes).
    // console.error y console.warn se mantienen para ver fallos reales.
    pure: command === 'build' ? ['console.log', 'console.info', 'console.debug'] : [],
  },
  build: {
    outDir: 'dist',
  },
}));
