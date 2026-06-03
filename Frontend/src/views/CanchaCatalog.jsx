import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Loader from '../components/Loader.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './CanchaCatalog.css'

export default function CanchaCatalog() {
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // KYC/Postulation States
    const [userProfile, setUserProfile] = useState(null);
    const [showKycModal, setShowKycModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const fetchUserProfile = useCallback(async () => {
        if (!user || !user.id) return;
        try {
            const response = await fetch(`http://localhost:5071/api/v1/users/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setUserProfile(data);
            }
        } catch (err) {
            console.error("Error fetching user profile:", err);
        }
    }, [user]);

    const handleKycSubmit = async (e) => {
        e.preventDefault();
        setUploadError('');
        const fileInput = e.target.querySelector('input[type="file"]');
        const file = fileInput.files[0];
        if (!file) {
            setUploadError('Por favor selecciona un archivo.');
            return;
        }
        if (file.type !== 'application/pdf') {
            setUploadError('Solo se permiten archivos PDF.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const response = await fetch(`http://localhost:5071/api/v1/users/${user.id}/upload-pdf`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                setUploadSuccess(true);
                fetchUserProfile();
            } else {
                const text = await response.text();
                setUploadError(text || 'Error al subir el archivo.');
            }
        } catch (err) {
            console.error(err);
            setUploadError('Error de red al conectar con el servidor.');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (user && user.rol === 'Administrador') {
            navigate('/admin');
        } else if (user) {
            fetchUserProfile();
        }
    }, [user, navigate, fetchUserProfile]);

    useEffect(() => {
        // Actualizado al puerto 5071 del backend
        fetch('http://localhost:5071/api/v1/canchas')
            .then(response => {
                if (!response.ok) throw new Error("No se pudieron cargar las canchas.");
                return response.json();
            })
            .then(data => {
                // Filter out canchas that are in Mantenimiento
                const canchasDisponibles = data.filter(c => c.estado !== 'Mantenimiento');
                setCanchas(canchasDisponibles);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    if (error) {
        return (
            <>
                <Header />
                <div className="container text-center mt-5">
                    <div className="alert alert-danger shadow-sm py-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #dc3545' }}>
                        <h4 className="fw-bold text-danger">Error al conectar con el servidor</h4>
                        <p className="text-secondary">Asegúrate de que el backend esté corriendo en el puerto 5071.</p>
                        <button className="btn btn-outline-danger mt-2" onClick={() => window.location.reload()}>
                            Reintentar
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Header />
                <Loader />
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            {user && userProfile && userProfile.rol === 'Usuario' && (
                <div className="container mt-3 mb-4">
                    <div className="card shadow-sm p-4 text-white" style={{
                        background: 'linear-gradient(135deg, #111d13 0%, #1b4332 100%)',
                        border: '1px solid rgba(149,255,172,0.2)',
                        borderRadius: '16px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                            <div>
                                <h4 className="fw-bold mb-2 text-success" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.25rem' }}>
                                    💼 ¿Eres Profesor o Entrenador?
                                </h4>
                                <p className="mb-0 text-secondary" style={{ fontSize: '0.95rem' }}>
                                    {!userProfile.certificadoPdf ? (
                                        "Postúlate subiendo tu certificado o credencial en formato PDF para dictar clases y entrenamientos en nuestras canchas."
                                    ) : (
                                        "Tu solicitud de validación de credencial está en revisión por la administración."
                                    )}
                                </p>
                            </div>
                            <div>
                                {!userProfile.certificadoPdf ? (
                                    <button 
                                        className="btn btn-success fw-bold px-4 py-2" 
                                        style={{ borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                        onClick={() => {
                                            setUploadError('');
                                            setUploadSuccess(false);
                                            setShowKycModal(true);
                                        }}
                                    >
                                        Postularse
                                    </button>
                                ) : (
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-warning text-dark px-3 py-2 fw-bold" style={{ fontSize: '0.8rem', borderRadius: '6px' }}>
                                            SOLICITUD PENDIENTE
                                        </span>
                                        <a 
                                            href={`http://localhost:5071${userProfile.certificadoPdf}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-success btn-sm fw-bold px-3 py-2"
                                            style={{ borderRadius: '6px' }}
                                        >
                                            Ver PDF
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="container mt-4 cancha-container">
                <h1 className="text-center mb-4 cancha-title fw-bold" style={{ letterSpacing: '2px' }}>CATÁLOGO DE CANCHAS</h1>
                <div className="row justify-content-center">
                    {canchas.map(cancha => (
                        <div key={cancha.id} className="col-12 col-md-6 col-lg-4 mb-4">
                            <div className="card shadow-sm cancha-card" style={{ backgroundColor: '#111d13', border: '1px solid #1b4332' }}>
                                <div className="card-body p-0">
                                    <div style={{ position: 'relative' }}>
                                        <img 
                                            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                                            alt={cancha.superficie} 
                                            className="card-img-top"
                                            style={{ height: '200px', objectFit: 'cover', opacity: '0.8' }}
                                        />
                                        <span className={`badge position-absolute top-0 end-0 m-3 ${cancha.estado === 'Disponible' ? 'bg-success' : 'bg-warning'}`}>
                                            {cancha.estado}
                                        </span>
                                    </div>
                                    <div className="p-3">
                                        <h5 className="card-title fw-bold text-white mb-1">{cancha.superficie}</h5>
                                        <p className="text-secondary small mb-3">Capacidad: {cancha.capacidad} jugadores</p>
                                        <Link to={`/cancha/${cancha.id}`}>
                                            <button className="btn btn-success w-100 fw-bold" style={{ borderRadius: '8px' }}>
                                                RESERVAR AHORA
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showKycModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div className="modal-content-kyc" style={{
                        background: '#0d160f',
                        border: '2px solid #1b4332',
                        borderRadius: '20px',
                        padding: '30px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 className="fw-bold text-success m-0" style={{ letterSpacing: '1px' }}>POSTULARSE COMO STAFF</h3>
                            <button 
                                type="button"
                                className="btn-close btn-close-white" 
                                onClick={() => setShowKycModal(false)}
                                style={{ boxShadow: 'none' }}
                            ></button>
                        </div>

                        <p className="text-secondary small mb-4">
                            Por favor, selecciona un archivo en formato PDF que certifique tu rol como Profesor de Educación Física o Entrenador Deportivo habilitado.
                        </p>

                        {uploadError && (
                            <div className="alert alert-danger p-2 mb-3" style={{ fontSize: '0.85rem', backgroundColor: 'rgba(220,53,69,0.1)', borderColor: '#dc3545', color: '#ea868f' }}>
                                ⚠️ {uploadError}
                            </div>
                        )}

                        {uploadSuccess && (
                            <div className="alert alert-success p-2 mb-3" style={{ fontSize: '0.85rem', backgroundColor: 'rgba(25,135,84,0.1)', borderColor: '#198754', color: '#75b798' }}>
                                ✅ ¡Certificado subido con éxito! Tu postulación ha sido enviada.
                            </div>
                        )}

                        {!uploadSuccess && (
                            <form onSubmit={handleKycSubmit}>
                                <div className="mb-4">
                                    <label className="form-label text-secondary fw-bold small" style={{ textTransform: 'uppercase' }}>
                                        Certificado (Formato PDF)
                                    </label>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        accept="application/pdf"
                                        required
                                        style={{
                                            backgroundColor: '#070c08',
                                            border: '1px solid #1b4332',
                                            color: '#fff',
                                            borderRadius: '8px'
                                        }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file && file.type !== 'application/pdf') {
                                                setUploadError('El archivo debe ser un PDF.');
                                            } else {
                                                setUploadError('');
                                            }
                                        }}
                                    />
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary fw-bold" 
                                        onClick={() => setShowKycModal(false)}
                                        disabled={uploading}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-success fw-bold"
                                        disabled={uploading}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        {uploading ? 'Subiendo...' : 'Enviar Solicitud'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {uploadSuccess && (
                            <div className="d-flex justify-content-end">
                                <button 
                                    className="btn btn-success fw-bold" 
                                    onClick={() => setShowKycModal(false)}
                                    style={{ borderRadius: '8px' }}
                                >
                                    Entendido
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
