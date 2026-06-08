import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Loader from '../../components/Loader';
import { ligas as ligasApi, torneos as torneosApi } from '../../services/api.js';
import './DetalleCompetencia.css';

const calculateStandings = (fixturesList) => {
    const standingsMap = {};

    const allMatches = fixturesList.flatMap(f => f.partidos ?? []);

    allMatches.forEach(p => {
        const local = p.equipoLocal;
        const visit = p.equipoVisitante;

        if (local && local !== 'BYE' && !standingsMap[local]) {
            standingsMap[local] = { team: local, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
        }
        if (visit && visit !== 'BYE' && !standingsMap[visit]) {
            standingsMap[visit] = { team: visit, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
        }

        if (local && local !== 'BYE' && visit && visit !== 'BYE' && p.golesLocal !== null && p.golesVisitante !== null) {
            const gl = Number(p.golesLocal);
            const gv = Number(p.golesVisitante);

            standingsMap[local].pj += 1;
            standingsMap[visit].pj += 1;

            standingsMap[local].gf += gl;
            standingsMap[local].gc += gv;
            standingsMap[visit].gf += gv;
            standingsMap[visit].gc += gl;

            if (gl > gv) {
                standingsMap[local].pg += 1;
                standingsMap[local].pts += 3;
                standingsMap[visit].pp += 1;
            } else if (gl < gv) {
                standingsMap[visit].pg += 1;
                standingsMap[visit].pts += 3;
                standingsMap[local].pp += 1;
            } else {
                standingsMap[local].pe += 1;
                standingsMap[local].pts += 1;
                standingsMap[visit].pe += 1;
                standingsMap[visit].pts += 1;
            }
        }
    });

    const standingsList = Object.values(standingsMap).map(team => {
        team.dg = team.gf - team.gc;
        return team;
    });

    standingsList.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        return b.gf - a.gf;
    });

    return standingsList;
};

export default function DetalleCompetencia() {
    const { tipo, id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [compTab, setCompTab] = useState('fixture');

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

                    {isElimination ? (
                        <div className="det-bracket">
                            <h3>
                                <i className="bi bi-diagram-3-fill text-success"></i> Fases y Llaves del Torneo
                            </h3>
                            {fixtures.length === 0 ? (
                                <p className="det-fixture__empty">El fixture aún no fue generado.</p>
                            ) : (
                                <div className="bracket-scroll-container">
                                    <div className="bracket-container">
                                        {fixtures.map((f, fIdx) => {
                                            const roundName = getRoundName(f);
                                            return (
                                                <div key={f.id} className="bracket-round">
                                                    <div className="bracket-round__header">
                                                        <strong>{roundName}</strong>
                                                        <span>
                                                            {formatFecha(f.fechaDesde)} – {formatFecha(f.fechaHasta)}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="bracket-round__matches" 
                                                        style={{ '--round-gap': fIdx === 0 ? '32px' : fIdx === 1 ? '112px' : fIdx === 2 ? '272px' : '592px' }}
                                                    >
                                                        {(f.partidos ?? []).map(p => {
                                                            const isFinished = p.estado?.toLowerCase() === 'finalizado';
                                                            const hasWinner = isFinished && p.golesLocal !== null && p.golesVisitante !== null;
                                                            const localWinner = hasWinner && Number(p.golesLocal) > Number(p.golesVisitante);
                                                            const visitWinner = hasWinner && Number(p.golesVisitante) > Number(p.golesLocal);
                                                            
                                                            return (
                                                                <div key={p.id} className="bracket-card-wrapper">
                                                                    <div className={`bracket-card bracket-card--${p.estado?.toLowerCase()}`}>
                                                                        <div className="bracket-card__row">
                                                                            <span className={`bracket-card__team ${localWinner ? 'winner' : ''}`}>
                                                                                {p.equipoLocal}
                                                                            </span>
                                                                            <span className={`bracket-card__score ${localWinner ? 'winner' : ''}`}>
                                                                                {p.golesLocal != null ? p.golesLocal : '—'}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        <div className="bracket-card__divider"></div>
                                                                        
                                                                        <div className="bracket-card__row">
                                                                            <span className={`bracket-card__team ${visitWinner ? 'winner' : ''}`}>
                                                                                {p.equipoVisitante}
                                                                            </span>
                                                                            <span className={`bracket-card__score ${visitWinner ? 'winner' : ''}`}>
                                                                                {p.golesVisitante != null ? p.golesVisitante : '—'}
                                                                            </span>
                                                                        </div>
                                                                        {p.cancha && (
                                                                            <div className="bracket-card__cancha">
                                                                                <i className="bi bi-pin-map text-success"></i> {p.cancha}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="bracket-card__badge-row">
                                                                        {roundName === 'Final' ? (
                                                                            <span className="bracket-badge bracket-badge--final">
                                                                                <i className="bi bi-trophy-fill"></i> Gran Final
                                                                            </span>
                                                                        ) : (
                                                                            <span className="bracket-badge bracket-badge--promo">
                                                                                <i className="bi bi-arrow-right-short text-success"></i> El ganador clasifica a la Final
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="det-fixture">
                            {tipo === 'ligas' && (
                                <div className="tab-navigation">
                                    <button 
                                        className={`btn-tab ${compTab === 'fixture' ? 'active' : ''}`}
                                        onClick={() => setCompTab('fixture')}
                                    >
                                        <i className="bi bi-calendar3 me-1"></i> Fixture
                                    </button>
                                    <button 
                                        className={`btn-tab ${compTab === 'posiciones' ? 'active' : ''}`}
                                        onClick={() => setCompTab('posiciones')}
                                    >
                                        <i className="bi bi-table me-1"></i> Tabla de Posiciones
                                    </button>
                                </div>
                            )}

                            {compTab === 'fixture' ? (
                                <>
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
                                </>
                            ) : (
                                <>
                                    <h3 className="det-table-title"><i className="bi bi-table text-success"></i> Tabla de Posiciones</h3>
                                    <div className="data-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '50px' }}>#</th>
                                                    <th>Equipo</th>
                                                    <th style={{ width: '60px' }}>PJ</th>
                                                    <th style={{ width: '60px' }}>PG</th>
                                                    <th style={{ width: '60px' }}>PE</th>
                                                    <th style={{ width: '60px' }}>PP</th>
                                                    <th style={{ width: '60px' }}>GF</th>
                                                    <th style={{ width: '60px' }}>GC</th>
                                                    <th style={{ width: '65px' }}>DG</th>
                                                    <th style={{ width: '70px' }}>Pts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {calculateStandings(fixtures).map((team, idx) => (
                                                    <tr key={idx} className={idx === 0 ? 'row-leader' : ''}>
                                                        <td className="col-rank">{idx + 1}</td>
                                                        <td className="col-team">{team.team}</td>
                                                        <td>{team.pj}</td>
                                                        <td>{team.pg}</td>
                                                        <td>{team.pe}</td>
                                                        <td>{team.pp}</td>
                                                        <td className="col-goals">{team.gf}</td>
                                                        <td className="col-goals">{team.gc}</td>
                                                        <td className={`col-dg ${team.dg > 0 ? 'positive' : team.dg < 0 ? 'negative' : ''}`}>{team.dg > 0 ? `+${team.dg}` : team.dg}</td>
                                                        <td className="col-pts">{team.pts}</td>
                                                    </tr>
                                                ))}
                                                {calculateStandings(fixtures).length === 0 && (
                                                    <tr>
                                                        <td colSpan="10" className="table-empty">
                                                            No hay equipos registrados o partidos jugados para generar la tabla.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
