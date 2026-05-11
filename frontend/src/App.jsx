import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Animales from './pages/Animales.jsx'
import Cultivos from './pages/Cultivos.jsx'
import Lotes from './pages/Lotes.jsx'
import Finanzas from './pages/Finanzas.jsx'
import Inventario from './pages/Inventario.jsx'
import Estadisticas from './pages/Estadisticas.jsx'
import Operaciones from './pages/Operaciones.jsx'
import Planeacion from './pages/Planeacion.jsx'
import Exportar from './pages/Exportar.jsx'
import Configuracion from './pages/Configuracion.jsx'
import Avicola from './pages/Avicola.jsx'
import Porcicola from './pages/Porcicola.jsx'
import Apicultura from './pages/Apicultura.jsx'
import Equinos from './pages/Equinos.jsx'
import CaninosFelinos from './pages/CaninosFelinos.jsx'
import PequenosMamiferos from './pages/PequenosMamiferos.jsx'
import EspeciesMenu from './pages/EspeciesMenu.jsx'
import FichaAnimal from './pages/FichaAnimal.jsx'
import FichaCultivo from './pages/FichaCultivo.jsx'
import GruposManejo from './pages/GruposManejo.jsx'
import Contabilidad from './pages/Contabilidad.jsx'
import Nomina from './pages/Nomina.jsx'
import SST from './pages/SST.jsx'
import Trabajadores from './pages/Trabajadores.jsx'
import Consolidado from './pages/Consolidado.jsx'
import AdminSistema from './pages/AdminSistema.jsx'
import Alertas from './pages/Alertas.jsx'
import Plantillas from './pages/Plantillas.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="animales" element={<Animales />} />
          <Route path="cultivos" element={<Cultivos />} />
          <Route path="lotes" element={<Lotes />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="operaciones" element={<Operaciones />} />
          <Route path="planeacion" element={<Planeacion />} />
          <Route path="exportar" element={<Exportar />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="especies" element={<EspeciesMenu />} />
          <Route path="avicola" element={<Avicola />} />
          <Route path="porcicola" element={<Porcicola />} />
          <Route path="apicultura" element={<Apicultura />} />
          <Route path="equinos" element={<Equinos />} />
          <Route path="caninos-felinos" element={<CaninosFelinos />} />
          <Route path="pequenos-mamiferos" element={<PequenosMamiferos />} />
          <Route path="ficha-animal" element={<FichaAnimal />} />
          <Route path="cultivos/ficha" element={<FichaCultivo />} />
          <Route path="contabilidad" element={<Contabilidad />} />
          <Route path="nomina" element={<Nomina />} />
          <Route path="sst" element={<SST />} />
          <Route path="grupos-manejo" element={<GruposManejo />} />
          <Route path="trabajadores" element={<Trabajadores />} />
          <Route path="consolidado" element={<Consolidado />} />
          <Route path="admin-sistema" element={<AdminSistema />} />
          <Route path="plantillas" element={<Plantillas />} />
          <Route path="alertas" element={<Alertas />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
