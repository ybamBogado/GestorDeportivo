import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { equipos as equiposApi } from '../services/api.js';
import './EquipoDetalle.css';

export default function EquipoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useToast();

    const [equipo, setEquipo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        equiposApi.getById(id)
            .then(setEquipo)
            .catch((error) => notify(error.message, 'error'))
            .finally(() => setLoading(false));
    }, [id, notify]);

    const yaInscripto = useMemo(() => {
        if (!user || !equipo) return false;
        return equipo.capitanId === user.id || (equipo.miembros ?? []).some((miembro) => miembro.id === user.id);
    }, [equipo, user]);

    const totalMiembros = useMemo(() => {
        if (!equipo) return 0;
        const miembros = equipo.miembros ?? [];
        const capitanCuenta = equipo.capitan && !miembros.some((miembro) => miembro.id === equipo.capitan.id) ? 1 : 0;
        return miembros.length + capitanCuenta;
    }, [equipo]);

    const handleJoin = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setJoining(true);
        try {
            await equiposApi.inscribirse(id, { usuarioId: user.id });
            notify('Te sumaste al equipo correctamente', 'success');
            const updated = await equiposApi.getById(id);
            setEquipo(updated);
        } catch (error) {
            notify(error.message, 'error');
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <><Header /><Loader /><Footer /></>;
    if (!equipo) return <><Header /><div className="equipo-detail-empty">Equipo no encontrado.</div><Footer /></>;

    return (
        <>
            <Header />
            <main className="equipo-detail-page fade-in-up">
                <section className="equipo-detail-card">
                    <button className="equipo-detail-back" onClick={() => navigate(-1)}>Volver</button>

                    <div className="equipo-detail-hero">
                        <div>
                            <span className="equipo-detail-badge">{equipo.categoria || 'Libre'}</span>
                            <h1>{equipo.nombre}</h1>
                            <p>{equipo.estado}</p>
                        </div>

                        <div className="equipo-detail-cta">
                            <div>
                                <span>Miembros actuales</span>
                                <strong>{totalMiembros}</strong>
                            </div>
                            <button
                                className="equipo-detail-join"
                                onClick={handleJoin}
                                disabled={joining || yaInscripto}
                            >
                                {yaInscripto ? 'Ya formas parte' : joining ? 'Inscribiendo...' : 'Inscribirse al equipo'}
                            </button>
                        </div>
                    </div>

                    <div className="equipo-detail-grid">
                        <article className="equipo-detail-panel">
                            <h2>Capitán</h2>
                            {equipo.capitan ? (
                                <div className="equipo-member-card equipo-member-card--captain">
                                    <strong>{equipo.capitan.nombre} {equipo.capitan.apellido}</strong>
                                    <span>{equipo.capitan.email}</span>
                                </div>
                            ) : (
                                <p className="equipo-detail-muted">Sin capitán asignado.</p>
                            )}
                        </article>

                        <article className="equipo-detail-panel">
                            <h2>Miembros actuales</h2>
                            {equipo.miembros?.length ? (
                                <div className="equipo-member-list">
                                    {equipo.miembros.map((miembro) => (
                                        <div key={miembro.id} className="equipo-member-card">
                                            <strong>{miembro.nombre} {miembro.apellido}</strong>
                                            <span>{miembro.email}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="equipo-detail-muted">Todavía no hay jugadores anotados.</p>
                            )}
                        </article>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
