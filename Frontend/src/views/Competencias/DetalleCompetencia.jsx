import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Loader from '../../components/Loader';
import { ligas as ligasApi, torneos as torneosApi } from '../../services/api.js';
import './DetalleCompetencia.css';

export default function DetalleCompetencia() {
    const { tipo, id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const api = tipo === 'ligas' ? ligasApi : torneosApi;

    useEffect(() => {
        Promise.all([api.getById(id), api.getFixtures(id)])
            .then(([d, f]) => { setData(d); setFixtures(f); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [id, tipo]);

    const formatFecha = (iso) =>
        iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    if (loading) return <><Header /><Loader /></>;
    if (error) return <><Header /><div className="det-error">{error}</div><Footer /></>;
    if (!data) return null;

    const abierta = data.estado === 'Abierta' || data.estado === 'Abierto';
    const cupoUsado = (data.inscripciones ?? []).filter(i => i.estado === 'Confirmado').length;
    const cupoLibre = (data.cupoEquipos ?? 0) - cupoUsado;

    const isElimination = tipo === 'torneos' && (
        data.modalidad?.toLowerCase().includes('eliminacion') ||
        data.modalidad?.toLowerCase().includes('copa') ||
        data.formato?.toLowerCase().includes('eliminacion') ||
        data.formato?.toLowerCase().includes('copa')
    );

    const getRoundName = (f) => {
        if (!isElimination) return `Fecha ${f.numero}`;
        const matchCount = f.partidos?.length || 0;
        if (matchCount === 1) return 'Final';
        if (matchCount === 2) return 'Semifinal';
        if (matchCount === 4) return 'Cuartos de Final';
        if (matchCount === 8) return 'Octavos de Final';
        return `Ronda de ${matchCount * 2}`;
    };

    return (
        <>
            <Header />
            <main className="det-comp fade-in-up">
                <div className="det-comp__header">
                    <button className="btn-back" onClick={() => navigate('/competencias')}>← Volver</button>
                    <div>
                        <span className={`comp-badge comp-badge--${abierta ? 'open' : 'closed'}`}>{data.estado}</span>
                        <h1>{data.nombre}</h1>
                        {tipo === 'torneos' && data.premioUSD > 0 && (
                            <p className="det-premio"><i className="bi bi-award-fill"></i> Premio: <strong>${data.premioUSD} USD</strong></p>
                        )}
                    </div>
                </div>

                <div className="det-comp__body">
                    <div className="det-info-grid">
                        <div className="det-info-item">
                            <span>Categoría</span>
                            <strong>{data.categoria || '-'}</strong>
                        </div>
                        <div className="det-info-item">
                            <span>Inicio</span>
                            <strong>{formatFecha(data.fechaInicio)}</strong>
                        </div>
                        <div className="det-info-item">
                            <span>Fin</span>
                            <strong>{formatFecha(data.fechaFin)}</strong>
                        </div>
                        <div className="det-info-item">
                            <span>Cupo</span>
                            <strong>{cupoUsado} / {data.cupoEquipos} equipos</strong>
                        </div>
                        <div className="det-info-item">
                            <span>Matrícula</span>
                            <strong>{data.costoInscripcion > 0 ? `$${Number(data.costoInscripcion).toLocaleString('es-AR')}` : 'Gratuita'}</strong>
                        </div>
                        {tipo === 'torneos' && (
                            <div className="det-info-item">
                                <span>Modalidad</span>
                                <strong>{data.modalidad || data.formato || '-'}</strong>
                            </div>
                        )}
                    </div>

                    {data.reglamento && (
                        <div className="det-reglamento">
                            <h3><i className="bi bi-card-list"></i> Reglamento</h3>
                            <p>{data.reglamento}</p>
                        </div>
                    )}

                    {abierta && cupoLibre > 0 ? (
                        <div className="det-cta">
                            <div>
                                <p className="det-cta__cupo">Quedan <strong>{cupoLibre}</strong> lugares disponibles</p>
                                {!user && <p className="det-cta__login">Necesitás <a href="/login">iniciar sesión</a> para inscribirte</p>}
                            </div>
                            {user && (
                                <button className="btn-inscribir-cta" onClick={() => navigate(`/competencias/${tipo}/${id}/inscribir`)}>
                                    Inscribir mi equipo →
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="det-cerrado">
                            {cupoLibre <= 0 ? 'Cupo completo' : `Estado: ${data.estado}`}
                        </div>
                    )}

                    <div className="det-fixture">
                        <h3><i className="bi bi-calendar3"></i> Fixture</h3>
                        {fixtures.length === 0 ? (
                            <p className="det-fixture__empty">El fixture aún no fue generado.</p>
                        ) : (
                            fixtures.map(f => (
                                <div key={f.id} className="fixture-jornada">
                                    <div className="fixture-jornada__head">
                                        <span>{getRoundName(f)}</span>
                                        <small>{formatFecha(f.fechaDesde)} – {formatFecha(f.fechaHasta)}</small>
                                    </div>
                                    {(f.partidos ?? []).map(p => (
                                        <div key={p.id} className={`fixture-partido fixture-partido--${p.estado?.toLowerCase()}`}>
                                            <span className="fx-local">{p.equipoLocal}</span>
                                            <div className="fx-score">
                                                {p.golesLocal != null ? <strong>{p.golesLocal} – {p.golesVisitante}</strong> : <span>VS</span>}
                                            </div>
                                            <span className="fx-visit">{p.equipoVisitante}</span>
                                            {p.cancha && <small className="fx-cancha"><i className="bi bi-pin-map"></i> {p.cancha}</small>}
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
