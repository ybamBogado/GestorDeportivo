import React from 'react'
import './Navbar.css'

export default function Navbar() {
  return (
    <header>
      <div className="afa-topbar" />
      <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
        <div className="container">
          <a className="navbar-brand" href="/">
            <div className="logo">
              <img src="/GolAhora.png" alt="logo" height="34" />
            </div>
            <span className="brand-text">Gol Ahora</span>
          </a>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
                  aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
              <li className="nav-item"><a className="nav-link" href="/">Inicio</a></li>
              <li className="nav-item"><a className="nav-link" href="/cancha/1">Canchas</a></li>
              <li className="nav-item"><a className="nav-link" href="/admin">Admin</a></li>
              <li className="nav-item"><a className="btn btn-outline-afa ms-3" href="/login">Acceder</a></li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}