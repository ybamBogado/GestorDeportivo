import { useState, useEffect } from 'react';
import { ligas as ligasApi, torneos as torneosApi, partidos as partidosApi, equipos as equiposApi } from '../../services/api.js';
import ConfirmModal from '../ConfirmModal.jsx';
import './PanelCompetencias.css';

export default function PanelCompetencias() {
    const [subTab, setSubTab] = useState('ligas');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(defaultForm());
    const [selected, setSelected] = useState(null);
    const [fixtures, setFixtures] = useState([]);
    const [inscritos, setInscritos] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [resultadoPartidoId, setResultadoPartidoId] = useState(null);
    const [golesLocal, setGolesLocal] = useState(0);
    const [golesVisit, setGolesVisit] = useState(0);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [equiposDisponibles, setEquiposDisponibles] = useState([]);
    const [showInscribirForm, setShowInscribirForm] = useState(false);
    const [selectedEquipoId, setSelectedEquipoId] = useState('');

    const api = subTab === 'ligas' ? ligasApi : torneosApi;

    function defaultForm() {
        return {
            nombre: '', reglamento: '', estado: 'Abierta', cupoEquipos: 8,
            categoria: 'Primera', costoInscripcion: 0,
            fechaInicio: '', fechaFin: '',
            premioUSD: 0, modalidad: 'Eliminacion', formato: 'EliminacionDirecta',
            cantidadFechas: 1
        };
    }

    const showConfirm = (message, onConfirm, title = 'Confirmación') => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(c => ({ ...c, isOpen: false }));
            }
        });
    };

    const load = () => {
        setLoading(true);
        api.getAll()
            .then(setItems)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [subTab]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await api.create({
                ...form,
                cupoEquipos: Number(form.cupoEquipos),
                costoInscripcion: Number(form.costoInscripcion),
                premioUSD: Number(form.premioUSD),
                cantidadFechas: Number(form.cantidadFechas),
                fechaInicio: form.fechaInicio || new Date().toISOString(),
                fechaFin: form.fechaFin || new Date(Date.now() + 90 * 86400000).toISOString(),
                estado: subTab === 'ligas' ? 'Abierta' : 'Abierto',
            });
            setSuccess(`${subTab === 'ligas' ? 'Liga' : 'Torneo'} creado/a exitosamente`);
            setShowForm(false);
            setForm(defaultForm());
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleSelectItem = async (item) => {
        setSelected(item);
        setShowInscribirForm(false);
        setSelectedEquipoId('');
        setLoadingDetail(true);
        try {
            const [fix, ins, eqs] = await Promise.all([
                api.getFixtures(item.id),
                api.getInscritos(item.id),
                equiposApi.getAll()
            ]);
            setFixtures(fix);
            setInscritos(ins);
            setEquiposDisponibles(eqs);
        } catch {
            setFixtures([]);
            setInscritos([]);
            setEquiposDisponibles([]);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleInscribirEquipo = async (e) => {
        e.preventDefault();
        if (!selectedEquipoId) return;
        setError(null);
        try {
            const result = await api.inscribir(selected.id, { equipoId: Number(selectedEquipoId) });
            setSuccess(`Equipo inscripto. Estado: ${result.estado}. ${result.montoMatricula > 0 ? `Cobro generado: $${Number(result.montoMatricula).toLocaleString('es-AR')}` : 'Sin costo.'}`);
            setShowInscribirForm(false);
            setSelectedEquipoId('');
            handleSelectItem(selected);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleGenerarFixture = async () => {
        if (!selected) return;
        showConfirm(
            `¿Generar fixture para "${selected.nombre}"? Solo participarán equipos con inscripción confirmada.`,
            async () => {
                setError(null);
                try {
                    const result = await api.generarFixture(selected.id, {
                        fechaInicio: selected.fechaInicio || new Date().toISOString()
                    });
                    setSuccess(`Fixture generado: ${result.totalJornadas} jornadas, ${result.totalPartidos} partidos`);
                    handleSelectItem(selected);
                    load();
                } catch (e) {
                    setError(e.message);
                }
            },
            'Generar fixture'
        );
    };

    const handleCargarResultado = async (partidoId) => {
        setError(null);
        try {
            await partidosApi.resultado(partidoId, {
                golesLocal: Number(golesLocal),
                golesVisitante: Number(golesVisit)
            });
            setSuccess('Resultado cargado correctamente');
            setResultadoPartidoId(null);
            handleSelectItem(selected);
        } catch (e) {
            setError(e.message);
        }
    };

    const formatFecha = (iso) =>
        iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    return (
        <div className="panel-comp">
            <div className="panel-comp__subtabs">
                <button className={`subtab ${subTab === 'ligas' ? 'subtab--active' : ''}`} onClick={() => { setSubTab('ligas'); setSelected(null); }}>
                    <i className="bi bi-shield-fill"></i> Ligas
                </button>
                <button className={`subtab ${subTab === 'torneos' ? 'subtab--active' : ''}`} onClick={() => { setSubTab('torneos'); setSelected(null); }}>
                    <i className="bi bi-trophy-fill"></i> Torneos
                </button>
            </div>

            {error && <div className="panel-comp__msg panel-comp__msg--error">{error}</div>}
            {success && <div className="panel-comp__msg panel-comp__msg--success">{success}</div>}

            {!selected ? (
                <>
                    <div className="panel-comp__toolbar">
                        <h3>{subTab === 'ligas' ? 'Ligas' : 'Torneos'}</h3>
                        <button className="btn-nuevo" onClick={() => { setShowForm(s => !s); setSuccess(null); }}>
                            {showForm ? 'Cancelar' : `+ Nueva ${subTab === 'ligas' ? 'Liga' : 'Torneo'}`}
                        </button>
                    </div>

                    {showForm && (
                        <form className="comp-form" onSubmit={handleCreate}>
                            <div className="comp-form__grid">
                                <div className="cf-field cf-field--full">
                                    <label>Nombre</label>
                                    <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
                                </div>
                                <div className="cf-field cf-field--full">
                                    <label>Reglamento</label>
                                    <textarea value={form.reglamento} onChange={e => setForm(f => ({ ...f, reglamento: e.target.value }))} rows={2} />
                                </div>
                                <div className="cf-field">
                                    <label>Categoría</label>
                                    <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                                        <option>Primera</option><option>Segunda</option><option>Tercera</option><option>Libre</option>
                                    </select>
                                </div>
                                <div className="cf-field">
                                    <label>Cupo equipos</label>
                                    <input type="number" min="2" value={form.cupoEquipos} onChange={e => setForm(f => ({ ...f, cupoEquipos: e.target.value }))} />
                                </div>
                                <div className="cf-field">
                                    <label>Costo inscripción ($)</label>
                                    <input type="number" min="0" value={form.costoInscripcion} onChange={e => setForm(f => ({ ...f, costoInscripcion: e.target.value }))} />
                                </div>
                                <div className="cf-field">
                                    <label>Fecha inicio</label>
                                    <input type="date" value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} />
                                </div>
                                <div className="cf-field">
                                    <label>Fecha fin</label>
                                    <input type="date" value={form.fechaFin} onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))} />
                                </div>
                                {subTab === 'ligas' && (
                                    <div className="cf-field">
                                        <label>Cant. fechas</label>
                                        <input type="number" min="1" value={form.cantidadFechas} onChange={e => setForm(f => ({ ...f, cantidadFechas: e.target.value }))} />
                                    </div>
                                )}
                                {subTab === 'torneos' && (
                                    <>
                                        <div className="cf-field">
                                            <label>Modalidad</label>
                                            <select value={form.modalidad} onChange={e => setForm(f => ({ ...f, modalidad: e.target.value }))}>
                                                <option value="Eliminacion">Eliminación directa</option>
                                                <option value="TodosVsTodos">Todos vs todos</option>
                                            </select>
                                        </div>
                                        <div className="cf-field">
                                            <label>Premio (USD)</label>
                                            <input type="number" min="0" value={form.premioUSD} onChange={e => setForm(f => ({ ...f, premioUSD: e.target.value }))} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <button type="submit" className="btn-guardar">Crear</button>
                        </form>
                    )}

                    {loading ? (
                        <p className="panel-comp__loading">Cargando...</p>
                    ) : (
                        <div className="comp-table-wrap">
                            <table className="comp-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Categoría</th>
                                        <th>Estado</th>
                                        <th>Confirmados</th>
                                        <th>Inicio</th>
                                        <th>Costo</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td><strong>{item.nombre}</strong></td>
                                            <td>{item.categoria || '-'}</td>
                                            <td>
                                                <span className={`comp-state comp-state--${item.estado?.toLowerCase().replace(' ', '')}`}>
                                                    {item.estado}
                                                </span>
                                            </td>
                                            <td>{item.equiposConfirmados ?? 0} / {item.cupoEquipos}</td>
                                            <td>{formatFecha(item.fechaInicio)}</td>
                                            <td>{item.costoInscripcion > 0 ? `$${Number(item.costoInscripcion).toLocaleString('es-AR')}` : 'Gratis'}</td>
                                            <td>
                                                <button className="btn-gestionar" onClick={() => handleSelectItem(item)}>Gestionar →</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                <div className="panel-comp__detail">
                    <button className="btn-back" onClick={() => { setSelected(null); setFixtures([]); setInscritos([]); }}>
                        ← Volver a la lista
                    </button>
                    <div className="detail-header">
                        <h3>{selected.nombre}</h3>
                        <span className={`comp-state comp-state--${selected.estado?.toLowerCase().replace(' ', '')}`}>{selected.estado}</span>
                    </div>

                    {loadingDetail ? (
                        <p className="panel-comp__loading">Cargando...</p>
                    ) : (
                        <>
                            <section className="detail-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h4 style={{ margin: 0 }}><i className="bi bi-card-list"></i> Equipos inscriptos ({inscritos.length})</h4>
                                    <button
                                        className="btn-nuevo"
                                        onClick={() => { setShowInscribirForm(s => !s); setSelectedEquipoId(''); }}
                                        style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                                    >
                                        {showInscribirForm ? 'Cancelar' : '+ Inscribir Equipo'}
                                    </button>
                                </div>

                                {showInscribirForm && (
                                    <form onSubmit={handleInscribirEquipo} style={{ background: 'rgba(49,217,79,0.05)', border: '1px solid rgba(49,217,79,0.2)', borderRadius: 10, padding: '16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
                                            <label style={{ fontSize: '0.75rem', color: '#8ca092', fontWeight: 700, textTransform: 'uppercase' }}>Seleccionar equipo existente</label>
                                            <select
                                                value={selectedEquipoId}
                                                onChange={e => setSelectedEquipoId(e.target.value)}
                                                required
                                                style={{ padding: '9px 12px', background: '#0a100c', border: '1px solid rgba(49,217,79,0.25)', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                                            >
                                                <option value="">— Elegir equipo —</option>
                                                {equiposDisponibles
                                                    .filter(eq => !inscritos.some(i => i.equipoId === eq.id))
                                                    .map(eq => (
                                                        <option key={eq.id} value={eq.id}>
                                                            {eq.nombre} ({eq.categoria})
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn-guardar"
                                            style={{ padding: '9px 20px', fontSize: '0.88rem' }}
                                        >
                                            <i className="bi bi-plus-circle me-1"></i> Inscribir
                                        </button>
                                    </form>
                                )}

                                {inscritos.length === 0 ? (
                                    <p className="empty-msg">Sin inscripciones aún.</p>
                                ) : (
                                    <table className="comp-table">
                                        <thead>
                                            <tr><th>Equipo</th><th>Estado</th><th>Cobro</th><th>Jugadores</th></tr>
                                        </thead>
                                        <tbody>
                                            {inscritos.map(i => (
                                                <tr key={i.id}>
                                                    <td><strong>{i.equipoNombre}</strong></td>
                                                    <td>
                                                        <span className={`inscr-estado inscr-estado--${i.estado?.toLowerCase()}`}>
                                                            {i.estado}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {i.cobro ? `$${Number(i.cobro.montoFinal).toLocaleString('es-AR')} (${i.cobro.estado})` : 'Gratis / N/A'}
                                                    </td>
                                                    <td>{i.jugadores}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </section>

                            <section className="detail-section">
                                <h4><i className="bi bi-lightning-charge-fill"></i> Fixture</h4>
                                {fixtures.length === 0 ? (
                                    <div className="fixture-empty">
                                        <p>Fixture no generado.</p>
                                        <button className="btn-generar-fix" onClick={handleGenerarFixture}>
                                            <i className="bi bi-diagram-3-fill"></i> Generar Fixture
                                        </button>
                                    </div>
                                ) : (
                                    fixtures.map(f => (
                                        <div key={f.id} className="admin-fixture-jornada">
                                            <div className="admin-fixture-jornada__head">
                                                <span>Fecha {f.numero}</span>
                                                <small>{formatFecha(f.fechaDesde)} – {formatFecha(f.fechaHasta)}</small>
                                            </div>
                                            {(f.partidos ?? []).map(p => (
                                                <div key={p.id} className="admin-partido">
                                                    <div className="admin-partido__teams">
                                                        <span>{p.equipoLocal}</span>
                                                        <strong>{p.golesLocal != null ? `${p.golesLocal} – ${p.golesVisitante}` : 'VS'}</strong>
                                                        <span>{p.equipoVisitante}</span>
                                                    </div>
                                                    <div className="admin-partido__actions">
                                                        <span className={`partido-estado partido-estado--${p.estado?.toLowerCase()}`}>{p.estado}</span>
                                                        {p.estado !== 'Finalizado' && p.estado !== 'Cancelado' && (
                                                            <button
                                                                className="btn-resultado"
                                                                onClick={() => {
                                                                    setResultadoPartidoId(p.id);
                                                                    setGolesLocal(p.golesLocal ?? 0);
                                                                    setGolesVisit(p.golesVisitante ?? 0);
                                                                }}
                                                            >
                                                                <i className="bi bi-pencil-square"></i> Resultado
                                                            </button>
                                                        )}
                                                    </div>
                                                    {resultadoPartidoId === p.id && (
                                                        <div className="resultado-form">
                                                            <input type="number" min="0" value={golesLocal} onChange={e => setGolesLocal(e.target.value)} />
                                                            <span>–</span>
                                                            <input type="number" min="0" value={golesVisit} onChange={e => setGolesVisit(e.target.value)} />
                                                            <button onClick={() => handleCargarResultado(p.id)}>Guardar</button>
                                                            <button onClick={() => setResultadoPartidoId(null)}>Cancelar</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </section>
                        </>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
            />
        </div>
    );
}
