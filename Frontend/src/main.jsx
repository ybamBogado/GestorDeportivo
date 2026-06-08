import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastContainer } from './components/Toast.jsx'
import './index.css'
import CanchaCatalog from './views/CanchaCatalog.jsx'
import CanchaDetail from './views/CanchaDetail.jsx'
import Login from './views/Login.jsx'
import Register from './views/Register.jsx'
import AdminPanel from './views/AdminPanel.jsx'
import Pago from './views/Pago.jsx'
import EmployeePanel from './views/EmployeePanel.jsx'
import TrainerPanel from './views/TrainerPanel.jsx'
import UserPortal from './views/UserPortal.jsx'
import SelectCancha from './views/SelectCancha.jsx'
import EquipoDetalle from './views/EquipoDetalle.jsx'

// Competencias
import PortalCompetencias from './views/Competencias/PortalCompetencias.jsx'
import DetalleCompetencia from './views/Competencias/DetalleCompetencia.jsx'
import FormularioEquipo   from './views/Competencias/FormularioEquipo.jsx'

// Legal
import TerminosCondiciones from './views/Legal/TerminosCondiciones.jsx'
import PoliticaPrivacidad  from './views/Legal/PoliticaPrivacidad.jsx'
import LibroQuejas         from './views/Legal/LibroQuejas.jsx'

// Gestión
import ContactoRRHH from './views/Gestion/ContactoRRHH.jsx'

// Redes sociales (simuladas)
import FacebookPage  from './views/Social/FacebookPage.jsx'
import InstagramPage from './views/Social/InstagramPage.jsx'
import TwitterPage   from './views/Social/TwitterPage.jsx'
import LinkedInPage  from './views/Social/LinkedInPage.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"                  element={<CanchaCatalog />} />
              <Route path="/login"             element={<Login />} />
              <Route path="/register"          element={<Register />} />
              <Route path="/cancha/:canchaId"  element={<CanchaDetail />} />
              <Route path="/admin"             element={<AdminPanel />} />
              <Route path="/employee"          element={<EmployeePanel />} />
              <Route path="/trainer"           element={<TrainerPanel />} />
              <Route path="/my-portal"         element={<UserPortal />} />
              <Route path="/select-cancha"     element={<SelectCancha />} />
              <Route path="/pago/:cobroId"     element={<Pago />} />
              <Route path="/equipos/:id"       element={<EquipoDetalle />} />

              {/* Competencias */}
              <Route path="/competencias"                              element={<PortalCompetencias />} />
              <Route path="/competencias/:tipo/:id/fixture"            element={<DetalleCompetencia />} />
              <Route path="/competencias/:tipo/:id/inscribir"          element={<FormularioEquipo />} />

              {/* Legal */}
              <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
              <Route path="/politica-privacidad"  element={<PoliticaPrivacidad />} />
              <Route path="/libro-quejas"         element={<LibroQuejas />} />

              {/* Gestión */}
              <Route path="/contacto-rrhh" element={<ContactoRRHH />} />

              {/* Redes sociales simuladas */}
              <Route path="/social/facebook"  element={<FacebookPage />} />
              <Route path="/social/instagram" element={<InstagramPage />} />
              <Route path="/social/twitter"   element={<TwitterPage />} />
              <Route path="/social/linkedin"  element={<LinkedInPage />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
