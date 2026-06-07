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
              <Route path="/pago/:cobroId"     element={<Pago />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
