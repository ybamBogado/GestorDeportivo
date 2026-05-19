import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import CanchaCatalog from './views/CanchaCatalog.jsx'
import CanchaDetail from './views/CanchaDetail.jsx'
import Login from './views/Login.jsx'
import Register from './views/Register.jsx'
import AdminPanel from './views/AdminPanel.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CanchaCatalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cancha/:canchaId" element={<CanchaDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
