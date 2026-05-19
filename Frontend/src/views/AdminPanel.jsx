import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AdminPanel() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [canchas, setCanchas] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        superficie: '',
        capacidad: 10,
        tipoCancha: 'Futbol5'
    });

    // Redirigir si no es admin
    useEffect(() => {
        if (!user || user.rol !== 'Administrador') {
            navigate('/');
        }
        fetchCanchas();
    }, [user, navigate]);

    const fetchCanchas = () => {
        fetch('http://localhost:5071/api/v1/canchas')
            .then(res => res.json())
            .then(data => setCanchas(data));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch('http://localhost:5071/api/v1/canchas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert("Cancha creada con éxito");
            setShowForm(false);
            fetchCanchas();
        }
    };

    return (
        <>
            <Header />
            <div className="container mt-4 mb-5 fade-in-up">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="fw-bold text-white">PANEL DE CONTROL</h1>
                    <button 
                        className="btn btn-success fw-bold" 
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'CANCELAR' : 'NUEVA CANCHA'}
                    </button>
                </div>

                {showForm && (
                    <div className="card p-4 mb-4 shadow" style={{ backgroundColor: '#111d13', border: '1px solid #1b4332' }}>
                        <h4 className="text-white mb-3">Registrar Nueva Cancha</h4>
                        <form onSubmit={handleSubmit} className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label text-secondary small">SUPERFICIE</label>
                                <input 
                                    type="text" className="form-control bg-dark text-white border-secondary" 
                                    placeholder="Ej: Sintético Pro"
                                    value={formData.superficie}
                                    onChange={(e) => setFormData({...formData, superficie: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label text-secondary small">TIPO</label>
                                <select 
                                    className="form-select bg-dark text-white border-secondary"
                                    value={formData.tipoCancha}
                                    onChange={(e) => setFormData({...formData, tipoCancha: e.target.value})}
                                >
                                    <option value="Futbol5">Fútbol 5</option>
                                    <option value="Futbol7">Fútbol 7</option>
                                    <option value="Futbol11">Fútbol 11</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label text-secondary small">CAPACIDAD</label>
                                <input 
                                    type="number" className="form-control bg-dark text-white border-secondary" 
                                    value={formData.capacidad}
                                    onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="col-12 text-end">
                                <button type="submit" className="btn btn-success px-5 fw-bold">GUARDAR CANCHA</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card shadow" style={{ backgroundColor: '#111d13', border: '1px solid #1b4332' }}>
                    <div className="table-responsive">
                        <table className="table table-dark table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Superficie</th>
                                    <th>Estado</th>
                                    <th className="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {canchas.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.id}</td>
                                        <td>{c.superficie}</td>
                                        <td><span className="badge bg-success">{c.estado}</span></td>
                                        <td className="text-end">
                                            <button className="btn btn-sm btn-outline-warning me-2">Editar</button>
                                            <button className="btn btn-sm btn-outline-danger">Borrar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
