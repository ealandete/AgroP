import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/charts/styles.css'
import '@mantine/dropzone/styles.css'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import App from './App.jsx'
import { AuthProvider } from './store/AuthContext.jsx'

const theme = createTheme({
  primaryColor: 'green',
  colors: {
    green: [
      '#e8f5e9','#c8e6c9','#a5d6a7','#81c784','#66bb6a',
      '#4caf50','#43a047','#388e3c','#2e7d32','#1b5e20',
    ],
  },
  fontFamily: 'Inter, system-ui, sans-serif',
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <AuthProvider>
        <App />
      </AuthProvider>
    </MantineProvider>
  </StrictMode>,
)
