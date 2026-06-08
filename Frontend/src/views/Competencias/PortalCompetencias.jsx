import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Loader from '../../components/Loader';
import { ligas as ligasApi, torneos as torneosApi } from '../../services/api.js';
import './PortalCompetencias.css';

export default function PortalCompetencias() {
    const navigate = useNavigate();

    const [ligasData, setLigasData]     = useState([]);
    const [torneosData, setTorneosData] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [tab, setTab]                 = useState('ligas'); // 'ligas' | 'torneos'

    useEffect(() => {
        Promise.all([ligasApi.getAll(), torneosApi.getAll()])
            .then(([l, t]) => {
                setLigasData(l);
                setTorneosData(t);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const formatFecha = (iso) =>
        iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    if (loading) return <><Header /><Loader /></>;

    const items = tab === 'ligas' ? ligasData : torneosData;

    return (
        <>
            <Header />
            <main className="portal-comp fade-in-up">
                <div className="portal-comp__hero">
                    <h1>🏆 Competencias</h1>
                    <p>Inscribí tu equipo en ligas y torneos del complejo</p>
                </div>

                {error && <div className="portal-comp__error">{error}</div>}

                <div className="portal-comp__tabs">
                    <button
                        className={`comp-tab ${tab === 'ligas' ? 'comp-tab--active' : ''}`}
                        onClick={() => setTab('ligas')}
                    >
                        ⚽ Ligas
                    </button>
                    <button
                        className={`comp-tab ${tab === 'torneos' ? 'comp-tab--active' : ''}`}
                        onClick={() => setTab('torneos')}
                    >
                        🥇 Torneos
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="portal-comp__empty">
                        <p>No hay {tab} disponibles en este momento.</p>
                    </div>
                ) : (
                    <div className="comp-grid">
                        {items.map(item => {
                            const abierta = item.estado === 'Abierta' || item.estado === 'Abierto';
                            const cupoUsado = item.equiposConfirmados ?? 0;
                            const cupoTotal = item.cupoEquipos ?? 0;
                            const cupoLibre = cupoTotal - cupoUsado;

                            return (
                                <div key={item.id} className="comp-card">
                                    <div className="comp-card__head">
                                        <span className={`comp-badge comp-badge--${abierta ? 'open' : 'closed'}`}>
                                            {item.estado}
                                        </span>
                                        {tab === 'torneos' && item.premioUSD > 0 && (
                                            <span className="comp-badge comp-badge--prize">
                                                🏆 ${item.premioUSD} USD
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="comp-card__title">{item.nombre}</h3>
                                    <p className="comp-card__categoria">Categoría: <strong>{item.categoria || '-'}</strong></p>

                                    <div className="comp-card__dates">
                                        <div>
                                            <span>Inicio</span>
                                            <strong>{formatFecha(item.fechaInicio)}</strong>
                                        </div>
                                        <div>
                                            <span>Fin</span>
                                            <strong>{formatFecha(item.fechaFin)}</strong>
                                        </div>
                                    </div>

                                    <div className="comp-card__cupo">
                                        <div className="cupo-bar">
                                            <div
                                                className="cupo-bar__fill"
                                                style={{ width: cupoTotal ? `${(cupoUsado / cupoTotal) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <span>{cupoUsado} / {cupoTotal} equipos</span>
                                    </div>

                                    <div className="comp-card__costo">
                                        {item.costoInscripcion > 0
                                            ? <span>Matrícula: <strong>${Number(item.costoInscripcion).toLocaleString('es-AR')}</strong></span>
                                            : <span className="comp-free">Inscripción gratuita</span>
                                        }
                                    </div>

                                    <div className="comp-card__actions">
                                        <button
                                            className="btn-ver-fixture"
                                            onClick={() => navigate(`/competencias/${tab}/${item.id}/fixture`)}
                                        >
                                            Ver Fixture
                                        </button>
                                        {abierta && cupoLibre > 0 && (
                                            <button
                                                className="btn-inscribir"
                                                onClick={() => navigate(`/competencias/${tab}/${item.id}/inscribir`)}
                                            >
                                                Inscribir Equipo
                                            </button>
                                        )}
                                        {cupoLibre <= 0 && (
                                            <span className="comp-sin-cupo">Sin cupo disponible</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
