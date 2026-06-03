import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { canchas as canchasApi, reservas as reservasApi, cobros as cobrosApi, recibos as recibosApi, users as usersApi } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import './AdminPanel.css';

const todayInput = () => new Date().toISOString().split('T')[0];

const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const menuItems = [
    { id: 'reservas',  label: 'Reservas y turnos',  icon: '📅' },
    { id: 'canchas',   label: 'Gestión de canchas', icon: '⚽' },
    { id: 'usuarios',  label: 'Gestión de usuarios', icon: '👥' },
    { id: 'pagos',     label: 'Pagos y recibos',    icon: '💰' },
    { id: 'reportes',  label: 'Reportes',            icon: '📊' },
];

const statusFilters = ['Todas', 'Pendiente', 'Confirmada', 'Cancelada'];

export default function AdminPanel() {
    const { user, logout }       = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate               = useNavigate();
    const { notify }             = useToast();

    const [activeSection, setActiveSection] = useState('reservas');
    const [selectedDate,  setSelectedDate]  = useState(todayInput());
    const [statusFilter,  setStatusFilter]  = useState('Todas');
    const [loading,       setLoading]       = useState(true);

    const [reservas, setReservas] = useState([]);
    const [canchas,  setCanchas]  = useState([]);
    const [users,    setUsers]    = useState([]);

    const [showCanchaForm, setShowCanchaForm] = useState(false);
    const [canchaForm, setCanchaForm] = useState({ superficie: '', capacidad: 10, tipoCancha: 'Futbol5' });

    const [showReservaForm, setShowReservaForm] = useState(false);
    const [reservaForm, setReservaForm] = useState({
        canchaId: '', personaId: '', fecha: todayInput(),
        horaInicio: '20:00', horaFin: '21:00', precio: 4500, pago: false
    });

    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        id: 0, nombre: '', apellido: '', dni: 0, email: '', rol: 'Usuario', legajo: 0
    });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedDate)             params.fecha  = selectedDate;
            if (statusFilter !== 'Todas') params.estado = statusFilter;

            const [r, c, u] = await Promise.all([
                reservasApi.getAll(params),
                canchasApi.getAll(),
                usersApi.getAll(),
            ]);
            setReservas(r);
            setCanchas(c);
            setUsers(u);
        } catch (err) {
            notify(err.message || 'Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, statusFilter]);

    useEffect(() => {
        if (!user || user.rol !== 'Administrador') navigate('/');
    }, [user, navigate]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const reservasByCancha = useMemo(() => reservas.reduce((groups, r) => {
        const key = r.cancha || `Cancha #${r.canchaId}`;
        (groups[key] ??= []).push(r);
        return groups;
    }, {}), [reservas]);

    const metrics = useMemo(() => ({
        confirmed: reservas.filter(r => r.estado === 'Confirmada').length,
        pending:   reservas.filter(r => r.estado === 'Pendiente').length,
        canceled:  reservas.filter(r => r.estado === 'Cancelada').length,
        revenue:   reservas.filter(r => r.estado !== 'Cancelada').reduce((s, r) => s + Number(r.precio || 0), 0),
    }), [reservas]);

    const shiftDate = (days) => {
        const d = new Date(`${selectedDate}T00:00:00`);
        d.setDate(d.getDate() + days);
        const iso = d.toISOString().split('T')[0];
        setSelectedDate(iso);
        setReservaForm(f => ({ ...f, fecha: iso }));
    };

    const handleCreateCancha = async (e) => {
        e.preventDefault();
        try {
            await canchasApi.create(canchaForm);
            notify('Cancha creada con éxito', 'success');
            setShowCanchaForm(false);
            setCanchaForm({ superficie: '', capacidad: 10, tipoCancha: 'Futbol5' });
            fetchAll();
        } catch (err) {
            notify(err.message || 'No se pudo crear la cancha', 'error');
        }
    };

    const handleCreateReserva = async (e) => {
        e.preventDefault();
        try {
            await reservasApi.create({
                ...reservaForm,
                canchaId:  Number(reservaForm.canchaId),
                personaId: Number(reservaForm.personaId),
                precio:    Number(reservaForm.precio),
            });
            notify('Reserva creada con éxito', 'success');
            setShowReservaForm(false);
            setSelectedDate(reservaForm.fecha);
            fetchAll();
        } catch (err) {
            notify(err.message || 'No se pudo crear la reserva', 'error');
        }
    };

    const updateReservaEstado = async (id, estado) => {
        try {
            await reservasApi.updateEstado(id, estado);
            notify(`Reserva ${estado.toLowerCase()} con éxito`, 'success');
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al actualizar', 'error');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await usersApi.update(userForm.id, userForm);
            notify('Usuario actualizado con éxito', 'success');
            setEditingUser(null);
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al actualizar', 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await usersApi.remove(id);
            notify('Usuario eliminado', 'success');
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al eliminar', 'error');
        }
    };

    const handlePrintUser = (u) => {
        const w = window.open('', '_blank', 'width=600,height=450');
        w.document.write(`<html><head><title>Credencial - ${u.nombre} ${u.apellido}</title>
        <style>
            body{font-family:Arial,sans-serif;background:#0b130e;color:#fff;padding:40px;text-align:center}
            .card{border:2px solid #28a745;border-radius:12px;padding:25px;display:inline-block;background:#111d13;text-align:left;max-width:400px;width:100%}
            .header{font-size:20px;font-weight:bold;border-bottom:2px solid #28a745;padding-bottom:10px;margin-bottom:20px;color:#28a745;text-align:center}
            .field{margin-bottom:12px;font-size:15px}.label{color:#888;font-weight:bold}.value{color:#fff;margin-left:8px}
        </style></head>
        <body><div class="card">
            <div class="header">GOL AHORA - CREDENCIAL</div>
            <div class="field"><span class="label">ID:</span><span class="value">${u.id}</span></div>
            <div class="field"><span class="label">Nombre:</span><span class="value">${u.nombre} ${u.apellido}</span></div>
            <div class="field"><span class="label">DNI:</span><span class="value">${u.dni}</span></div>
            <div class="field"><span class="label">Email:</span><span class="value">${u.email}</span></div>
            <div class="field"><span class="label">Rol:</span><span class="value">${u.rol}</span></div>
        </div><script>window.onload=()=>window.print()</script></body></html>`);
        w.document.close();
    };

    return (
        <main className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <img src="/logo.png" alt="Gol Ahora" />
                    <div>
                        <strong>Gol Ahora</strong>
                        <span>Panel interno</span>
                    </div>
                </div>

                <div className="admin-profile">
                    <div className="admin-avatar">{user?.nombre?.[0] || 'A'}</div>
                    <div>
                        <strong>{user?.nombre || 'Administrador'}</strong>
                        <span>En línea</span>
                    </div>
                </div>

                <nav className="admin-menu">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            className={activeSection === item.id ? 'active' : ''}
                            onClick={() => setActiveSection(item.id)}
                        >
                            <span className="menu-icon">{item.icon}</span> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-theme-btn" onClick={toggleTheme}>
                        {theme === 'dark' ? '☀ Modo claro' : '☾ Modo oscuro'}
                    </button>
                    <button className="admin-logout" onClick={() => { logout(); navigate('/'); }}>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <section className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <p>Administrador</p>
                        <h1>{menuItems.find(i => i.id === activeSection)?.label}</h1>
                    </div>
                    <button className="ghost-button" onClick={fetchAll}>↻ Actualizar</button>
                </header>

                {/* ── RESERVAS ── */}
                {activeSection === 'reservas' && (
                    <section className="admin-panel">
                        <div className="reservation-toolbar">
                            <div>
                                <p>Fecha</p>
                                <div className="date-controls">
                                    <button type="button" onClick={() => shiftDate(-1)}>‹</button>
                                    <input type="date" value={selectedDate}
                                        onChange={e => { setSelectedDate(e.target.value); setReservaForm(f => ({ ...f, fecha: e.target.value })); }} />
                                    <button type="button" onClick={() => shiftDate(1)}>›</button>
                                </div>
                            </div>
                            <div className="status-tabs">
                                {statusFilters.map(f => (
                                    <button key={f} className={statusFilter === f ? 'active' : ''} onClick={() => setStatusFilter(f)}>{f}</button>
                                ))}
                            </div>
                            <button className="primary-action" onClick={() => setShowReservaForm(v => !v)}>
                                {showReservaForm ? 'Cancelar' : '+ Nueva reserva'}
                            </button>
                        </div>

                        <div className="metric-grid">
                            <article><span>Confirmadas</span><strong>{metrics.confirmed}</strong></article>
                            <article><span>Pendientes</span><strong>{metrics.pending}</strong></article>
                            <article><span>Canceladas</span><strong>{metrics.canceled}</strong></article>
                            <article><span>Ingresos del día</span><strong>{moneyFmt.format(metrics.revenue)}</strong></article>
                        </div>

                        {showReservaForm && (
                            <form className="admin-form reservation-form" onSubmit={handleCreateReserva}>
                                <select value={reservaForm.canchaId} onChange={e => setReservaForm(f => ({ ...f, canchaId: e.target.value }))} required>
                                    <option value="">Cancha</option>
                                    {canchas.map(c => <option key={c.id} value={c.id}>{c.superficie}</option>)}
                                </select>
                                <select value={reservaForm.personaId} onChange={e => setReservaForm(f => ({ ...f, personaId: e.target.value }))} required>
                                    <option value="">Cliente</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                                </select>
                                <input type="date" value={reservaForm.fecha} onChange={e => setReservaForm(f => ({ ...f, fecha: e.target.value }))} required />
                                <input type="time" value={reservaForm.horaInicio} onChange={e => setReservaForm(f => ({ ...f, horaInicio: e.target.value }))} required />
                                <input type="time" value={reservaForm.horaFin}    onChange={e => setReservaForm(f => ({ ...f, horaFin: e.target.value }))} required />
                                <input type="number" min="0" value={reservaForm.precio} onChange={e => setReservaForm(f => ({ ...f, precio: e.target.value }))} required />
                                <label className="check-field">
                                    <input type="checkbox" checked={reservaForm.pago} onChange={e => setReservaForm(f => ({ ...f, pago: e.target.checked }))} />
                                    Pago recibido
                                </label>
                                <button type="submit" className="primary-action">Guardar reserva</button>
                            </form>
                        )}

                        <div className="reservation-board">
                            {loading && <div className="empty-state">Cargando reservas...</div>}
                            {!loading && reservas.length === 0 && <div className="empty-state">No hay reservas para los filtros seleccionados.</div>}
                            {!loading && Object.entries(reservasByCancha).map(([name, rs]) => (
                                <section key={name} className="court-row">
                                    <div className="court-heading">
                                        <h2>Cancha: <span>{name}</span></h2>
                                        <small>{rs.length} turno{rs.length !== 1 && 's'}</small>
                                    </div>
                                    <div className="reservation-cards">
                                        {rs.map(r => (
                                            <article key={r.id} className={`reservation-card status-${r.estado.toLowerCase()}`}>
                                                <div className="reservation-card-head">
                                                    <strong>ID #{r.id}</strong>
                                                    <span>{r.estado}</span>
                                                </div>
                                                <dl>
                                                    <div><dt>Cliente</dt><dd>{r.cliente}</dd></div>
                                                    <div><dt>Precio</dt><dd>{moneyFmt.format(r.precio || 0)}</dd></div>
                                                    <div><dt>Horario</dt><dd>{r.horaInicio} – {r.horaFin}</dd></div>
                                                    <div><dt>Pago</dt><dd>{r.pago ? 'Recibido' : 'Pendiente'}</dd></div>
                                                </dl>
                                                <div className="reservation-actions">
                                                    {r.estado !== 'Confirmada' && <button onClick={() => updateReservaEstado(r.id, 'Confirmada')}>Confirmar</button>}
                                                    {r.estado !== 'Cancelada'  && <button className="danger" onClick={() => updateReservaEstado(r.id, 'Cancelada')}>Cancelar</button>}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── CANCHAS ── */}
                {activeSection === 'canchas' && (
                    <section className="admin-panel">
                        <div className="section-actions">
                            <button className="primary-action" onClick={() => setShowCanchaForm(v => !v)}>
                                {showCanchaForm ? 'Cancelar' : '+ Nueva cancha'}
                            </button>
                        </div>
                        {showCanchaForm && (
                            <form className="admin-form" onSubmit={handleCreateCancha}>
                                <input type="text" placeholder="Superficie" value={canchaForm.superficie}
                                    onChange={e => setCanchaForm(f => ({ ...f, superficie: e.target.value }))} required />
                                <select value={canchaForm.tipoCancha} onChange={e => setCanchaForm(f => ({ ...f, tipoCancha: e.target.value }))}>
                                    <option value="Futbol5">Fútbol 5</option>
                                    <option value="Futbol7">Fútbol 7</option>
                                    <option value="Futbol11">Fútbol 11</option>
                                </select>
                                <input type="number" value={canchaForm.capacidad}
                                    onChange={e => setCanchaForm(f => ({ ...f, capacidad: parseInt(e.target.value) }))} />
                                <button type="submit" className="primary-action">Guardar cancha</button>
                            </form>
                        )}
                        <div className="data-table">
                            <table>
                                <thead><tr><th>ID</th><th>Superficie</th><th>Capacidad</th><th>Estado</th></tr></thead>
                                <tbody>
                                    {canchas.map(c => (
                                        <tr key={c.id}>
                                            <td>#{c.id}</td>
                                            <td>{c.superficie}</td>
                                            <td>{c.capacidad} jugadores</td>
                                            <td><span className="pill success">{c.estado}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ── USUARIOS ── */}
                {activeSection === 'usuarios' && (
                    <section className="admin-panel">
                        {editingUser && (
                            <form className="admin-form user-form" onSubmit={handleUpdateUser}>
                                <input placeholder="Nombre"   value={userForm.nombre}   onChange={e => setUserForm(f => ({ ...f, nombre: e.target.value }))}   required />
                                <input placeholder="Apellido" value={userForm.apellido} onChange={e => setUserForm(f => ({ ...f, apellido: e.target.value }))} required />
                                <input type="number" placeholder="DNI"    value={userForm.dni}    onChange={e => setUserForm(f => ({ ...f, dni: parseInt(e.target.value) }))} required />
                                <input type="email"  placeholder="Email"  value={userForm.email}  onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}        required />
                                <input type="number" placeholder="Legajo" value={userForm.legajo} onChange={e => setUserForm(f => ({ ...f, legajo: parseInt(e.target.value) }))} />
                                <select value={userForm.rol} onChange={e => setUserForm(f => ({ ...f, rol: e.target.value }))}>
                                    <option value="Usuario">Cliente / Usuario</option>
                                    <option value="Empleado">Empleado</option>
                                    <option value="Profesor">Profesor</option>
                                    <option value="Entrenador">Entrenador</option>
                                    <option value="Administrador">Administrador</option>
                                </select>
                                <button type="button" className="ghost-button" onClick={() => setEditingUser(null)}>Cancelar</button>
                                <button type="submit" className="primary-action">Guardar cambios</button>
                            </form>
                        )}
                        <div className="data-table">
                            <table>
                                <thead><tr><th>ID</th><th>Nombre</th><th>DNI</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>#{u.id}</td>
                                            <td>{u.nombre} {u.apellido}</td>
                                            <td>{u.dni}</td>
                                            <td>{u.email}</td>
                                            <td><span className="pill neutral">{u.rol}</span></td>
                                            <td className="table-actions">
                                                <button onClick={() => { setEditingUser(u.id); setUserForm({ id: u.id, nombre: u.nombre, apellido: u.apellido, dni: u.dni, email: u.email, rol: u.rol || 'Usuario', legajo: u.legajo || 0 }); }}>Editar</button>
                                                <button onClick={() => handlePrintUser(u)}>Imprimir</button>
                                                <button className="danger" onClick={() => handleDeleteUser(u.id)}>Borrar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeSection === 'pagos'    && <PagosPanel moneyFmt={moneyFmt} notify={notify} />}

                {activeSection === 'reportes' && (
                    <section className="admin-panel placeholder-panel">
                        <h2>Reportes</h2>
                        <p>Módulo en desarrollo. Aquí se mostrarán métricas, gráficos y exportaciones.</p>
                    </section>
                )}
            </section>
        </main>
    );
}

// ─── Módulo Pagos y Recibos ───────────────────────────────────────────────────
function PagosPanel({ moneyFmt, notify }) {
    const [tab,     setTab]     = useState('cobros');
    const [cobros,  setCobros]  = useState([]);
    const [recibosList, setRecibos]  = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCobroForm, setShowCobroForm] = useState(false);
    const [editingCobro,  setEditingCobro]  = useState(null);
    const [cobroForm, setCobroForm] = useState({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' });

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [c, r] = await Promise.all([cobrosApi.getAll(), recibosApi.getAll()]);
            setCobros(c);
            setRecibos(r);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSaveCobro = async (e) => {
        e.preventDefault();
        const body = { ...cobroForm, monto: Number(cobroForm.monto), descuento: Number(cobroForm.descuento) };
        try {
            if (editingCobro) await cobrosApi.update(editingCobro, body);
            else              await cobrosApi.create(body);
            notify(editingCobro ? 'Cobro actualizado' : 'Cobro creado', 'success');
            setShowCobroForm(false);
            setEditingCobro(null);
            setCobroForm({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' });
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al guardar', 'error');
        }
    };

    const handlePagarCobro = async (c) => {
        if (!window.confirm(`¿Registrar pago de ${moneyFmt.format(c.montoFinal)} para el cobro #${c.id}?`)) return;
        try {
            await cobrosApi.pagar(c.id, { monto: c.montoFinal, metodoPago: 'Efectivo', aprobado: true });
            notify('Pago registrado y recibo generado', 'success');
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al procesar', 'error');
        }
    };

    const handleDeleteCobro = async (id) => {
        if (!window.confirm('¿Eliminar este cobro?')) return;
        try {
            await cobrosApi.remove(id);
            notify('Cobro eliminado', 'success');
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al eliminar', 'error');
        }
    };

    const handleDeleteRecibo = async (id) => {
        if (!window.confirm('¿Eliminar este recibo?')) return;
        try {
            await recibosApi.remove(id);
            notify('Recibo eliminado', 'success');
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al eliminar', 'error');
        }
    };

    const handlePrintCobro = (c) => {
        const w = window.open('', '_blank', 'width=650,height=520');
        w.document.write(`<html><head><title>Cobro #${c.id}</title>
        <style>body{font-family:Arial;background:#0b130e;color:#fff;padding:40px}
        .card{border:2px solid #28a745;border-radius:12px;padding:28px;max-width:480px;margin:auto;background:#111d13}
        .header{font-size:20px;font-weight:bold;border-bottom:2px solid #28a745;padding-bottom:12px;margin-bottom:20px;color:#28a745;text-align:center}
        .row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:15px}
        .label{color:#8ca092}.value{color:#fff;font-weight:bold}</style></head>
        <body><div class="card">
        <div class="header">GOL AHORA — COMPROBANTE DE COBRO</div>
        <div class="row"><span class="label">N° Cobro</span><span class="value">#${c.id}</span></div>
        <div class="row"><span class="label">Concepto</span><span class="value">${c.concepto}</span></div>
        <div class="row"><span class="label">Total</span><span class="value">$${Number(c.montoFinal).toLocaleString('es-AR')}</span></div>
        <div class="row"><span class="label">Estado</span><span class="value">${c.estado}</span></div>
        </div><script>window.onload=()=>window.print()</script></body></html>`);
        w.document.close();
    };

    const handlePrintRecibo = (r) => {
        const w = window.open('', '_blank', 'width=650,height=520');
        w.document.write(`<html><head><title>Recibo ${r.numero}</title>
        <style>body{font-family:Arial;background:#0b130e;color:#fff;padding:40px}
        .card{border:2px solid #28a745;border-radius:12px;padding:28px;max-width:480px;margin:auto;background:#111d13}
        .header{font-size:20px;font-weight:bold;border-bottom:2px solid #28a745;padding-bottom:12px;margin-bottom:20px;color:#28a745;text-align:center}
        .row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:15px}
        .label{color:#8ca092}.value{color:#fff;font-weight:bold}</style></head>
        <body><div class="card">
        <div class="header">GOL AHORA — RECIBO DE PAGO</div>
        <div class="row"><span class="label">N° Recibo</span><span class="value">${r.numero}</span></div>
        <div class="row"><span class="label">Fecha</span><span class="value">${new Date(r.fechaEmision).toLocaleString('es-AR')}</span></div>
        <div class="row"><span class="label">Cobro</span><span class="value">#${r.cobroId}</span></div>
        </div><script>window.onload=()=>window.print()</script></body></html>`);
        w.document.close();
    };

    const totalCobrado  = cobros.filter(c => c.estado === 'Pagado').reduce((s, c) => s + Number(c.montoFinal), 0);
    const totalPendiente = cobros.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + Number(c.montoFinal), 0);

    const estadoPill = (e) => ({ Pagado: 'success', Pendiente: 'pending', Rechazado: 'danger' }[e] ?? 'neutral');

    return (
        <section className="admin-panel">
            <div className="pagos-tabs">
                <button className={tab === 'cobros'  ? 'active' : ''} onClick={() => setTab('cobros')}>📋 Cobros</button>
                <button className={tab === 'recibos' ? 'active' : ''} onClick={() => setTab('recibos')}>🧾 Recibos</button>
            </div>

            {tab === 'cobros' && (
                <>
                    <div className="metric-grid" style={{ marginTop: 16 }}>
                        <article><span>Total cobros</span><strong>{cobros.length}</strong></article>
                        <article><span>Cobrado</span><strong style={{ color: 'var(--accent)' }}>{moneyFmt.format(totalCobrado)}</strong></article>
                        <article><span>Pendiente</span><strong style={{ color: 'var(--warning)' }}>{moneyFmt.format(totalPendiente)}</strong></article>
                        <article><span>Recibos emitidos</span><strong>{recibosList.length}</strong></article>
                    </div>

                    <div className="section-actions">
                        <button className="primary-action" onClick={() => { setEditingCobro(null); setCobroForm({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' }); setShowCobroForm(v => !v); }}>
                            {showCobroForm ? 'Cancelar' : '+ Nuevo cobro'}
                        </button>
                    </div>

                    {showCobroForm && (
                        <form className="admin-form cobro-form" onSubmit={handleSaveCobro}>
                            <input placeholder="Concepto" value={cobroForm.concepto} onChange={e => setCobroForm(f => ({ ...f, concepto: e.target.value }))} required />
                            <input type="number" min="0" placeholder="Monto" value={cobroForm.monto} onChange={e => setCobroForm(f => ({ ...f, monto: e.target.value }))} required />
                            <input type="number" min="0" placeholder="Descuento" value={cobroForm.descuento} onChange={e => setCobroForm(f => ({ ...f, descuento: e.target.value }))} />
                            <select value={cobroForm.estado} onChange={e => setCobroForm(f => ({ ...f, estado: e.target.value }))}>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagado">Pagado</option>
                                <option value="Rechazado">Rechazado</option>
                            </select>
                            <input placeholder="Método de pago" value={cobroForm.metodoPago} onChange={e => setCobroForm(f => ({ ...f, metodoPago: e.target.value }))} />
                            <button type="submit" className="primary-action">{editingCobro ? 'Actualizar' : 'Guardar cobro'}</button>
                        </form>
                    )}

                    {loading ? <div className="empty-state">Cargando cobros...</div>
                        : cobros.length === 0 ? <div className="empty-state">No hay cobros registrados.</div>
                        : (
                            <div className="data-table">
                                <table>
                                    <thead><tr><th>ID</th><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Desc.</th><th>Total</th><th>Método</th><th>Estado</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {cobros.map(c => (
                                            <tr key={c.id}>
                                                <td>#{c.id}</td>
                                                <td>{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                                                <td>{c.concepto}</td>
                                                <td>{moneyFmt.format(c.monto)}</td>
                                                <td style={{ color: 'var(--warning)' }}>{c.descuento > 0 ? `-${moneyFmt.format(c.descuento)}` : '—'}</td>
                                                <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{moneyFmt.format(c.montoFinal)}</td>
                                                <td>{c.metodoPago || '—'}</td>
                                                <td><span className={`pill ${estadoPill(c.estado)}`}>{c.estado}</span></td>
                                                <td className="table-actions">
                                                    {c.estado === 'Pendiente' && <button onClick={() => handlePagarCobro(c)}>💳 Pagar</button>}
                                                    <button onClick={() => { setEditingCobro(c.id); setCobroForm({ concepto: c.concepto, monto: c.monto, descuento: c.descuento, estado: c.estado, metodoPago: c.metodoPago }); setShowCobroForm(true); }}>Editar</button>
                                                    <button onClick={() => handlePrintCobro(c)}>🖨️</button>
                                                    <button className="danger" onClick={() => handleDeleteCobro(c.id)}>Borrar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    }
                </>
            )}

            {tab === 'recibos' && (
                loading ? <div className="empty-state">Cargando recibos...</div>
                : recibosList.length === 0 ? <div className="empty-state">No hay recibos emitidos.</div>
                : (
                    <div className="data-table" style={{ marginTop: 16 }}>
                        <table>
                            <thead><tr><th>N° Recibo</th><th>Cobro</th><th>Fecha Emisión</th><th>Datos</th><th>Acciones</th></tr></thead>
                            <tbody>
                                {recibosList.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{r.numero}</td>
                                        <td>#{r.cobroId}</td>
                                        <td>{new Date(r.fechaEmision).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.datos}</td>
                                        <td className="table-actions">
                                            <button onClick={() => handlePrintRecibo(r)}>🖨️</button>
                                            <button className="danger" onClick={() => handleDeleteRecibo(r.id)}>Borrar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </section>
    );
}
