// const { defineConfig } = require('vite');
// const react = require('@vitejs/plugin-react-swc');


// module.exports = defineConfig({
//   plugins: [react(),]
// });


const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react-swc');
const compression = require('vite-plugin-compression');

module.exports = defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    })
  ],
  css: {
    preprocessorOptions: {
      // Silencia los avisos de Sass que vienen del código de Bootstrap, no del nuestro
      scss: { quietDeps: true, silenceDeprecations: ['mixed-decls'] },
    },
  },
  build: {
    outDir: 'dist', // asegúrate de que sea 'dist'
  }
});
