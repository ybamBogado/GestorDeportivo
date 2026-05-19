import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer-bg border-top border-secondary mt-5 py-5">
            <div className="container">
                <div className="row text-center text-md-start">
                    
                    {/* Columna 1: Redes */}
                    <div className="col-12 col-md-4 mb-4">
                        <h5 className="text-white fw-bold mb-3">Gol Ahora</h5>
                        <img src="/GolAhora.png" alt="Gol Ahora Logo" className="footer-logo mb-3" />
                        <div className="d-flex justify-content-center justify-content-md-start gap-3">
                            <a href="#" className="social-icon"><i className="bi bi-facebook"></i></a>
                            <a href="#" className="social-icon"><i className="bi bi-instagram"></i></a>
                            <a href="#" className="social-icon"><i className="bi bi-twitter-x"></i></a>
                            <a href="#" className="social-icon"><i className="bi bi-linkedin"></i></a>
                        </div>
                    </div>

                    <div className="col-12 col-md-4 mb-4">
                        <h6 className="text-white fw-bold mb-3">Información Legal</h6>
                        <ul className="list-unstyled">
                            <li><a href="#" className="footer-link">Términos y Condiciones</a></li>
                            <li><a href="#" className="footer-link">Política de Privacidad</a></li>
                            <li><a href="#" className="footer-link">Libro de Quejas Online</a></li>
                        </ul>
                    </div>

                    <div className="col-12 col-md-4 mb-4">
                        <h6 className="text-white fw-bold mb-3">Gestión</h6>
                        <ul className="list-unstyled">
                            <li><Link to="/login" className="footer-link">Login</Link></li>
                            <li><a href="#" className="footer-link">Contacto RRHH</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-top border-secondary mt-4 pt-3 text-center">
                    <p className="text-white-50 small mb-0">
                        &copy; {new Date().getFullYear()} Gol Ahora. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
