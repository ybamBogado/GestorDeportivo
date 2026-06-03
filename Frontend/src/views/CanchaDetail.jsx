import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import './CanchaDetail.css';

export default function CanchaDetail() {
    const { canchaId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [cancha, setCancha] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para la reserva
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState(null);

    const timeSlots = [
        "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
    ];

    const getEndTime = (time) => {
        const hour = parseInt(time.split(':')[0]);
        if (hour >= 23) return '23:59';
        return `${String(hour + 1).padStart(2, '0')}:00`;
    };

    useEffect(() => {
        fetch(`http://localhost:5071/api/v1/canchas/${canchaId}`)
            .then(res => {
                if (!res.ok) throw new Error("No se pudo cargar la cancha");
                return res.json();
            })
            .then(data => {
                setCancha(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Error al cargar los detalles");
                setLoading(false);
            });
    }, [canchaId]);

    const handleConfirmReserva = async () => {
        if (!user) {
            setError("Debes iniciar sesión para reservar.");
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        if (!selectedTime) {
            setError("Por favor, selecciona un horario.");
            return;
        }

        const command = { 
            canchaId: parseInt(canchaId), 
            personaId: user.id,
            fecha: selectedDate,
            horaInicio: selectedTime,
            horaFin: getEndTime(selectedTime),
            precio: 4500,
            pago: false
        };

        try {
            const response = await fetch('http://localhost:5071/api/v1/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command)
            });

            if (response.ok) {
                alert(`¡Reserva confirmada para el ${selectedDate} a las ${selectedTime}!`);
                navigate('/');
            } else {
                setError("La reserva no pudo procesarse (Servicio de Reservas en mantenimiento).");
            }
        } catch {
            setError("Error de conexión con el sistema de reservas.");
        }
    };

    if (loading) return <><Header /><Loader /><Footer /></>;

    return (
        <>
            <Header />
            <div className="container mt-4 detail-container fade-in-up">
                <div className="card detail-card shadow-lg p-0" style={{ backgroundColor: '#111d13', border: '1px solid #1b4332', overflow: 'hidden' }}>
                    <div className="row g-0">
                        {/* Lateral Izquierdo: Info de la Cancha */}
                        <div className="col-lg-5" style={{ backgroundColor: '#050a06', borderRight: '1px solid #1b4332' }}>
                            <img 
                                src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                                className="img-fluid" 
                                alt="Cancha"
                                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                            />
                            <div className="p-4">
                                <h2 className="fw-bold text-white mb-2">{cancha?.superficie}</h2>
                                <span className="badge bg-success mb-3">Disponible</span>
                                <p className="text-secondary small">
                                    Esta cancha cuenta con iluminación LED de alta potencia, vestuarios premium y estacionamiento vigilado. 
                                    Ideal para partidos de {cancha?.capacidad} jugadores.
                                </p>
                                <hr style={{ borderColor: '#1b4332' }} />
                                <div className="d-flex justify-content-between text-white small">
                                    <span>Capacidad:</span>
                                    <span className="fw-bold">{cancha?.capacidad} Jugadores</span>
                                </div>
                            </div>
                        </div>

                        {/* Lateral Derecho: Proceso de Reserva */}
                        <div className="col-lg-7 p-4 p-md-5">
                            <h3 className="fw-bold text-white mb-4" style={{ letterSpacing: '1px' }}>CONFIGURÁ TU TURNO</h3>
                            
                            {error && <div className="alert alert-danger py-2 small mb-4">{error}</div>}

                            {/* 1. Seleccionar Fecha */}
                            <div className="mb-4">
                                <label className="form-label text-secondary small fw-bold">1. SELECCIONA EL DÍA</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    style={{ backgroundColor: '#050a06', border: '1px solid #1b4332', color: 'white' }}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* 2. Seleccionar Horario */}
                            <div className="mb-4">
                                <label className="form-label text-secondary small fw-bold">2. SELECCIONA EL HORARIO</label>
                                <div className="row g-2">
                                    {timeSlots.map(time => (
                                        <div key={time} className="col-4 col-md-3">
                                            <div 
                                                onClick={() => setSelectedTime(time)}
                                                className={`text-center p-2 rounded cursor-pointer transition-all ${selectedTime === time ? 'bg-success text-white shadow' : 'bg-dark text-secondary'}`}
                                                style={{ border: '1px solid #1b4332', cursor: 'pointer' }}
                                            >
                                                {time}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Resumen y Confirmación */}
                            <div className="mt-5 p-3 rounded" style={{ backgroundColor: '#050a06', border: '1px dashed #1b4332' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-secondary small">Total a pagar:</span>
                                    <span className="text-success fw-bold fs-4">$4.500</span>
                                </div>
                                <button 
                                    className="btn btn-success btn-lg w-100 fw-bold mt-2 py-3"
                                    onClick={handleConfirmReserva}
                                    style={{ borderRadius: '10px', letterSpacing: '1px' }}
                                >
                                    {selectedTime ? `RESERVAR PARA LAS ${selectedTime}` : 'ELIJA UN HORARIO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
