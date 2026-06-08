import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Loader from '../../components/Loader';
import { ligas as ligasApi, torneos as torneosApi, equipos as equiposApi, users as usersApi } from '../../services/api.js';
import './FormularioEquipo.css';

export default function FormularioEquipo() {
    const { tipo, id } = useParams(); // tipo = 'ligas' | 'torneos'
    const navigate     = useNavigate();
    const { user }     = useAuth();

    const [comp, setComp]           = useState(null);
    const [misEquipos, setMisEquipos] = useState([]);
    const [usuarios, setUsuarios]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState(null);

    // Modos: 'nuevo' | 'existente'
    const [modo, setModo]           = useState('nuevo');
    const [equipoId, setEquipoId]   = useState('');
    const [nombre, setNombre]       = useState('');
    const [categoria, setCategoria] = useState('Primera');
    const [jugadores, setJugadores] = useState([]);

    const api = tipo === 'ligas' ? ligasApi : torneosApi;

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        Promise.all([
            api.getById(id),
            equiposApi.getAll(),
            usersApi.getAll()
        ])
            .then(([c, eq, us]) => {
                setComp(c);
                setMisEquipos(eq.filter(e => e.capitanId === user.id || e.capitan?.includes(user.nombre)));
                setUsuarios(us.filter(u => u.id !== user.id));
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [id, tipo, user]);

    const toggleJugador = (uid) => {
        setJugadores(prev =>
            prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (modo === 'nuevo' && !nombre.trim()) {
            setError('Ingresá el nombre del equipo');
            return;
        }
        setError(null);
        setSubmitting(true);

        try {
            const payload = modo === 'existente'
                ? { equipoId: parseInt(equipoId) }
                : {
                    nombreEquipo: nombre.trim(),
                    categoria,
                    capitanId:   user.id,
                    jugadoresIds: jugadores
                  };

            const result = await api.inscribir(id, payload);

            if (result.cobroId && result.montoMatricula > 0) {
                navigate(`/pago/${result.cobroId}`);
            } else {
                navigate(`/competencias/${tipo}/${id}/fixture`);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)  return <><Header /><Loader /></>;
    if (!comp)    return null;

    const nombreComp = comp.nombre;
    const costo      = comp.costoInscripcion ?? 0;

    return (
        <>
            <Header />
            <main className="form-equipo fade-in-up">
                <div className="form-equipo__card">
                    <button className="btn-back" onClick={() => navigate(-1)}>← Volver</button>
                    <h2>Inscribir equipo</h2>
                    <p className="form-equipo__comp">en <strong>{nombreComp}</strong></p>

                    {error && <div className="form-equipo__error">{error}</div>}

                    {/* Modo: nuevo equipo o equipo existente */}
                    <div className="modo-tabs">
                        <button
                            className={`modo-tab ${modo === 'nuevo' ? 'modo-tab--active' : ''}`}
                            onClick={() => setModo('nuevo')}
                        >
                            ➕ Crear nuevo equipo
                        </button>
                        {misEquipos.length > 0 && (
                            <button
                                className={`modo-tab ${modo === 'existente' ? 'modo-tab--active' : ''}`}
                                onClick={() => setModo('existente')}
                            >
                                🏅 Usar equipo existente
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {modo === 'existente' ? (
                            <div className="form-field">
                                <label>Seleccioná tu equipo</label>
                                <select
                                    value={equipoId}
                                    onChange={e => setEquipoId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Elegir --</option>
                                    {misEquipos.map(eq => (
                                        <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <>
                                <div className="form-field">
                                    <label>Nombre del equipo</label>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={e => setNombre(e.target.value)}
                                        placeholder="Ej: Los Pumas FC"
                                        maxLength={60}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Categoría</label>
                                    <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                                        <option value="Primera">Primera</option>
                                        <option value="Segunda">Segunda</option>
                                        <option value="Tercera">Tercera</option>
                                        <option value="Libre">Libre</option>
                                    </select>
                                </div>

                                {usuarios.length > 0 && (
                                    <div className="form-field">
                                        <label>Agregar jugadores (opcional)</label>
                                        <div className="jugadores-list">
                                            {usuarios.map(u => (
                                                <label key={u.id} className="jugador-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={jugadores.includes(u.id)}
                                                        onChange={() => toggleJugador(u.id)}
                                                    />
                                                    <span>{u.nombre} {u.apellido}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Resumen de costo */}
                        <div className="form-equipo__resumen">
                            <span>Matrícula:</span>
                            <strong>
                                {costo > 0
                                    ? `$${Number(costo).toLocaleString('es-AR')}`
                                    : 'Gratuita'}
                            </strong>
                        </div>
                        {costo > 0 && (
                            <p className="form-equipo__nota">
                                Vas a ser redirigido al pago para confirmar la inscripción.
                            </p>
                        )}

                        <button type="submit" className="btn-confirmar" disabled={submitting}>
                            {submitting ? 'Procesando...' : costo > 0 ? 'Continuar al pago →' : 'Confirmar inscripción'}
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </>
    );
}
