import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Tipografías de la marca (autoalojadas): Inter para texto, Fraunces para títulos
import '@fontsource-variable/inter'
import '@fontsource-variable/fraunces'
// Bootstrap reducido para las pantallas aún no rediseñadas; va antes de Tailwind
// para que, ante el mismo selector, gane el sistema de diseño
import './styles/bootstrap-legado.scss'
import './tailwind.css'

import { aplicarTemaAlertas } from './util/temaAlertas'
import { AuthProvider } from './context/AuthContext'

// Estilo del sistema de diseño en todas las alertas emergentes
aplicarTemaAlertas()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
