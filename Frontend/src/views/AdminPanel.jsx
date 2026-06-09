import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { canchas as canchasApi, reservas as reservasApi, cobros as cobrosApi, recibos as recibosApi, users as usersApi, auth as authApi, clases as clasesApi, reportes as reportesApi } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EquiposPanel from '../components/Admin/EquiposPanel.jsx';
import PanelCompetencias from '../components/Admin/PanelCompetencias.jsx';
import './AdminPanel.css';

const todayInput = () => new Date().toISOString().split('T')[0];

const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const getKycDetails = (certificadoPdf) => {
    if (!certificadoPdf) return { role: 'Profesor', pdfUrl: '' };
    if (certificadoPdf.includes(':')) {
        const parts = certificadoPdf.split(':');
        if (parts[0] === 'Entrenador' || parts[0] === 'Profesor') {
            const role = parts[0];
            const path = parts.slice(1).join(':');
            return { role, pdfUrl: path };
        }
    }
    return { role: 'Profesor', pdfUrl: certificadoPdf };
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5071/api/v1';

const menuItems = [
    { id: 'usuarios', label: 'Gestión de usuarios', icon: 'bi bi-people-fill' },
    { id: 'equipos', label: 'Gestión de equipos', icon: 'bi bi-microsoft-teams' },
    { id: 'canchas', label: 'Gestión de canchas', icon: 'bi bi-grid-3x3-gap' },
    { id: 'reservas', label: 'Reservas y turnos', icon: 'bi bi-calendar-check' },
    { id: 'pagos', label: 'Pagos y recibos', icon: 'bi bi-credit-card' },
    { id: 'ligas', label: 'Ligas y torneos', icon: 'bi bi-trophy' },
    { id: 'clases', label: 'Clases y entren.', icon: 'bi bi-journal-text' },
    { id: 'reportes', label: 'Reportes', icon: 'bi bi-bar-chart-line' }
];

const statusFilters = ['Todas', 'Pendiente', 'Confirmada', 'Cancelada'];

export default function AdminPanel() {
    const { user, logout, loading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { notify } = useToast();

    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

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

    const setMessage = (msg) => {
        if (!msg) return;
        notify(msg, msg.toLowerCase().includes('error') ? 'error' : 'success');
    };

    const [activeSection, setActiveSection] = useState('reservas');
    const [selectedDate, setSelectedDate] = useState(todayInput());
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [loading, setLoading] = useState(true);

    const [reservas, setReservas] = useState([]);
    const [canchas, setCanchas] = useState([]);
    const [users, setUsers] = useState([]);

    const [showCanchaForm, setShowCanchaForm] = useState(false);
    const [canchaForm, setCanchaForm] = useState({ superficie: '', capacidad: 10, tipoCancha: 'Futbol5', duracionMaximaMinutos: 60, precioHora: 4500 });
    const [editingCanchaId, setEditingCanchaId] = useState(null);
    const [editCanchaForm, setEditCanchaForm] = useState({ superficie: '', capacidad: 10, duracionMaximaMinutos: 60, precioHora: 4500, estado: 'Disponible' });

    // Simulador de pago externo (Rapipago / demo)
    const [codigoRapipago, setCodigoRapipago] = useState('');
    const [simulandoPago, setSimulandoPago] = useState(false);
    const [resultadoSimulacion, setResultadoSimulacion] = useState(null);

    const [showReservaForm, setShowReservaForm] = useState(false);
    const [reservaForm, setReservaForm] = useState({
        canchaId: '', personaId: '', fecha: todayInput(),
        horaInicio: '20:00', horaFin: '21:00', precio: 4500, pago: false
    });

    const [roleFilter, setRoleFilter] = useState('Todos');
    const [showCreateUserForm, setShowCreateUserForm] = useState(false);
    const [createUserFormData, setCreateUserFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol: 'Usuario',
        certificacion: true,
        fechaVencimientoCertificacion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });

    const [userDetailPanel, setUserDetailPanel] = useState(null); // user object shown in detail panel

    const [usuariosSubTab, setUsuariosSubTab] = useState('lista');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        id: 0,
        nombre: '',
        apellido: '',
        dni: 0,
        email: '',
        rol: 'Usuario',
        legajo: 0,
        direccion: '',
        telefono: '',
        certificacion: true,
        fechaVencimientoCertificacion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedDate) params.fecha = selectedDate;
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
        if (authLoading) return;
        if (!user || user.rol !== 'Administrador') navigate('/');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const reservasByCancha = useMemo(() => {
        return reservas.reduce((groups, reserva) => {
            const key = reserva.cancha || `Cancha #${reserva.canchaId}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(reserva);
            return groups;
        }, {});
    }, [reservas]);

    const metrics = useMemo(() => {
        const confirmed = reservas.filter(r => r.estado === 'Confirmada').length;
        const pending = reservas.filter(r => r.estado === 'Pendiente').length;
        const canceled = reservas.filter(r => r.estado === 'Cancelada').length;
        const revenue = reservas
            .filter(r => r.estado !== 'Cancelada')
            .reduce((total, r) => total + Number(r.precio || 0), 0);

        return { confirmed, pending, canceled, revenue };
    }, [reservas]);

    const pendingKycUsers = useMemo(() => {
        return users.filter(u => u.rol === 'Usuario' && u.certificadoPdf && u.certificadoPdf.trim() !== '');
    }, [users]);

    const filteredUsers = useMemo(() => {
        let list = users;
        if (roleFilter !== 'Todos') {
            list = list.filter(u => u.rol === roleFilter);
        }
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            list = list.filter(u => {
                const fullName = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
                const email = (u.email || '').toLowerCase();
                const dni = String(u.dni || '');
                return fullName.includes(term) || email.includes(term) || dni.includes(term);
            });
        }
        return list;
    }, [users, roleFilter, searchTerm]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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
            setCanchaForm({ superficie: '', capacidad: 10, tipoCancha: 'Futbol5', duracionMaximaMinutos: 60, precioHora: 4500 });
            fetchAll();
        } catch (err) {
            notify(err.message || 'No se pudo crear la cancha', 'error');
        }
    };

    const handleEditCancha = (c) => {
        setEditingCanchaId(c.id);
        setEditCanchaForm({
            superficie: c.superficie || '',
            capacidad: c.capacidad || 10,
            tipoCancha: c.tipoCancha || 'Futbol5',
            duracionMaximaMinutos: c.duracionMaximaMinutos || 60,
            precioHora: c.precioHora || 4500,
            estado: c.estado || 'Disponible'
        });
    };

    const handleUpdateCancha = async (e) => {
        e.preventDefault();
        try {
            await canchasApi.update(editingCanchaId, editCanchaForm);
            notify('Cancha actualizada con éxito', 'success');
            setEditingCanchaId(null);
            fetchAll();
        } catch (err) {
            notify(err.message || 'No se pudo actualizar la cancha', 'error');
        }
    };

    const handleDeleteCancha = (id) => {
        showConfirm('¿Estás seguro de eliminar esta cancha? Solo se puede eliminar si no tiene reservas activas.', async () => {
            try {
                await canchasApi.remove(id);
                notify('Cancha eliminada con éxito', 'success');
                fetchAll();
            } catch (err) {
                notify(err.message || 'No se pudo eliminar la cancha', 'error');
            }
        }, 'Eliminar cancha');
    };

    const handleSimularPagoExterno = async () => {
        if (!codigoRapipago.trim()) {
            notify('Ingresá el código de pago', 'warning');
            return;
        }
        setSimulandoPago(true);
        setResultadoSimulacion(null);
        try {
            const res = await fetch(`${API_URL}/reservas/simular-pago-externo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoPago: codigoRapipago.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.title || data || 'Error al simular pago');
            setResultadoSimulacion({ ok: true, mensaje: data.mensaje });
            notify('✅ Pago simulado con éxito. Reserva confirmada.', 'success');
            setCodigoRapipago('');
            fetchAll();
        } catch (err) {
            setResultadoSimulacion({ ok: false, mensaje: err.message });
            notify(err.message, 'error');
        } finally {
            setSimulandoPago(false);
        }
    };

    const handleCreateReserva = async (e) => {
        e.preventDefault();
        try {
            await reservasApi.create({
                ...reservaForm,
                canchaId: Number(reservaForm.canchaId),
                personaId: Number(reservaForm.personaId),
                precio: Number(reservaForm.precio),
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

    const handleEditUser = (selectedUser) => {
        setEditingUser(selectedUser.id);
        setUserFormData({
            id: selectedUser.id,
            nombre: selectedUser.nombre,
            apellido: selectedUser.apellido,
            dni: selectedUser.dni,
            email: selectedUser.email,
            rol: selectedUser.rol || 'Usuario',
            legajo: selectedUser.legajo || 0,
            direccion: selectedUser.direccion || '',
            telefono: selectedUser.telefono || '',
            fotoPerfil: selectedUser.fotoPerfil || null,
            certificadoPdf: selectedUser.certificadoPdf || null,
            certificacion: selectedUser.certificacion ?? selectedUser.certificado ?? true,
            fechaVencimientoCertificacion: selectedUser.fechaVencimientoCertificacion
                ? new Date(selectedUser.fechaVencimientoCertificacion).toISOString().split('T')[0]
                : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...userFormData,
                direccion: userFormData.direccion,
                telefono: userFormData.telefono,
                certificacion: userFormData.rol === 'Profesor' || userFormData.rol === 'Entrenador'
                    ? Boolean(userFormData.certificacion)
                    : null,
                fechaVencimientoCertificacion: userFormData.rol === 'Profesor' || userFormData.rol === 'Entrenador'
                    ? new Date(userFormData.fechaVencimientoCertificacion).toISOString()
                    : null
            };

            await usersApi.update(userFormData.id, payload);
            notify('Usuario actualizado con éxito', 'success');
            setEditingUser(null);
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al actualizar', 'error');
        }
    };

    const handleDeleteUser = (id) => {
        showConfirm('¿Estás seguro de eliminar este usuario?', async () => {
            try {
                await usersApi.remove(id);
                notify('Usuario eliminado', 'success');
                fetchAll();
            } catch (err) {
                notify(err.message || 'Error al eliminar', 'error');
            }
        });
    };

    const handleKycAction = (targetUser, newRol, isApprove) => {
        const actionLabel = isApprove ? `aprobar como ${newRol}` : 'rechazar';
        showConfirm(`¿Estás seguro de que deseas ${actionLabel} la solicitud de ${targetUser.nombre} ${targetUser.apellido}?`, async () => {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);

            const payload = {
                id: targetUser.id,
                nombre: targetUser.nombre,
                apellido: targetUser.apellido,
                dni: targetUser.dni,
                email: targetUser.email,
                rol: isApprove ? newRol : 'Usuario',
                legajo: targetUser.legajo || 0,
                direccion: targetUser.direccion || '',
                telefono: targetUser.telefono || '',
                fotoPerfil: targetUser.fotoPerfil || null,
                certificacion: isApprove,
                fechaVencimientoCertificacion: isApprove ? nextYear.toISOString() : null,
                certificadoPdf: isApprove ? targetUser.certificadoPdf : null
            };

            try {
                await usersApi.update(targetUser.id, payload);
                notify(isApprove ? `Usuario aprobado como ${newRol} con éxito` : 'Solicitud rechazada con éxito', 'success');
                fetchAll();
            } catch (error) {
                notify(`Error al procesar solicitud: ${error.message}`, 'error');
            }
        });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        try {
            await authApi.register(createUserFormData);
            notify('Usuario creado con éxito', 'success');
            setShowCreateUserForm(false);
            setCreateUserFormData({
                nombre: '', apellido: '', email: '', password: '', rol: 'Usuario',
                certificacion: true,
                fechaVencimientoCertificacion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            });
            fetchAll();
        } catch (error) {
            notify(`Error al crear usuario: ${error.message}`, 'error');
        }
    };

    const handlePrintUser = (selectedUser) => {
        const printWindow = window.open('', '_blank', 'width=600,height=520');
        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha de Usuario - ${selectedUser.nombre} ${selectedUser.apellido}</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #0b130e; color: #fff; padding: 40px; text-align: center; }
                    .card { border: 2px solid #28a745; border-radius: 12px; padding: 25px; display: inline-block; background-color: #111d13; text-align: left; max-width: 400px; width: 100%; }
                    .header { font-size: 20px; font-weight: bold; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-bottom: 20px; color: #28a745; text-align: center; }
                    .field { margin-bottom: 12px; font-size: 15px; }
                    .label { color: #888; font-weight: bold; }
                    .value { color: #fff; margin-left: 8px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">GOL AHORA - CREDENCIAL</div>
                    <div class="field"><span class="label">ID:</span><span class="value">${selectedUser.id}</span></div>
                    <div class="field"><span class="label">Nombre completo:</span><span class="value">${selectedUser.nombre} ${selectedUser.apellido}</span></div>
                    <div class="field"><span class="label">DNI:</span><span class="value">${selectedUser.dni}</span></div>
                    <div class="field"><span class="label">Legajo:</span><span class="value">${selectedUser.legajo || 'N/A'}</span></div>
                    <div class="field"><span class="label">Dirección:</span><span class="value">${selectedUser.direccion || '—'}</span></div>
                    <div class="field"><span class="label">Teléfono:</span><span class="value">${selectedUser.telefono || '—'}</span></div>
                    <div class="field"><span class="label">Email:</span><span class="value">${selectedUser.email}</span></div>
                    <div class="field"><span class="label">Rol asignado:</span><span class="value">${selectedUser.rol}</span></div>
                    ${(selectedUser.rol === 'Profesor' || selectedUser.rol === 'Entrenador') ? `
                    <div class="field"><span class="label">Certificación:</span><span class="value" style="color:${(selectedUser.certificacion ?? selectedUser.certificado) ? '#28a745' : '#dc3545'}; font-weight: bold;">${(selectedUser.certificacion ?? selectedUser.certificado) ? 'VERIFICADA Y VIGENTE' : 'PENDIENTE / NO VIGENTE'}</span></div>
                    ` : ''}
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getBracketSize = (teamCount) => {
        let size = 1;
        while (size < Math.max(2, teamCount || 2)) size *= 2;
        return size;
    };

    const getTorneoRoundName = (teamCount, roundNumber) => {
        let remaining = getBracketSize(teamCount);
        for (let round = 1; round < roundNumber; round += 1) remaining = Math.max(2, Math.floor(remaining / 2));
        if (remaining <= 2) return 'Final';
        if (remaining <= 4) return 'Semifinal';
        if (remaining <= 8) return 'Cuartos';
        if (remaining <= 16) return 'Octavos';
        return `Ronda de ${remaining}`;
    };

    const getTorneoFixtures = (torneoDetails) => (torneoDetails?.fixtures || [])
        .slice()
        .sort((a, b) => (a.numero || 0) - (b.numero || 0))
        .map(fixture => ({
            ...fixture,
            partidos: (torneoDetails?.partidos || [])
                .filter(partido => partido.fixtureId === fixture.id)
                .slice()
                .sort((a, b) => new Date(a.fechaHora || 0) - new Date(b.fechaHora || 0))
        }));

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
                            <i className={`${item.icon} me-2`}></i> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
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
                                <input type="time" value={reservaForm.horaFin} onChange={e => setReservaForm(f => ({ ...f, horaFin: e.target.value }))} required />
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
                                                    {r.estado !== 'Cancelada' && <button className="danger" onClick={() => updateReservaEstado(r.id, 'Cancelada')}>Cancelar</button>}
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
                {activeSection === 'equipos' && (
                    <EquiposPanel setMessage={setMessage} />
                )}

                {activeSection === 'canchas' && (
                    <section className="admin-panel">
                        {/* Formulario nueva cancha */}
                        <div className="section-actions">
                            <button className="primary-action" onClick={() => setShowCanchaForm(v => !v)}>
                                {showCanchaForm ? 'Cancelar' : '+ Nueva cancha'}
                            </button>
                        </div>
                        {showCanchaForm && (
                            <form className="admin-form" onSubmit={handleCreateCancha} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '650px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Superficie / Nombre</label>
                                        <input type="text" placeholder="Ej: Cancha Techada Norte" value={canchaForm.superficie}
                                            onChange={e => setCanchaForm(f => ({ ...f, superficie: e.target.value }))} required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Tipo de cancha</label>
                                        <select value={canchaForm.tipoCancha} onChange={e => setCanchaForm(f => ({ ...f, tipoCancha: e.target.value }))}>
                                            <option value="Futbol5">Fútbol 5</option>
                                            <option value="Futbol7">Fútbol 7</option>
                                            <option value="Futbol11">Fútbol 11</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Capacidad (jugadores)</label>
                                        <input type="number" min="2" max="30" value={canchaForm.capacidad}
                                            onChange={e => setCanchaForm(f => ({ ...f, capacidad: parseInt(e.target.value) }))} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>⏱ Duración máxima (minutos)</label>
                                        <input type="number" min="30" max="240" step="15" value={canchaForm.duracionMaximaMinutos}
                                            onChange={e => setCanchaForm(f => ({ ...f, duracionMaximaMinutos: parseInt(e.target.value) }))}
                                            placeholder="60" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>💰 Precio por hora (ARS)</label>
                                        <input type="number" min="0" step="100" value={canchaForm.precioHora}
                                            onChange={e => setCanchaForm(f => ({ ...f, precioHora: parseFloat(e.target.value) }))}
                                            placeholder="4500" />
                                    </div>
                                </div>
                                <button type="submit" className="primary-action" style={{ alignSelf: 'flex-start', minHeight: '40px', marginTop: '8px' }}>Guardar cancha</button>
                            </form>
                        )}

                        {/* Modal edición de cancha */}
                        {editingCanchaId && (
                            <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                <form onSubmit={handleUpdateCancha} style={{ background: '#111d13', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                                    <h3 style={{ margin: 0, color: '#eab308', fontWeight: 'bold', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                                        Modificar Cancha #{editingCanchaId}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700 }}>Superficie / Nombre</label>
                                            <input type="text" value={editCanchaForm.superficie} onChange={e => setEditCanchaForm(f => ({ ...f, superficie: e.target.value }))} required style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700 }}>Capacidad</label>
                                            <input type="number" min="2" max="30" value={editCanchaForm.capacidad} onChange={e => setEditCanchaForm(f => ({ ...f, capacidad: parseInt(e.target.value) }))} style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700 }}>Estado</label>
                                            <select value={editCanchaForm.estado} onChange={e => setEditCanchaForm(f => ({ ...f, estado: e.target.value }))} style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                                                <option value="Disponible">Disponible</option>
                                                <option value="Ocupada">Ocupada</option>
                                                <option value="Mantenimiento">Mantenimiento</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700 }}>⏱ Duración máxima (min)</label>
                                            <input type="number" min="30" max="240" step="15" value={editCanchaForm.duracionMaximaMinutos} onChange={e => setEditCanchaForm(f => ({ ...f, duracionMaximaMinutos: parseInt(e.target.value) }))} style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700 }}>💰 Precio por hora (ARS)</label>
                                            <input type="number" min="0" step="100" value={editCanchaForm.precioHora} onChange={e => setEditCanchaForm(f => ({ ...f, precioHora: parseFloat(e.target.value) }))} style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                                        <button type="button" className="btn btn-secondary" style={{ borderRadius: '8px', padding: '10px 20px' }} onClick={() => setEditingCanchaId(null)}>Cancelar</button>
                                        <button type="submit" style={{ backgroundColor: '#eab308', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', color: '#000', cursor: 'pointer' }}>Guardar cambios</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Tabla de canchas */}
                        <div className="data-table">
                            <table>
                                <thead><tr><th>ID</th><th>Superficie</th><th>Tipo</th><th>Capacidad</th><th>Duración máx.</th><th>Precio/h</th><th>Estado</th><th style={{ width: 100 }}>Acciones</th></tr></thead>
                                <tbody>
                                    {canchas.map(c => (
                                        <tr key={c.id}>
                                            <td>#{c.id}</td>
                                            <td>{c.superficie}</td>
                                            <td>{c.tipoCancha || '—'}</td>
                                            <td>{c.capacidad} jugadores</td>
                                            <td>{c.duracionMaximaMinutos || 60} min</td>
                                            <td>{moneyFmt.format(c.precioHora || 4500)}</td>
                                            <td><span className="pill success">{c.estado}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <button
                                                        title="Modificar cancha"
                                                        onClick={() => handleEditCancha(c)}
                                                        style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.1)', color: '#eab308', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.25)'; e.currentTarget.style.borderColor = '#eab308'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.1)'; e.currentTarget.style.borderColor = 'rgba(234,179,8,0.3)'; }}
                                                    >
                                                        <i className="bi bi-pencil-fill" style={{ fontSize: '0.8rem' }}></i>
                                                    </button>
                                                    <button
                                                        title="Eliminar cancha"
                                                        onClick={() => handleDeleteCancha(c.id)}
                                                        style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                                                    >
                                                        <i className="bi bi-trash3-fill" style={{ fontSize: '0.8rem' }}></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Simulador de pago externo (Rapipago) — herramienta de demo */}
                        <div style={{
                            marginTop: 32, background: 'rgba(234,179,8,0.07)', border: '1px dashed rgba(234,179,8,0.35)',
                            borderRadius: 16, padding: '24px'
                        }}>
                            <h3 style={{ margin: '0 0 4px', color: '#eab308', fontSize: '1rem', fontWeight: 800 }}>
                                🧪 Herramienta de Demo: Simular Pago Externo (Rapipago)
                            </h3>
                            <p style={{ color: '#8ca092', fontSize: '0.85rem', margin: '0 0 16px' }}>
                                Cuando un usuario elige &quot;Efectivo&quot;, el sistema genera un código de pago (ej. <code>RP-59281</code>).
                                Ingresá ese código aquí para simular que Rapipago envió la confirmación de cobro y la reserva pase a &quot;Confirmada&quot;.
                            </p>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    id="input-codigo-rapipago"
                                    type="text"
                                    placeholder="Código Rapipago (ej: RP-59281)"
                                    value={codigoRapipago}
                                    onChange={e => setCodigoRapipago(e.target.value.toUpperCase())}
                                    style={{
                                        padding: '10px 14px', background: '#0a100c', border: '1px solid rgba(234,179,8,0.4)',
                                        borderRadius: 10, color: '#eab308', fontWeight: 700, fontSize: '0.95rem',
                                        letterSpacing: 1, minWidth: 220
                                    }}
                                />
                                <button
                                    id="btn-simular-pago-externo"
                                    onClick={handleSimularPagoExterno}
                                    disabled={simulandoPago}
                                    style={{
                                        padding: '10px 20px', background: simulandoPago ? '#444' : '#eab308',
                                        color: '#0a0a00', border: 'none', borderRadius: 10,
                                        fontWeight: 800, cursor: simulandoPago ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {simulandoPago ? 'Procesando...' : '⚡ Confirmar Pago'}
                                </button>
                            </div>
                            {resultadoSimulacion && (
                                <p style={{
                                    marginTop: 12, fontSize: '0.88rem', fontWeight: 700,
                                    color: resultadoSimulacion.ok ? '#31d94f' : '#ef4444'
                                }}>
                                    {resultadoSimulacion.ok ? '✅' : '❌'} {resultadoSimulacion.mensaje}
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {/* ── USUARIOS ── */}
                {activeSection === 'usuarios' && (
                    <section className="admin-panel">
                        {!editingUser && (
                            <div className="status-tabs" style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
                                <button
                                    className={usuariosSubTab === 'lista' ? 'active' : ''}
                                    onClick={() => setUsuariosSubTab('lista')}
                                >
                                    Lista de Usuarios
                                </button>
                                <button
                                    className={usuariosSubTab === 'kyc' ? 'active' : ''}
                                    onClick={() => {
                                        setUsuariosSubTab('kyc');
                                        fetchAll();
                                    }}
                                >
                                    Solicitudes Pendientes (KYC) {pendingKycUsers.length > 0 && (
                                        <span className="badge bg-danger ms-1" style={{ fontSize: '0.7rem', padding: '3px 6px', borderRadius: '50%' }}>
                                            {pendingKycUsers.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}

                        {editingUser && (
                            <div className="admin-modal-overlay" style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0,0,0,0.65)',
                                backdropFilter: 'blur(8px)',
                                zIndex: 1050,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px'
                            }}>
                                <form className="admin-modal-card" onSubmit={handleUpdateUser} style={{
                                    background: '#111d13',
                                    border: '1px solid rgba(49, 217, 79, 0.2)',
                                    borderRadius: '16px',
                                    padding: '30px',
                                    width: '100%',
                                    maxWidth: '600px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                }}>
                                    <h3 style={{ margin: 0, color: '#31d94f', fontWeight: 'bold', fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                                        Editar Perfil de Usuario
                                    </h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Nombre</label>
                                            <input
                                                type="text"
                                                placeholder="Nombre"
                                                value={userFormData.nombre}
                                                onChange={(e) => setUserFormData({ ...userFormData, nombre: e.target.value })}
                                                required
                                                style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Apellido</label>
                                            <input
                                                type="text"
                                                placeholder="Apellido"
                                                value={userFormData.apellido}
                                                onChange={(e) => setUserFormData({ ...userFormData, apellido: e.target.value })}
                                                required
                                                style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>DNI</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="DNI"
                                                value={userFormData.dni || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setUserFormData({ ...userFormData, dni: val ? parseInt(val) : 0 });
                                                }}
                                                required
                                                style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Email</label>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={userFormData.email}
                                                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                                required
                                                style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Legajo</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Legajo"
                                                value={userFormData.legajo || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setUserFormData({ ...userFormData, legajo: val ? parseInt(val) : 0 });
                                                }}
                                                style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Rol</label>
                                            <select
                                                value={userFormData.rol}
                                                onChange={(e) => setUserFormData({ ...userFormData, rol: e.target.value })}
                                                style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            >
                                                <option value="Usuario">Cliente / Usuario</option>
                                                <option value="Empleado">Empleado</option>
                                                <option value="Profesor">Profesor</option>
                                                <option value="Entrenador">Entrenador</option>
                                                <option value="Administrador">Administrador</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Dirección</label>
                                            <input
                                                type="text"
                                                placeholder="Dirección"
                                                value={userFormData.direccion}
                                                onChange={(e) => setUserFormData({ ...userFormData, direccion: e.target.value })}
                                                style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Teléfono</label>
                                            <input
                                                type="text"
                                                placeholder="Teléfono"
                                                value={userFormData.telefono}
                                                onChange={(e) => setUserFormData({ ...userFormData, telefono: e.target.value })}
                                                style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            />
                                        </div>
                                    </div>

                                    {(userFormData.rol === 'Profesor' || userFormData.rol === 'Entrenador') && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(149,255,172,0.15)' }}>
                                            <label className="check-field" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={userFormData.certificacion}
                                                    onChange={(e) => setUserFormData({ ...userFormData, certificacion: e.target.checked })}
                                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                                />
                                                Certificación Deportiva Vigente
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: '0.8rem', color: '#8ca092', textTransform: 'uppercase', fontWeight: 'bold' }}>Vencimiento:</span>
                                                <input
                                                    type="date"
                                                    value={userFormData.fechaVencimientoCertificacion}
                                                    onChange={(e) => setUserFormData({ ...userFormData, fechaVencimientoCertificacion: e.target.value })}
                                                    style={{ minHeight: 36, padding: '0 8px', background: '#080c0a', color: '#fff', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 6 }}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '8px' }}>
                                        <button type="button" className="btn btn-secondary" style={{ borderRadius: '8px', padding: '10px 20px' }} onClick={() => setEditingUser(null)}>Cancelar</button>
                                        <button type="submit" className="btn btn-success" style={{ backgroundColor: '#31d94f', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', color: '#000' }}>Guardar cambios</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {usuariosSubTab === 'lista' && !editingUser && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                    <div className="status-tabs" style={{ display: 'flex', gap: '6px', margin: 0, flexWrap: 'wrap' }}>
                                        <button className={roleFilter === 'Todos' ? 'active' : ''} onClick={() => setRoleFilter('Todos')}>Todos</button>
                                        <button className={roleFilter === 'Usuario' ? 'active' : ''} onClick={() => setRoleFilter('Usuario')}>Usuarios</button>
                                        <button className={roleFilter === 'Profesor' ? 'active' : ''} onClick={() => setRoleFilter('Profesor')}>Profesores</button>
                                        <button className={roleFilter === 'Entrenador' ? 'active' : ''} onClick={() => setRoleFilter('Entrenador')}>Entrenadores</button>
                                        <button className={roleFilter === 'Empleado' ? 'active' : ''} onClick={() => setRoleFilter('Empleado')}>Empleados</button>
                                        <button className={roleFilter === 'Administrador' ? 'active' : ''} onClick={() => setRoleFilter('Administrador')}>Administradores</button>
                                    </div>
                                    <button className="primary-action" onClick={() => setShowCreateUserForm(!showCreateUserForm)}>
                                        {showCreateUserForm ? 'Cancelar' : '+ Nuevo usuario'}
                                    </button>
                                </div>

                                <div className="mb-4" style={{ maxWidth: '450px', position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8ca092', fontSize: '1rem', pointerEvents: 'none' }}>
                                        <i className="bi bi-search"></i>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar usuario por nombre, DNI o correo..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px 10px 40px',
                                            background: '#0a100c',
                                            border: '1px solid rgba(49, 217, 79, 0.25)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#31d94f'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(49, 217, 79, 0.25)'}
                                    />
                                </div>

                                {showCreateUserForm && (
                                    <div className="admin-modal-overlay" style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.65)',
                                        backdropFilter: 'blur(8px)',
                                        zIndex: 1050,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '20px'
                                    }}>
                                        <form className="admin-modal-card" onSubmit={handleCreateUser} style={{
                                            background: '#111d13',
                                            border: '1px solid rgba(49, 217, 79, 0.2)',
                                            borderRadius: '16px',
                                            padding: '30px',
                                            width: '100%',
                                            maxWidth: '500px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '20px',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                        }}>
                                            <h3 style={{ margin: 0, color: '#31d94f', fontWeight: 'bold', fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                                                Crear Nuevo Usuario
                                            </h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Nombre</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre"
                                                        value={createUserFormData.nombre}
                                                        onChange={(e) => setCreateUserFormData({ ...createUserFormData, nombre: e.target.value })}
                                                        required
                                                        style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Apellido</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Apellido"
                                                        value={createUserFormData.apellido}
                                                        onChange={(e) => setCreateUserFormData({ ...createUserFormData, apellido: e.target.value })}
                                                        required
                                                        style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Email</label>
                                                    <input
                                                        type="email"
                                                        placeholder="Email"
                                                        value={createUserFormData.email}
                                                        onChange={(e) => setCreateUserFormData({ ...createUserFormData, email: e.target.value })}
                                                        required
                                                        style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Contraseña</label>
                                                    <input
                                                        type="password"
                                                        placeholder="Contraseña"
                                                        value={createUserFormData.password}
                                                        onChange={(e) => setCreateUserFormData({ ...createUserFormData, password: e.target.value })}
                                                        required
                                                        style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#8ca092', fontWeight: 'bold' }}>Rol</label>
                                                    <select
                                                        value={createUserFormData.rol}
                                                        onChange={(e) => setCreateUserFormData({ ...createUserFormData, rol: e.target.value })}
                                                        style={{ padding: '10px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                                    >
                                                        <option value="Usuario">Cliente / Usuario</option>
                                                        <option value="Empleado">Empleado</option>
                                                        <option value="Profesor">Profesor</option>
                                                        <option value="Entrenador">Entrenador</option>
                                                        <option value="Administrador">Administrador</option>
                                                    </select>
                                                </div>

                                                {(createUserFormData.rol === 'Profesor' || createUserFormData.rol === 'Entrenador') && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(149,255,172,0.15)', marginTop: '8px' }}>
                                                        <label className="check-field" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={createUserFormData.certificacion}
                                                                onChange={(e) => setCreateUserFormData({ ...createUserFormData, certificacion: e.target.checked })}
                                                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                                                            />
                                                            Certificación Deportiva Vigente
                                                        </label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <span style={{ fontSize: '0.8rem', color: '#8ca092', textTransform: 'uppercase', fontWeight: 'bold' }}>Vencimiento:</span>
                                                            <input
                                                                type="date"
                                                                value={createUserFormData.fechaVencimientoCertificacion}
                                                                onChange={(e) => setCreateUserFormData({ ...createUserFormData, fechaVencimientoCertificacion: e.target.value })}
                                                                style={{ minHeight: 36, padding: '0 8px', background: '#080c0a', color: '#fff', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 6 }}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '8px' }}>
                                                <button type="button" className="btn btn-secondary" style={{ borderRadius: '8px', padding: '10px 20px' }} onClick={() => {
                                                    setShowCreateUserForm(false);
                                                    setCreateUserFormData({
                                                        nombre: '',
                                                        apellido: '',
                                                        email: '',
                                                        password: '',
                                                        rol: 'Usuario',
                                                        certificacion: true,
                                                        fechaVencimientoCertificacion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
                                                    });
                                                }}>Cancelar</button>
                                                <button type="submit" className="btn btn-success" style={{ backgroundColor: '#31d94f', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', color: '#000' }}>Crear Usuario</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="data-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>DNI</th>
                                                <th>Contacto</th>
                                                <th>Email</th>
                                                <th>Rol / Certif.</th>
                                                <th style={{ width: 120 }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#8ca092' }}>
                                                        No hay usuarios registrados con este rol.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map(selectedUser => (
                                                    <tr key={selectedUser.id}>
                                                        <td><span style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700 }}>#{selectedUser.id}</span></td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <button
                                                                    title="Ver ficha detallada"
                                                                    onClick={() => setUserDetailPanel(selectedUser)}
                                                                    style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(49,217,79,0.15)', border: '2px solid rgba(49,217,79,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', color: '#31d94f', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', padding: 0 }}
                                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#31d94f'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(49,217,79,0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                                >
                                                                    {selectedUser.fotoPerfil
                                                                        ? <img src={`http://localhost:5071${selectedUser.fotoPerfil}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                                        : selectedUser.nombre?.[0]?.toUpperCase()
                                                                    }
                                                                </button>
                                                                <span
                                                                    onClick={() => setUserDetailPanel(selectedUser)}
                                                                    style={{ fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.15s' }}
                                                                    onMouseEnter={e => e.currentTarget.style.color = '#31d94f'}
                                                                    onMouseLeave={e => e.currentTarget.style.color = ''}
                                                                    title="Ver ficha detallada"
                                                                >
                                                                    {selectedUser.nombre} {selectedUser.apellido}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ color: '#a0b4a8', fontSize: '0.85rem' }}>{selectedUser.dni || '—'}</td>
                                                        <td>
                                                            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                <span><i className="bi bi-telephone-fill text-success me-1"></i> {selectedUser.telefono || '—'}</span>
                                                                <span style={{ color: '#8ca092' }}><i className="bi bi-geo-alt-fill text-success me-1"></i> {selectedUser.direccion || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem', color: '#c5d8ca' }}>{selectedUser.email}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                                                <span className="pill neutral">{selectedUser.rol}</span>
                                                                {(selectedUser.rol === 'Profesor' || selectedUser.rol === 'Entrenador') && (
                                                                    <span className={`pill ${(selectedUser.certificacion ?? selectedUser.certificado) ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem', padding: '2px 6px', height: 'auto', minHeight: 'auto' }}>
                                                                        {(selectedUser.certificacion ?? selectedUser.certificado) ? '✓ Certificado OK' : '✗ Sin Certif.'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                <button
                                                                    title="Editar usuario"
                                                                    onClick={() => handleEditUser(selectedUser)}
                                                                    style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(49,217,79,0.25)', background: 'rgba(49,217,79,0.08)', color: '#31d94f', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(49,217,79,0.2)'; e.currentTarget.style.borderColor = '#31d94f'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(49,217,79,0.08)'; e.currentTarget.style.borderColor = 'rgba(49,217,79,0.25)'; }}
                                                                >
                                                                    <i className="bi bi-pencil-fill" style={{ fontSize: '0.8rem' }}></i>
                                                                </button>
                                                                <button
                                                                    title="Imprimir credencial"
                                                                    onClick={() => handlePrintUser(selectedUser)}
                                                                    style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#a0b4a8', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a0b4a8'; }}
                                                                >
                                                                    <i className="bi bi-printer-fill" style={{ fontSize: '0.8rem' }}></i>
                                                                </button>
                                                                <button
                                                                    title="Eliminar usuario"
                                                                    onClick={() => handleDeleteUser(selectedUser.id)}
                                                                    style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                                                                >
                                                                    <i className="bi bi-trash3-fill" style={{ fontSize: '0.8rem' }}></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {usuariosSubTab === 'kyc' && !editingUser && (
                            <div className="data-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>DNI</th>
                                            <th>Contacto</th>
                                            <th>Email</th>
                                            <th>Puesto Solicitado</th>
                                            <th>Certificado PDF</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingKycUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#8ca092' }}>
                                                    No hay solicitudes pendientes de validación (KYC).
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingKycUsers.map(selectedUser => {
                                                const { role, pdfUrl } = getKycDetails(selectedUser.certificadoPdf);
                                                const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `http://localhost:5071${pdfUrl}`;
                                                return (
                                                    <tr key={selectedUser.id}>
                                                        <td>#{selectedUser.id}</td>
                                                        <td style={{ fontWeight: 'bold' }}>{selectedUser.nombre} {selectedUser.apellido}</td>
                                                        <td>{selectedUser.dni}</td>
                                                        <td>
                                                            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                <span><i className="bi bi-telephone-fill text-success me-1"></i> {selectedUser.telefono || '—'}</span>
                                                                <span style={{ color: '#8ca092' }}><i className="bi bi-geo-alt-fill text-success me-1"></i> {selectedUser.direccion || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td>{selectedUser.email}</td>
                                                        <td>
                                                            <span className="pill neutral" style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                                                {role}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <a
                                                                href={fullUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="pill success text-decoration-none"
                                                                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-block', fontWeight: 'bold' }}
                                                            >
                                                                <i className="bi bi-file-earmark-pdf-fill me-1"></i> Ver Documento PDF
                                                            </a>
                                                        </td>
                                                        <td className="table-actions">
                                                            <button
                                                                onClick={() => handleKycAction(selectedUser, role, true)}
                                                                style={{ backgroundColor: '#1b4332', borderColor: '#2d6a4f', color: '#52b788', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}
                                                            >
                                                                Aprobar
                                                            </button>
                                                            <button
                                                                className="danger"
                                                                onClick={() => handleKycAction(selectedUser, 'Usuario', false)}
                                                                style={{ padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {activeSection === 'pagos' && <PagosPanel moneyFmt={moneyFmt} notify={notify} />}

                {activeSection === 'ligas' && (
                    <LigasTorneosPanel moneyFormatter={moneyFmt} setMessage={setMessage} API_URL={API_URL} />
                )}

                {activeSection === 'clases' && (
                    <ClasesEntrenamientosPanel setMessage={setMessage} API_URL={API_URL} canchas={canchas} />
                )}

                {activeSection === 'reportes' && (
                    <ReportsDashboard notify={notify} moneyFmt={moneyFmt} />
                )}
            </section>
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
            />

            {/* ── User Detail Side Panel ── */}
            {userDetailPanel && (() => {
                // Compute stats from already-loaded reservas state
                const userReservas = reservas.filter(r => r.personaId === userDetailPanel.id || r.persona?.id === userDetailPanel.id);
                const activeReservas = userReservas.filter(r => r.estado === 'Confirmada' || r.estado === 'Pendiente');
                const totalGasto = userReservas.filter(r => r.pago === true || r.pago === 'Pagado').reduce((s, r) => s + (r.precio || 0), 0);
                const pendingPago = userReservas.filter(r => r.pago === false || r.pago === 'Pendiente').length;
                const recentReservas = [...userReservas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 4);

                const moneyFmt = (n) => `$ ${Number(n).toLocaleString('es-AR')}`;
                const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

                return (
                    <>
                        {/* Backdrop */}
                        <div
                            onClick={() => setUserDetailPanel(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1100 }}
                        />
                        {/* Panel */}
                        <aside style={{
                            position: 'fixed', top: 0, right: 0,
                            width: 420, height: '100vh',
                            background: 'linear-gradient(180deg, #0b1410 0%, #080c0a 100%)',
                            borderLeft: '1px solid rgba(49,217,79,0.2)',
                            boxShadow: '-12px 0 60px rgba(0,0,0,0.7)',
                            zIndex: 1101,
                            display: 'flex', flexDirection: 'column',
                            overflowY: 'auto',
                            animation: 'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)'
                        }}>
                            {/* Header con avatar grande */}
                            <div style={{ padding: '28px 24px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(49,217,79,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(49,217,79,0.3), rgba(49,217,79,0.08))', border: '2px solid rgba(49,217,79,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#31d94f', flexShrink: 0, overflow: 'hidden' }}>
                                             {userDetailPanel.fotoPerfil
                                                 ? <img
                                                     src={`http://localhost:5071${userDetailPanel.fotoPerfil}`}
                                                     alt={`${userDetailPanel.nombre} ${userDetailPanel.apellido}`}
                                                     style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                     onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = userDetailPanel.nombre?.[0]?.toUpperCase(); }}
                                                 />
                                                 : userDetailPanel.nombre?.[0]?.toUpperCase()
                                             }
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{userDetailPanel.nombre} {userDetailPanel.apellido}</h3>
                                            <span style={{ fontSize: '0.72rem', color: '#31d94f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{userDetailPanel.rol}</span>
                                            <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#8ca092' }}>{userDetailPanel.email}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setUserDetailPanel(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#8ca092', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>

                                {/* Stats rápidas - solo para Usuarios */}
                                {userDetailPanel.rol === 'Usuario' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 4 }}>
                                    {[
                                        { label: 'Reservas', value: userReservas.length, color: '#31d94f' },
                                        { label: 'Activas', value: activeReservas.length, color: '#f2b84b' },
                                        { label: 'Gasto total', value: moneyFmt(totalGasto), color: '#31d94f', small: true },
                                        { label: 'Pend. pago', value: pendingPago, color: pendingPago > 0 ? '#ef4444' : '#31d94f' },
                                    ].map(({ label, value, color, small }) => (
                                        <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: small ? '0.75rem' : '1.1rem', fontWeight: 900, color }}>{value}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#8ca092', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
                                        </div>
                                    ))}
                                </div>
                                )}
                            </div>

                            {/* Body */}
                            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

                                {/* Información personal */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14 }}>
                                    <p style={{ margin: '0 0 12px', fontSize: '0.68rem', color: '#31d94f', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        <i className="bi bi-person-lines-fill" style={{ marginRight: 6 }}></i>Información personal
                                    </p>
                                    <div style={{ display: 'grid', gap: 9 }}>
                                        {[
                                            { icon: 'bi-person-badge', label: 'ID Sistema', value: `#${userDetailPanel.id}` },
                                            { icon: 'bi-card-text', label: 'DNI', value: userDetailPanel.dni || '—' },
                                            { icon: 'bi-hash', label: 'Legajo', value: userDetailPanel.legajo || '—' },
                                            { icon: 'bi-telephone-fill', label: 'Teléfono', value: userDetailPanel.telefono || '—' },
                                            { icon: 'bi-geo-alt-fill', label: 'Dirección', value: userDetailPanel.direccion || '—' },
                                        ].map(({ icon, label, value }) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                                                    <i className={`bi ${icon}`} style={{ color: '#31d94f', fontSize: '0.8rem' }}></i>{label}
                                                </span>
                                                <span style={{ fontSize: '0.82rem', color: '#e8f5eb', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Info por rol: Empleado */}
                                {userDetailPanel.rol === 'Empleado' && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14 }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '0.68rem', color: '#31d94f', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            <i className="bi bi-briefcase-fill" style={{ marginRight: 6 }}></i>Datos laborales
                                        </p>
                                        <div style={{ display: 'grid', gap: 9 }}>
                                            {[
                                                { icon: 'bi-building', label: 'Área', value: userDetailPanel.area || '—' },
                                                { icon: 'bi-clock-fill', label: 'Turno', value: userDetailPanel.turno || '—' },
                                            ].map(({ icon, label, value }) => (
                                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8ca092', fontSize: '0.78rem', fontWeight: 700 }}>
                                                        <i className={`bi ${icon}`} style={{ color: '#31d94f' }}></i>{label}
                                                    </span>
                                                    <span style={{ fontSize: '0.82rem', color: '#e8f5eb', fontWeight: 600 }}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Info por rol: Profesor / Entrenador */}
                                {(userDetailPanel.rol === 'Profesor' || userDetailPanel.rol === 'Entrenador') && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14 }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '0.68rem', color: '#31d94f', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            <i className="bi bi-patch-check-fill" style={{ marginRight: 6 }}></i>Documentación
                                        </p>
                                        {/* Estado cert */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <span style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700 }}>Estado certificado</span>
                                            {(() => {
                                                const ok = userDetailPanel.certificacion ?? userDetailPanel.certificado;
                                                return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', background: ok ? 'rgba(49,217,79,0.12)' : 'rgba(239,68,68,0.12)', color: ok ? '#31d94f' : '#ef4444', border: `1px solid ${ok ? 'rgba(49,217,79,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                                    <i className={`bi ${ok ? 'bi-patch-check-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                                                    {ok ? 'Verificado' : 'Sin certificar'}
                                                </span>;
                                            })()}
                                        </div>
                                        {/* Vencimiento */}
                                        {userDetailPanel.fechaVencimientoCertificacion && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <span style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700 }}>Vencimiento</span>
                                                <span style={{ fontSize: '0.82rem', color: '#e8f5eb', fontWeight: 600 }}>
                                                    {fmtDate(userDetailPanel.fechaVencimientoCertificacion)}
                                                </span>
                                            </div>
                                        )}
                                        {/* PDF */}
                                        {userDetailPanel.certificadoPdf ? (() => {
                                            const { pdfUrl } = getKycDetails(userDetailPanel.certificadoPdf);
                                            const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `http://localhost:5071${pdfUrl}`;
                                            return (
                                                <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(49,217,79,0.07)', border: '1px solid rgba(49,217,79,0.2)', borderRadius: 8, color: '#31d94f', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(49,217,79,0.15)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(49,217,79,0.07)'}
                                                >
                                                    <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '1.1rem', color: '#ef4444' }}></i>
                                                    <div><div>Ver certificado PDF</div><div style={{ fontSize: '0.7rem', color: '#8ca092', fontWeight: 400 }}>Abrir en nueva pestaña</div></div>
                                                    <i className="bi bi-box-arrow-up-right" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}></i>
                                                </a>
                                            );
                                        })()
                                        : (<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#8ca092', fontSize: '0.8rem' }}>
                                                <i className="bi bi-file-earmark-x" style={{ color: '#ef4444' }}></i>
                                                No se subió ningún certificado PDF
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Historial de reservas - solo para rol Usuario */}
                                {userDetailPanel.rol === 'Usuario' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14 }}>
                                    <p style={{ margin: '0 0 12px', fontSize: '0.68rem', color: '#31d94f', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        <i className="bi bi-calendar2-check-fill" style={{ marginRight: 6 }}></i>Últimas reservas ({userReservas.length} total)
                                    </p>
                                    {recentReservas.length === 0 ? (
                                        <div style={{ color: '#8ca092', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>Sin reservas registradas</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {recentReservas.map(r => (
                                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e8f5eb' }}>{fmtDate(r.fecha)}</div>
                                                        <div style={{ fontSize: '0.72rem', color: '#8ca092', marginTop: 2 }}>{r.horaInicio} – {r.horaFin} · Cancha #{r.canchaId}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#31d94f' }}>{moneyFmt(r.precio)}</div>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999, background: r.estado === 'Confirmada' ? 'rgba(49,217,79,0.15)' : r.estado === 'Pendiente' ? 'rgba(242,184,75,0.15)' : 'rgba(239,68,68,0.12)', color: r.estado === 'Confirmada' ? '#31d94f' : r.estado === 'Pendiente' ? '#f2b84b' : '#ef4444' }}>
                                                            {r.estado}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                )}

                                {/* Acciones */}
                                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
                                    <button onClick={() => { setUserDetailPanel(null); handleEditUser(userDetailPanel); }} style={{ flex: 1, minHeight: 42, borderRadius: 8, border: 'none', background: '#31d94f', color: '#061007', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <i className="bi bi-pencil-fill"></i> Editar
                                    </button>
                                    <button onClick={() => handlePrintUser(userDetailPanel)} style={{ flex: 1, minHeight: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#c5d8ca', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <i className="bi bi-printer-fill"></i> Imprimir
                                    </button>
                                    <button onClick={() => { if (window.confirm('¿Eliminar este usuario?')) { handleDeleteUser(userDetailPanel.id); setUserDetailPanel(null); } }} style={{ minHeight: 42, width: 42, borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="bi bi-trash3-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </aside>
                        <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>
                    </>
                );
            })()}
        </main>
    );
}

// ─── Módulo Pagos y Recibos ───────────────────────────────────────────────────
function PagosPanel({ moneyFmt, notify }) {
    const [tab, setTab] = useState('cobros');
    const [cobros, setCobros] = useState([]);
    const [reservasByCobro, setReservasByCobro] = useState({});
    const [recibosList, setRecibos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCobroForm, setShowCobroForm] = useState(false);
    const [editingCobro, setEditingCobro] = useState(null);
    const [cobroForm, setCobroForm] = useState({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' });

    // Descuentos (solo Admin configura)
    const [descuentos, setDescuentos] = useState([]);
    const [showDescuentoForm, setShowDescuentoForm] = useState(false);
    const [descuentoForm, setDescuentoForm] = useState({ nombre: '', porcentaje: 10, condicion: '', codigoPromocional: '', tipoServicio: 'Cancha', activo: true });
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5071/api/v1';

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [c, r, allReservas, d] = await Promise.all([
                cobrosApi.getAll(),
                recibosApi.getAll(),
                reservasApi.getAll(),
                fetch(`${API_URL}/descuentos`).then(res => res.ok ? res.json() : []).catch(() => [])
            ]);
            setCobros(c);
            setRecibos(r);
            setDescuentos(d);
            // Build a map cobro.id -> reserva for quick lookup
            const byCobroId = {};
            allReservas.forEach(rv => {
                const linked = c.find(cb => cb.reservaId === rv.id);
                if (linked) byCobroId[linked.id] = rv;
            });
            setReservasByCobro(byCobroId);
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
            else await cobrosApi.create(body);
            notify(editingCobro ? 'Cobro actualizado' : 'Cobro creado', 'success');
            setShowCobroForm(false);
            setEditingCobro(null);
            setCobroForm({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' });
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al guardar', 'error');
        }
    };

    const handlePagarCobro = (c) => {
        const reserva = reservasByCobro[c.id];
        const metodoPago = reserva?.metodoPago || c.metodoPago || 'Efectivo';
        if (!window.confirm(`¿Confirmar pago de ${moneyFmt.format(c.montoFinal)} para cobro #${c.id}?\nMétodo: ${metodoPago}`)) return;
        (async () => {
            try {
                await cobrosApi.pagar(c.id, { monto: c.montoFinal, metodoPago, aprobado: true });
                notify('Pago confirmado y recibo generado ✅', 'success');
                fetchAll();
            } catch (err) {
                notify(err.message || 'Error al procesar', 'error');
            }
        })();
    };

    const handleVerComprobante = (c) => {
        const reserva = reservasByCobro[c.id];
        const path = reserva?.comprobantePdf;
        if (!path) {
            notify('Este cobro no tiene comprobante adjunto.', 'warning');
            return;
        }

        const baseUrl = API_URL.replace('/api/v1', '');
        if (path.startsWith('http') || path.startsWith('data:')) {
            window.open(path, '_blank');
        } else {
            const fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
            window.open(fullUrl, '_blank');
        }
    };

    const handleDeleteCobro = (id) => {
        if (!window.confirm('¿Eliminar este cobro?')) return;
        (async () => {
            try {
                await cobrosApi.remove(id);
                notify('Cobro eliminado', 'success');
                fetchAll();
            } catch (err) {
                notify(err.message || 'Error al eliminar', 'error');
            }
        })();
    };

    const handleDeleteRecibo = (id) => {
        if (!window.confirm('¿Eliminar este recibo?')) return;
        (async () => {
            try {
                await recibosApi.remove(id);
                notify('Recibo eliminado', 'success');
                fetchAll();
            } catch (err) {
                notify(err.message || 'Error al eliminar', 'error');
            }
        })();
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

    const totalCobrado = cobros.filter(c => c.estado === 'Pagado').reduce((s, c) => s + Number(c.montoFinal), 0);
    const totalPendiente = cobros.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + Number(c.montoFinal), 0);

    const estadoPill = (e) => ({ Pagado: 'success', Pendiente: 'pending', Rechazado: 'danger' }[e] ?? 'neutral');

    return (
        <section className="admin-panel">
            <div className="pagos-tabs">
                <button className={tab === 'cobros' ? 'active' : ''} onClick={() => setTab('cobros')}>📋 Cobros</button>
                <button className={tab === 'recibos' ? 'active' : ''} onClick={() => setTab('recibos')}>🧾 Recibos</button>
                <button className={tab === 'descuentos' ? 'active' : ''} onClick={() => setTab('descuentos')}>🏷️ Descuentos</button>
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
                                                        {c.estado === 'Pendiente' && <button onClick={() => handlePagarCobro(c)} style={{ background: 'rgba(49,217,79,0.15)', color: '#31d94f', border: '1px solid rgba(49,217,79,0.3)' }}><i className="bi bi-check-circle me-1"></i>Confirmar Pago</button>}
                                                        {reservasByCobro[c.id]?.comprobantePdf && (
                                                            <button onClick={() => handleVerComprobante(c)} style={{ background: 'rgba(242,184,75,0.12)', color: '#f2b84b', border: '1px solid rgba(242,184,75,0.3)' }}>
                                                                <i className="bi bi-file-earmark-pdf me-1"></i>Ver Comprobante
                                                            </button>
                                                        )}
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

            {tab === 'descuentos' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800 }}>Descuentos del Club</h3>
                        <button className="primary-action" onClick={() => setShowDescuentoForm(v => !v)}>
                            {showDescuentoForm ? 'Cancelar' : '+ Nuevo Descuento'}
                        </button>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                        El Empleado puede aplicar estos descuentos al atender clientes en el mostrador. Solo el Administrador puede crearlos o desactivarlos.
                    </p>
                    {showDescuentoForm && (
                        <form className="admin-form" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 20 }}
                            onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    const res = await fetch(`${API_URL}/descuentos`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ ...descuentoForm, porcentaje: Number(descuentoForm.porcentaje) })
                                    });
                                    if (!res.ok) throw new Error(await res.text());
                                    notify('Descuento creado con exito', 'success');
                                    setShowDescuentoForm(false);
                                    setDescuentoForm({ nombre: '', porcentaje: 10, condicion: '', codigoPromocional: '', tipoServicio: 'Cancha', activo: true });
                                    fetchAll();
                                } catch (err) { notify(err.message, 'error'); }
                            }}
                        >
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Nombre del descuento</label>
                                <input placeholder="Ej: Equipos de Liga" value={descuentoForm.nombre} onChange={e => setDescuentoForm(f => ({ ...f, nombre: e.target.value }))} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Porcentaje (%)</label>
                                <input type="number" min="1" max="100" value={descuentoForm.porcentaje} onChange={e => setDescuentoForm(f => ({ ...f, porcentaje: e.target.value }))} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Condicion</label>
                                <input placeholder="Ej: Escuelas de futbol afiliadas" value={descuentoForm.condicion} onChange={e => setDescuentoForm(f => ({ ...f, condicion: e.target.value }))} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Codigo Promo (opcional)</label>
                                <input placeholder="Ej: LIGA2025" value={descuentoForm.codigoPromocional} onChange={e => setDescuentoForm(f => ({ ...f, codigoPromocional: e.target.value.toUpperCase() }))} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Tipo de servicio</label>
                                <select value={descuentoForm.tipoServicio} onChange={e => setDescuentoForm(f => ({ ...f, tipoServicio: e.target.value }))}>
                                    <option value="Cancha">Cancha</option>
                                    <option value="Clase">Clase / Entrenamiento</option>
                                    <option value="Liga">Liga / Torneo</option>
                                    <option value="General">General</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" className="primary-action" style={{ width: '100%' }}>Guardar descuento</button>
                            </div>
                        </form>
                    )}
                    <div className="data-table">
                        <table>
                            <thead><tr><th>ID</th><th>Nombre</th><th>%</th><th>Servicio</th><th>Condicion</th><th>Codigo Promo</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody>
                                {descuentos.length === 0 && (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>No hay descuentos. Crea el primero con el boton de arriba.</td></tr>
                                )}
                                {descuentos.map(d => (
                                    <tr key={d.id}>
                                        <td>#{d.id}</td>
                                        <td style={{ fontWeight: 700 }}>{d.nombre}</td>
                                        <td style={{ color: '#31d94f', fontWeight: 700 }}>{d.porcentaje}%</td>
                                        <td>{d.tipoServicio || 'General'}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.condicion || '\u2014'}</td>
                                        <td>{d.codigoPromocional ? <code style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308', padding: '2px 6px', borderRadius: 4 }}>{d.codigoPromocional}</code> : '\u2014'}</td>
                                        <td><span className={`pill ${d.activo ? 'success' : 'neutral'}`}>{d.activo ? 'Activo' : 'Inactivo'}</span></td>
                                        <td className="table-actions">
                                            <button
                                                className={d.activo ? 'danger' : ''}
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`${API_URL}/descuentos/${d.id}/toggle`, { method: 'PUT' });
                                                        if (!res.ok) throw new Error(await res.text());
                                                        notify(d.activo ? 'Descuento desactivado' : 'Descuento activado', 'success');
                                                        fetchAll();
                                                    } catch(err) { notify(err.message, 'error'); }
                                                }}
                                            >
                                                {d.activo ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
}

// ─── Módulo Ligas y Torneos ───────────────────────────────────────────────────
function LigasTorneosPanel({ moneyFormatter, setMessage, API_URL }) {
    const [tab, setTab] = useState('ligas');
    const [ligas, setLigas] = useState([]);
    const [torneos, setTorneos] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedLigaId, setSelectedLigaId] = useState(null);
    const [ligaDetails, setLigaDetails] = useState(null);

    const [selectedTorneoId, setSelectedTorneoId] = useState(null);
    const [torneoDetails, setTorneoDetails] = useState(null);
    const [selectedTorneoPhaseIndex, setSelectedTorneoPhaseIndex] = useState(0);

    // Confirm modal state (local to this component)
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
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

    // Form states
    const [showLigaForm, setShowLigaForm] = useState(false);
    const [ligaForm, setLigaForm] = useState({ nombre: '', reglamento: '', cupoEquipos: 16 });

    const [showTorneoForm, setShowTorneoForm] = useState(false);
    const [torneoForm, setTorneoForm] = useState({ nombre: '', reglamento: '', formato: 'EliminacionDirecta', cupoEquipos: 16 });

    const [inscribirEquipoId, setInscribirEquipoId] = useState('');
    const [fixtureFechaInicio, setFixtureFechaInicio] = useState(new Date().toISOString().split('T')[0]);

    // Matches editing state
    const [editingMatchId, setEditingMatchId] = useState(null);
    const [matchResult, setMatchResult] = useState({ golesLocal: 0, golesVisitante: 0 });

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [lr, tr, er] = await Promise.all([
                fetch(`${API_URL}/ligas`),
                fetch(`${API_URL}/torneos`),
                fetch(`${API_URL}/equipos`)
            ]);
            if (lr.ok) setLigas(await lr.json());
            if (tr.ok) setTorneos(await tr.json());
            if (er.ok) setEquipos(await er.json());
        } catch (error) {
            setMessage('Error al cargar datos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // Load detailed Liga
    const loadLigaDetails = async (id) => {
        if (selectedLigaId === id) {
            setSelectedLigaId(null);
            setLigaDetails(null);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/ligas/${id}`);
            if (res.ok) {
                const data = await res.json();
                setLigaDetails(data);
                setSelectedLigaId(id);
                setSelectedTorneoId(null);
                setTorneoDetails(null);
            } else {
                setMessage('No se pudieron cargar los detalles de la liga');
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    // Load detailed Torneo
    const loadTorneoDetails = async (id) => {
        if (selectedTorneoId === id) {
            setSelectedTorneoId(null);
            setTorneoDetails(null);
            setSelectedTorneoPhaseIndex(0);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/torneos/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTorneoDetails(data);
                setSelectedTorneoId(id);
                setSelectedTorneoPhaseIndex(0);
                setSelectedLigaId(null);
                setLigaDetails(null);
            } else {
                setMessage('No se pudieron cargar los detalles del torneo');
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    // Liga CRUD & actions
    const handleCreateLiga = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/ligas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: ligaForm.nombre,
                    reglamento: ligaForm.reglamento,
                    cupoEquipos: Number(ligaForm.cupoEquipos)
                })
            });
            if (res.ok) {
                setMessage('Liga creada exitosamente');
                setLigaForm({ nombre: '', reglamento: '', cupoEquipos: 16 });
                setShowLigaForm(false);
                fetchAll();
            } else {
                const txt = await res.text();
                setMessage('Error al crear liga: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleCancelLiga = (id) => {
        showConfirm('¿Seguro que desea cancelar esta liga?', async () => {
            try {
                const res = await fetch(`${API_URL}/ligas/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setMessage('Liga cancelada');
                    fetchAll();
                    if (selectedLigaId === id) {
                        setSelectedLigaId(null);
                        setLigaDetails(null);
                    }
                } else {
                    const txt = await res.text();
                    setMessage('Error al cancelar liga: ' + txt);
                }
            } catch (error) {
                setMessage('Error: ' + error.message);
            }
        });
    };

    const handleInscribirEquipoLiga = async () => {
        if (!inscribirEquipoId) return;
        try {
            const res = await fetch(`${API_URL}/ligas/${selectedLigaId}/inscribir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ equipoId: Number(inscribirEquipoId) })
            });
            if (res.ok) {
                setMessage('Equipo inscripto en la liga con éxito');
                setInscribirEquipoId('');
                loadLigaDetails(selectedLigaId);
                fetchAll();
            } else {
                const txt = await res.text();
                setMessage('Error al inscribir: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleGenerarFixtureLiga = async () => {
        try {
            const res = await fetch(`${API_URL}/ligas/${selectedLigaId}/fixture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fechaInicio: new Date(fixtureFechaInicio).toISOString() })
            });
            if (res.ok) {
                setMessage('Fixture generado con éxito');
                loadLigaDetails(selectedLigaId);
                fetchAll();
            } else {
                const txt = await res.text();
                setMessage('Error al generar fixture: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    // Torneo CRUD & actions
    const handleCreateTorneo = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/torneos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: torneoForm.nombre,
                    reglamento: torneoForm.reglamento,
                    formato: torneoForm.formato,
                    cupoEquipos: Number(torneoForm.cupoEquipos)
                })
            });
            if (res.ok) {
                setMessage('Torneo creado exitosamente');
                setTorneoForm({ nombre: '', reglamento: '', formato: 'EliminacionDirecta', cupoEquipos: 16 });
                setShowTorneoForm(false);
                fetchAll();
            } else {
                const txt = await res.text();
                setMessage('Error al crear torneo: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleCancelTorneo = (id) => {
        showConfirm('¿Seguro que desea cancelar este torneo?', async () => {
            try {
                const res = await fetch(`${API_URL}/torneos/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setMessage('Torneo cancelado');
                    fetchAll();
                    if (selectedTorneoId === id) {
                        setSelectedTorneoId(null);
                        setTorneoDetails(null);
                    }
                } else {
                    const txt = await res.text();
                    setMessage('Error al cancelar torneo: ' + txt);
                }
            } catch (error) {
                setMessage('Error: ' + error.message);
            }
        });
    };

    const handleInscribirEquipoTorneo = async () => {
        if (!inscribirEquipoId) return;
        try {
            const res = await fetch(`${API_URL}/torneos/${selectedTorneoId}/inscribir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ equipoId: Number(inscribirEquipoId) })
            });
            if (res.ok) {
                setMessage('Equipo inscripto en el torneo con éxito');
                setInscribirEquipoId('');
                loadTorneoDetails(selectedTorneoId);
                fetchAll();
            } else {
                const txt = await res.text();
                setMessage('Error al inscribir: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleGenerarFixtureTorneo = async () => {
        try {
            const res = await fetch(`${API_URL}/torneos/${selectedTorneoId}/fixture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fechaInicio: new Date(fixtureFechaInicio).toISOString() })
            });
            if (res.ok) {
                setMessage('Fixture generado con éxito');
                loadTorneoDetails(selectedTorneoId);
                fetchAll();
            } else {
                const txt = await res.text();
                setMessage('Error al generar fixture: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    // Save match result
    const handleSaveMatchResult = async (partidoId, isLiga) => {
        const url = isLiga
            ? `${API_URL}/ligas/partidos/${partidoId}/resultado`
            : `${API_URL}/partidos/${partidoId}/resultado`;
        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    golesLocal: Number(matchResult.golesLocal),
                    golesVisitante: Number(matchResult.golesVisitante)
                })
            });
            if (res.ok) {
                setMessage('Resultado registrado con éxito');
                setEditingMatchId(null);
                if (isLiga) loadLigaDetails(selectedLigaId);
                else loadTorneoDetails(selectedTorneoId);
            } else {
                const txt = await res.text();
                setMessage('Error al guardar resultado: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const formatLocalDateTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <section className="admin-panel" style={{ display: 'grid', gap: '20px' }}>
            <div className="pagos-tabs">
                <button className={tab === 'ligas' ? 'active' : ''} onClick={() => { setTab('ligas'); setSelectedLigaId(null); setLigaDetails(null); setShowLigaForm(false); }}>🏆 Ligas</button>
                <button className={tab === 'torneos' ? 'active' : ''} onClick={() => { setTab('torneos'); setSelectedTorneoId(null); setTorneoDetails(null); setShowTorneoForm(false); }}>🏅 Torneos</button>
            </div>

            {tab === 'ligas' && (
                <>
                    {/* Ligas Summary Metrics */}
                    <div className="metric-grid">
                        <article>
                            <span>Total Ligas</span>
                            <strong>{ligas.length}</strong>
                        </article>
                        <article>
                            <span>Abiertas</span>
                            <strong style={{ color: '#4ade80' }}>{ligas.filter(l => l.estado === 'Abierta').length}</strong>
                        </article>
                        <article>
                            <span>En Curso</span>
                            <strong style={{ color: '#f2b84b' }}>{ligas.filter(l => l.estado === 'En curso').length}</strong>
                        </article>
                        <article>
                            <span>Canceladas</span>
                            <strong style={{ color: '#ef4444' }}>{ligas.filter(l => l.estado === 'Cancelada').length}</strong>
                        </article>
                    </div>

                    <div className="section-actions">
                        <button className="primary-action" onClick={() => setShowLigaForm(!showLigaForm)}>
                            {showLigaForm ? 'Cancelar' : '+ Nueva Liga'}
                        </button>
                    </div>

                    {showLigaForm && (
                        <form className="admin-form" onSubmit={handleCreateLiga} style={{ gridTemplateColumns: 'repeat(3, 1fr) auto', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Nombre</label>
                                <input
                                    placeholder="Nombre de la liga"
                                    value={ligaForm.nombre}
                                    onChange={e => setLigaForm({ ...ligaForm, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Reglamento</label>
                                <input
                                    placeholder="Reglamento / Info"
                                    value={ligaForm.reglamento}
                                    onChange={e => setLigaForm({ ...ligaForm, reglamento: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Cupo de Equipos</label>
                                <input
                                    type="number"
                                    min="2"
                                    placeholder="Cupo"
                                    value={ligaForm.cupoEquipos}
                                    onChange={e => setLigaForm({ ...ligaForm, cupoEquipos: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="primary-action" style={{ height: 44 }}>Guardar Liga</button>
                        </form>
                    )}

                    {loading ? <div className="empty-state">Cargando ligas...</div> : (
                        ligas.length === 0 ? <div className="empty-state">No hay ligas registradas.</div> : (
                            <div className="data-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Reglamento</th>
                                            <th>Equipos</th>
                                            <th>Cupo</th>
                                            <th>Partidos</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ligas.map(l => (
                                            <tr key={l.id} className={selectedLigaId === l.id ? 'active-row' : ''} style={selectedLigaId === l.id ? { background: 'rgba(49, 217, 79, 0.05)' } : {}}>
                                                <td>#{l.id}</td>
                                                <td style={{ fontWeight: 700 }}>{l.nombre}</td>
                                                <td>{l.reglamento}</td>
                                                <td>{l.equiposInscriptos}</td>
                                                <td>{l.cupoEquipos}</td>
                                                <td>{l.partidos}</td>
                                                <td>
                                                    <span className={`pill ${l.estado === 'Abierta' ? 'success' : l.estado === 'En curso' ? 'pending' : 'danger'}`}>
                                                        {l.estado}
                                                    </span>
                                                </td>
                                                <td className="table-actions">
                                                    <button onClick={() => loadLigaDetails(l.id)}>🔍 Ver Detalle</button>
                                                    {l.estado !== 'Cancelada' && (
                                                        <button className="danger" onClick={() => handleCancelLiga(l.id)}>Cancelar</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {selectedLigaId && ligaDetails && (
                        <div style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(149, 255, 172, 0.08)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3>Detalle de la Liga: <span style={{ color: '#31d94f' }}>{ligaDetails.nombre}</span></h3>
                                <span className={`pill ${ligaDetails.estado === 'Abierta' ? 'success' : ligaDetails.estado === 'En curso' ? 'pending' : 'danger'}`}>{ligaDetails.estado}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                                {/* Left Column: Teams */}
                                <div>
                                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Equipos Inscriptos ({ligaDetails.inscripciones?.length || 0} / {ligaDetails.cupoEquipos})</h4>
                                    {ligaDetails.inscripciones?.length === 0 ? (
                                        <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>No hay equipos inscriptos.</p>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                                            {ligaDetails.inscripciones?.map(i => (
                                                <li key={i.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span>⚽ {i.equipo?.nombre || `Equipo #${i.equipoId}`}</span>
                                                    <span style={{ color: '#8ca092', fontSize: '0.75rem' }}>{i.equipo?.categoria || 'Libre'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {ligaDetails.estado === 'Abierta' && (ligaDetails.inscripciones?.length || 0) < ligaDetails.cupoEquipos && (
                                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                            <select
                                                value={inscribirEquipoId}
                                                onChange={e => setInscribirEquipoId(e.target.value)}
                                                style={{ minHeight: 38, background: '#080c0a', color: '#fff', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, padding: '0 8px', flex: 1 }}
                                            >
                                                <option value="">Seleccionar Equipo</option>
                                                {equipos
                                                    .filter(eq => !ligaDetails.inscripciones?.some(ins => ins.equipoId === eq.id))
                                                    .map(eq => (
                                                        <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                                                    ))
                                                }
                                            </select>
                                            <button
                                                onClick={handleInscribirEquipoLiga}
                                                className="primary-action"
                                                style={{ minHeight: 38, padding: '0 12px', fontSize: '0.85rem' }}
                                                disabled={!inscribirEquipoId}
                                            >
                                                Inscribir
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 18 }}>
                                        <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Tabla de Posiciones</h4>
                                        {ligaDetails.tablaPosiciones?.length ? (
                                            <div className="data-table" style={{ maxHeight: 260, overflow: 'auto' }}>
                                                <table>
                                                    <thead>
                                                        <tr><th>#</th><th>Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {ligaDetails.tablaPosiciones.map((pos, idx) => (
                                                            <tr key={pos.equipoId}>
                                                                <td>{idx + 1}</td>
                                                                <td style={{ fontWeight: 700 }}>{pos.equipo}</td>
                                                                <td>{pos.pj}</td>
                                                                <td>{pos.dg > 0 ? `+${pos.dg}` : pos.dg}</td>
                                                                <td style={{ color: '#31d94f', fontWeight: 700 }}>{pos.pts}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>Sin posiciones disponibles.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Fixture */}
                                <div>
                                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Fixture y Partidos</h4>

                                    {(!ligaDetails.partidos || ligaDetails.partidos.length === 0) ? (
                                        <div style={{ padding: 20, textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 8 }}>
                                            <p style={{ color: '#8ca092', marginBottom: 14, fontSize: '0.9rem' }}>El fixture aún no ha sido generado para esta liga.</p>
                                            {(ligaDetails.inscripciones?.length || 0) >= 2 ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                                    <input
                                                        type="date"
                                                        value={fixtureFechaInicio}
                                                        onChange={e => setFixtureFechaInicio(e.target.value)}
                                                        style={{ width: 'auto', minHeight: 38, padding: '0 10px', background: '#080c0a', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, color: '#fff' }}
                                                    />
                                                    <button onClick={handleGenerarFixtureLiga} className="primary-action" style={{ minHeight: 38, padding: '0 16px' }}>
                                                        Generar Fixture
                                                    </button>
                                                </div>
                                            ) : (
                                                <p style={{ color: '#ff9a8f', fontSize: '0.85rem', fontWeight: 'bold' }}>Se necesitan al menos 2 equipos inscriptos para generar el fixture.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="data-table" style={{ maxHeight: 300, overflow: 'auto' }}>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Fecha/Hora</th>
                                                        <th>Local</th>
                                                        <th>Resultado</th>
                                                        <th>Visitante</th>
                                                        <th>Estado</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ligaDetails.partidos.map(p => (
                                                        <tr key={p.id}>
                                                            <td style={{ fontSize: '0.8rem' }}>{formatLocalDateTime(p.fechaHora)}</td>
                                                            <td style={{ fontWeight: p.golesLocal > p.golesVisitante ? 'bold' : 'normal', color: p.golesLocal > p.golesVisitante ? '#31d94f' : '#fff' }}>
                                                                {p.equipoLocal?.nombre || `Equipo #${p.equipoLocalId}`}
                                                            </td>
                                                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', color: '#4ade80' }}>
                                                                {p.estado === 'Finalizado' ? `${p.golesLocal} - ${p.golesVisitante}` : 'vs'}
                                                            </td>
                                                            <td style={{ fontWeight: p.golesVisitante > p.golesLocal ? 'bold' : 'normal', color: p.golesVisitante > p.golesLocal ? '#31d94f' : '#fff' }}>
                                                                {p.equipoVisitante?.nombre || `Equipo #${p.equipoVisitanteId}`}
                                                            </td>
                                                            <td>
                                                                <span className={`pill ${p.estado === 'Finalizado' ? 'success' : 'neutral'}`}>{p.estado}</span>
                                                            </td>
                                                            <td className="table-actions">
                                                                {p.estado !== 'Finalizado' && editingMatchId !== p.id && (
                                                                    <button onClick={() => { setEditingMatchId(p.id); setMatchResult({ golesLocal: 0, golesVisitante: 0 }); }}>✍️ Resultado</button>
                                                                )}
                                                                {editingMatchId === p.id && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                        <input
                                                                            type="number" min="0" style={{ width: 45, minHeight: 30, padding: 2, textAlign: 'center' }}
                                                                            value={matchResult.golesLocal}
                                                                            onChange={e => setMatchResult({ ...matchResult, golesLocal: e.target.value })}
                                                                        />
                                                                        <span>-</span>
                                                                        <input
                                                                            type="number" min="0" style={{ width: 45, minHeight: 30, padding: 2, textAlign: 'center' }}
                                                                            value={matchResult.golesVisitante}
                                                                            onChange={e => setMatchResult({ ...matchResult, golesVisitante: e.target.value })}
                                                                        />
                                                                        <button onClick={() => handleSaveMatchResult(p.id, true)} style={{ padding: '4px 8px', background: '#31d94f', color: '#000', border: 0, borderRadius: 4 }}>💾</button>
                                                                        <button onClick={() => setEditingMatchId(null)} style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', border: 0, borderRadius: 4 }}>❌</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTorneoId && torneoDetails && (
                        <div style={{ marginTop: 20, marginLeft: 'auto', width: 'min(100%, 900px)', padding: 20, background: 'linear-gradient(180deg, rgba(49,217,79,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(149, 255, 172, 0.12)', borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.16)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                                <div>
                                    <h3 style={{ marginBottom: 6 }}>Detalle del Torneo: <span style={{ color: '#31d94f' }}>{torneoDetails.nombre}</span></h3>
                                    <p style={{ margin: 0, color: '#8ca092', fontSize: '0.88rem' }}>Podes cerrarlo tocando otra vez "Ver detalle" o desde este panel.</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className={`pill ${torneoDetails.estado === 'Abierto' ? 'success' : torneoDetails.estado === 'En curso' ? 'pending' : 'danger'}`}>{torneoDetails.estado}</span>
                                    <button className="danger" onClick={() => { setSelectedTorneoId(null); setTorneoDetails(null); setSelectedTorneoPhaseIndex(0); }}>Ocultar</button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.95fr) minmax(0, 1.35fr)', gap: '20px' }}>
                                <div>
                                    {torneoDetails.estado === 'Abierto' && (torneoDetails.inscripciones?.length || 0) < torneoDetails.cupoEquipos && (
                                        <div style={{ marginBottom: 18, padding: 14, background: 'rgba(49,217,79,0.06)', border: '1px solid rgba(49,217,79,0.18)', borderRadius: 10 }}>
                                            <h4 style={{ marginBottom: 10 }}>Inscribir Equipo</h4>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <select
                                                    value={inscribirEquipoId}
                                                    onChange={e => setInscribirEquipoId(e.target.value)}
                                                    style={{ minHeight: 38, background: '#080c0a', color: '#fff', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, padding: '0 8px', flex: 1 }}
                                                >
                                                    <option value="">Seleccionar Equipo</option>
                                                    {equipos
                                                        .filter(eq => !torneoDetails.inscripciones?.some(ins => ins.equipoId === eq.id))
                                                        .map(eq => (
                                                            <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                                                        ))
                                                    }
                                                </select>
                                                <button
                                                    onClick={handleInscribirEquipoTorneo}
                                                    className="primary-action"
                                                    style={{ minHeight: 38, padding: '0 12px', fontSize: '0.85rem' }}
                                                    disabled={!inscribirEquipoId}
                                                >
                                                    Inscribir
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Equipos Inscriptos ({torneoDetails.inscripciones?.length || 0} / {torneoDetails.cupoEquipos})</h4>
                                    {torneoDetails.inscripciones?.length === 0 ? (
                                        <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>No hay equipos inscriptos.</p>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                                            {torneoDetails.inscripciones?.map(i => (
                                                <li key={i.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span>âš½ {i.equipo?.nombre || `Equipo #${i.equipoId}`}</span>
                                                    <span style={{ color: '#8ca092', fontSize: '0.75rem' }}>{i.equipo?.categoria || 'Libre'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div>
                                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Fixture por Fases</h4>

                                    {(!torneoDetails.partidos || torneoDetails.partidos.length === 0) ? (
                                        <div style={{ padding: 20, textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 8 }}>
                                            <p style={{ color: '#8ca092', marginBottom: 14, fontSize: '0.9rem' }}>El fixture aun no ha sido generado para este torneo.</p>
                                            {(torneoDetails.inscripciones?.length || 0) >= 2 ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                                    <input
                                                        type="date"
                                                        value={fixtureFechaInicio}
                                                        onChange={e => setFixtureFechaInicio(e.target.value)}
                                                        style={{ width: 'auto', minHeight: 38, padding: '0 10px', background: '#080c0a', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, color: '#fff' }}
                                                    />
                                                    <button onClick={handleGenerarFixtureTorneo} className="primary-action" style={{ minHeight: 38, padding: '0 16px' }}>
                                                        Generar Fixture
                                                    </button>
                                                </div>
                                            ) : (
                                                <p style={{ color: '#ff9a8f', fontSize: '0.85rem', fontWeight: 'bold' }}>Se necesitan al menos 2 equipos inscriptos para generar el fixture.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'grid', gap: 12, marginBottom: 14 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTorneoPhaseIndex(index => Math.max(0, index - 1))}
                                                        disabled={selectedTorneoPhaseIndex === 0}
                                                        style={{ minWidth: 42, minHeight: 38, borderRadius: 10, border: '1px solid rgba(149,255,172,0.18)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}
                                                    >
                                                        <i className="bi bi-chevron-left"></i>
                                                    </button>
                                                    <div style={{ flex: 1, minWidth: 220, textAlign: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(149,255,172,0.1)' }}>
                                                        <div style={{ color: '#31d94f', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                            {getTorneoFixtures(torneoDetails)[selectedTorneoPhaseIndex] ? getTorneoRoundName((torneoDetails?.inscripciones?.filter(i => i.estado === 'Confirmado').length || 0), getTorneoFixtures(torneoDetails)[selectedTorneoPhaseIndex].numero) : 'Fase'}
                                                        </div>
                                                        <div style={{ color: '#8ca092', fontSize: '0.78rem', marginTop: 4 }}>
                                                            {getTorneoFixtures(torneoDetails)[selectedTorneoPhaseIndex] ? `Jornada ${getTorneoFixtures(torneoDetails)[selectedTorneoPhaseIndex].numero}` : 'Sin fase seleccionada'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTorneoPhaseIndex(index => Math.min(getTorneoFixtures(torneoDetails).length - 1, index + 1))}
                                                        disabled={selectedTorneoPhaseIndex >= getTorneoFixtures(torneoDetails).length - 1}
                                                        style={{ minWidth: 42, minHeight: 38, borderRadius: 10, border: '1px solid rgba(149,255,172,0.18)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}
                                                    >
                                                        <i className="bi bi-chevron-right"></i>
                                                    </button>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    {getTorneoFixtures(torneoDetails).map((fixture, index) => (
                                                        <button
                                                            key={fixture.id}
                                                            type="button"
                                                            onClick={() => setSelectedTorneoPhaseIndex(index)}
                                                            style={{
                                                                minWidth: 96,
                                                                minHeight: 34,
                                                                borderRadius: 999,
                                                                border: index === selectedTorneoPhaseIndex ? '1px solid #31d94f' : '1px solid rgba(149,255,172,0.12)',
                                                                background: index === selectedTorneoPhaseIndex ? 'rgba(49,217,79,0.16)' : 'rgba(255,255,255,0.02)',
                                                                color: index === selectedTorneoPhaseIndex ? '#31d94f' : '#d9e5d8',
                                                                fontWeight: 700
                                                            }}
                                                        >
                                                            {getTorneoRoundName((torneoDetails?.inscripciones?.filter(i => i.estado === 'Confirmado').length || 0), fixture.numero)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {getTorneoFixtures(torneoDetails)[selectedTorneoPhaseIndex] && (
                                                <div className="data-table" style={{ maxHeight: 360, overflow: 'auto' }}>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Fecha/Hora</th>
                                                                <th>Local</th>
                                                                <th>Resultado</th>
                                                                <th>Visitante</th>
                                                                <th>Estado</th>
                                                                <th>Acciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {getTorneoFixtures(torneoDetails)[selectedTorneoPhaseIndex].partidos.map(p => (
                                                                <tr key={p.id}>
                                                                    <td style={{ fontSize: '0.8rem' }}>{formatLocalDateTime(p.fechaHora)}</td>
                                                                    <td style={{ fontWeight: p.golesLocal > p.golesVisitante ? 'bold' : 'normal', color: p.golesLocal > p.golesVisitante ? '#31d94f' : '#fff' }}>
                                                                        {p.equipoLocal?.nombre || `Equipo #${p.equipoLocalId}`}
                                                                    </td>
                                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', color: '#4ade80' }}>
                                                                        {p.estado === 'Finalizado' ? `${p.golesLocal} - ${p.golesVisitante}` : 'vs'}
                                                                    </td>
                                                                    <td style={{ fontWeight: p.golesVisitante > p.golesLocal ? 'bold' : 'normal', color: p.golesVisitante > p.golesLocal ? '#31d94f' : '#fff' }}>
                                                                        {p.equipoVisitante?.nombre || `Equipo #${p.equipoVisitanteId}`}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`pill ${p.estado === 'Finalizado' ? 'success' : 'neutral'}`}>{p.estado}</span>
                                                                    </td>
                                                                    <td className="table-actions">
                                                                        {p.estado !== 'Finalizado' && editingMatchId !== p.id && (
                                                                            <button onClick={() => { setEditingMatchId(p.id); setMatchResult({ golesLocal: 0, golesVisitante: 0 }); }}>
                                                                                <i className="bi bi-pencil-square"></i> Resultado
                                                                            </button>
                                                                        )}
                                                                        {editingMatchId === p.id && (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                                <input
                                                                                    type="number" min="0" style={{ width: 45, minHeight: 30, padding: 2, textAlign: 'center' }}
                                                                                    value={matchResult.golesLocal}
                                                                                    onChange={e => setMatchResult({ ...matchResult, golesLocal: e.target.value })}
                                                                                />
                                                                                <span>-</span>
                                                                                <input
                                                                                    type="number" min="0" style={{ width: 45, minHeight: 30, padding: 2, textAlign: 'center' }}
                                                                                    value={matchResult.golesVisitante}
                                                                                    onChange={e => setMatchResult({ ...matchResult, golesVisitante: e.target.value })}
                                                                                />
                                                                                <button onClick={() => handleSaveMatchResult(p.id, false)} style={{ padding: '4px 8px', background: '#31d94f', color: '#000', border: 0, borderRadius: 4 }}>
                                                                                    <i className="bi bi-floppy"></i>
                                                                                </button>
                                                                                <button onClick={() => setEditingMatchId(null)} style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', border: 0, borderRadius: 4 }}>
                                                                                    <i className="bi bi-x-lg"></i>
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {false && selectedTorneoId && torneoDetails && (
                        <div style={{ marginTop: 20, marginLeft: 'auto', width: 'min(100%, 900px)', padding: 20, background: 'linear-gradient(180deg, rgba(49,217,79,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(149, 255, 172, 0.12)', borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.16)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                                <div>
                                    <h3 style={{ marginBottom: 6 }}>Detalle del Torneo: <span style={{ color: '#31d94f' }}>{torneoDetails.nombre}</span></h3>
                                    <p style={{ margin: 0, color: '#8ca092', fontSize: '0.88rem' }}>PodÃ©s cerrarlo tocando otra vez "Ver detalle" o desde este panel.</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className={`pill ${torneoDetails.estado === 'Abierto' ? 'success' : torneoDetails.estado === 'En curso' ? 'pending' : 'danger'}`}>{torneoDetails.estado}</span>
                                    <button className="danger" onClick={() => { setSelectedTorneoId(null); setTorneoDetails(null); setSelectedTorneoPhaseIndex(0); }}>Ocultar</button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.95fr) minmax(0, 1.35fr)', gap: '20px' }}>
                                <div>
                                    {torneoDetails.estado === 'Abierto' && (torneoDetails.inscripciones?.length || 0) < torneoDetails.cupoEquipos && (
                                        <div style={{ marginBottom: 18, padding: 14, background: 'rgba(49,217,79,0.06)', border: '1px solid rgba(49,217,79,0.18)', borderRadius: 10 }}>
                                            <h4 style={{ marginBottom: 10 }}>Inscribir Equipo</h4>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <select
                                                    value={inscribirEquipoId}
                                                    onChange={e => setInscribirEquipoId(e.target.value)}
                                                    style={{ minHeight: 38, background: '#080c0a', color: '#fff', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, padding: '0 8px', flex: 1 }}
                                                >
                                                    <option value="">Seleccionar Equipo</option>
                                                    {equipos
                                                        .filter(eq => !torneoDetails.inscripciones?.some(ins => ins.equipoId === eq.id))
                                                        .map(eq => (
                                                            <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                                                        ))
                                                    }
                                                </select>
                                                <button
                                                    onClick={handleInscribirEquipoTorneo}
                                                    className="primary-action"
                                                    style={{ minHeight: 38, padding: '0 12px', fontSize: '0.85rem' }}
                                                    disabled={!inscribirEquipoId}
                                                >
                                                    Inscribir
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Equipos Inscriptos ({torneoDetails.inscripciones?.length || 0} / {torneoDetails.cupoEquipos})</h4>
                                    {torneoDetails.inscripciones?.length === 0 ? (
                                        <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>No hay equipos inscriptos.</p>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                                            {torneoDetails.inscripciones?.map(i => (
                                                <li key={i.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span>âš½ {i.equipo?.nombre || `Equipo #${i.equipoId}`}</span>
                                                    <span style={{ color: '#8ca092', fontSize: '0.75rem' }}>{i.equipo?.categoria || 'Libre'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div>
                                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Fixture por Fases</h4>

                                    {(!torneoDetails.partidos || torneoDetails.partidos.length === 0) ? (
                                        <div style={{ padding: 20, textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 8 }}>
                                            <p style={{ color: '#8ca092', marginBottom: 14, fontSize: '0.9rem' }}>El fixture aÃºn no ha sido generado para este torneo.</p>
                                            {(torneoDetails.inscripciones?.length || 0) >= 2 ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                                    <input
                                                        type="date"
                                                        value={fixtureFechaInicio}
                                                        onChange={e => setFixtureFechaInicio(e.target.value)}
                                                        style={{ width: 'auto', minHeight: 38, padding: '0 10px', background: '#080c0a', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, color: '#fff' }}
                                                    />
                                                    <button onClick={handleGenerarFixtureTorneo} className="primary-action" style={{ minHeight: 38, padding: '0 16px' }}>
                                                        Generar Fixture
                                                    </button>
                                                </div>
                                            ) : (
                                                <p style={{ color: '#ff9a8f', fontSize: '0.85rem', fontWeight: 'bold' }}>Se necesitan al menos 2 equipos inscriptos para generar el fixture.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'grid', gap: 12, marginBottom: 14 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTorneoPhaseIndex(index => Math.max(0, index - 1))}
                                                        disabled={selectedTorneoPhaseIndex === 0}
                                                        style={{ minWidth: 42, minHeight: 38, borderRadius: 10, border: '1px solid rgba(149,255,172,0.18)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}
                                                    >
                                                        <i className="bi bi-chevron-left"></i>
                                                    </button>
                                                    <div style={{ flex: 1, minWidth: 220, textAlign: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(149,255,172,0.1)' }}>
                                                        <div style={{ color: '#31d94f', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                            {torneoSelectedFixture ? getTorneoRoundName(torneoConfirmedTeams, torneoSelectedFixture.numero) : 'Fase'}
                                                        </div>
                                                        <div style={{ color: '#8ca092', fontSize: '0.78rem', marginTop: 4 }}>
                                                            {torneoSelectedFixture ? `Jornada ${torneoSelectedFixture.numero}` : 'Sin fase seleccionada'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTorneoPhaseIndex(index => Math.min(torneoFixtures.length - 1, index + 1))}
                                                        disabled={selectedTorneoPhaseIndex >= torneoFixtures.length - 1}
                                                        style={{ minWidth: 42, minHeight: 38, borderRadius: 10, border: '1px solid rgba(149,255,172,0.18)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}
                                                    >
                                                        <i className="bi bi-chevron-right"></i>
                                                    </button>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    {torneoFixtures.map((fixture, index) => (
                                                        <button
                                                            key={fixture.id}
                                                            type="button"
                                                            onClick={() => setSelectedTorneoPhaseIndex(index)}
                                                            style={{
                                                                minWidth: 96,
                                                                minHeight: 34,
                                                                borderRadius: 999,
                                                                border: index === selectedTorneoPhaseIndex ? '1px solid #31d94f' : '1px solid rgba(149,255,172,0.12)',
                                                                background: index === selectedTorneoPhaseIndex ? 'rgba(49,217,79,0.16)' : 'rgba(255,255,255,0.02)',
                                                                color: index === selectedTorneoPhaseIndex ? '#31d94f' : '#d9e5d8',
                                                                fontWeight: 700
                                                            }}
                                                        >
                                                            {getTorneoRoundName(torneoConfirmedTeams, fixture.numero)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {torneoSelectedFixture && (
                                                <div className="data-table" style={{ maxHeight: 360, overflow: 'auto' }}>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Fecha/Hora</th>
                                                                <th>Local</th>
                                                                <th>Resultado</th>
                                                                <th>Visitante</th>
                                                                <th>Estado</th>
                                                                <th>Acciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {torneoSelectedFixture.partidos.map(p => (
                                                                <tr key={p.id}>
                                                                    <td style={{ fontSize: '0.8rem' }}>{formatLocalDateTime(p.fechaHora)}</td>
                                                                    <td style={{ fontWeight: p.golesLocal > p.golesVisitante ? 'bold' : 'normal', color: p.golesLocal > p.golesVisitante ? '#31d94f' : '#fff' }}>
                                                                        {p.equipoLocal?.nombre || `Equipo #${p.equipoLocalId}`}
                                                                    </td>
                                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', color: '#4ade80' }}>
                                                                        {p.estado === 'Finalizado' ? `${p.golesLocal} - ${p.golesVisitante}` : 'vs'}
                                                                    </td>
                                                                    <td style={{ fontWeight: p.golesVisitante > p.golesLocal ? 'bold' : 'normal', color: p.golesVisitante > p.golesLocal ? '#31d94f' : '#fff' }}>
                                                                        {p.equipoVisitante?.nombre || `Equipo #${p.equipoVisitanteId}`}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`pill ${p.estado === 'Finalizado' ? 'success' : 'neutral'}`}>{p.estado}</span>
                                                                    </td>
                                                                    <td className="table-actions">
                                                                        {p.estado !== 'Finalizado' && editingMatchId !== p.id && (
                                                                            <button onClick={() => { setEditingMatchId(p.id); setMatchResult({ golesLocal: 0, golesVisitante: 0 }); }}>
                                                                                <i className="bi bi-pencil-square"></i> Resultado
                                                                            </button>
                                                                        )}
                                                                        {editingMatchId === p.id && (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                                <input
                                                                                    type="number" min="0" style={{ width: 45, minHeight: 30, padding: 2, textAlign: 'center' }}
                                                                                    value={matchResult.golesLocal}
                                                                                    onChange={e => setMatchResult({ ...matchResult, golesLocal: e.target.value })}
                                                                                />
                                                                                <span>-</span>
                                                                                <input
                                                                                    type="number" min="0" style={{ width: 45, minHeight: 30, padding: 2, textAlign: 'center' }}
                                                                                    value={matchResult.golesVisitante}
                                                                                    onChange={e => setMatchResult({ ...matchResult, golesVisitante: e.target.value })}
                                                                                />
                                                                                <button onClick={() => handleSaveMatchResult(p.id, false)} style={{ padding: '4px 8px', background: '#31d94f', color: '#000', border: 0, borderRadius: 4 }}>
                                                                                    <i className="bi bi-floppy"></i>
                                                                                </button>
                                                                                <button onClick={() => setEditingMatchId(null)} style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', border: 0, borderRadius: 4 }}>
                                                                                    <i className="bi bi-x-lg"></i>
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {tab === 'torneos' && (
                <>
                    {/* Torneos Summary Metrics */}
                    <div className="metric-grid">
                        <article>
                            <span>Total Torneos</span>
                            <strong>{torneos.length}</strong>
                        </article>
                        <article>
                            <span>Abiertos</span>
                            <strong style={{ color: '#4ade80' }}>{torneos.filter(t => t.estado === 'Abierto').length}</strong>
                        </article>
                        <article>
                            <span>En Curso</span>
                            <strong style={{ color: '#f2b84b' }}>{torneos.filter(t => t.estado === 'En curso').length}</strong>
                        </article>
                        <article>
                            <span>Cancelados</span>
                            <strong style={{ color: '#ef4444' }}>{torneos.filter(t => t.estado === 'Cancelado').length}</strong>
                        </article>
                    </div>

                    <div className="section-actions">
                        <button className="primary-action" onClick={() => setShowTorneoForm(!showTorneoForm)}>
                            {showTorneoForm ? 'Cancelar' : '+ Nuevo Torneo'}
                        </button>
                    </div>

                    {showTorneoForm && (
                        <form className="admin-form" onSubmit={handleCreateTorneo} style={{ gridTemplateColumns: 'repeat(4, 1fr) auto', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Nombre</label>
                                <input
                                    placeholder="Nombre del torneo"
                                    value={torneoForm.nombre}
                                    onChange={e => setTorneoForm({ ...torneoForm, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Reglamento</label>
                                <input
                                    placeholder="Reglamento / Info"
                                    value={torneoForm.reglamento}
                                    onChange={e => setTorneoForm({ ...torneoForm, reglamento: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Formato</label>
                                <select
                                    value={torneoForm.formato}
                                    onChange={e => setTorneoForm({ ...torneoForm, formato: e.target.value })}
                                >
                                    <option value="EliminacionDirecta">Eliminación Directa</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Cupo de Equipos</label>
                                <input
                                    type="number"
                                    min="2"
                                    placeholder="Cupo"
                                    value={torneoForm.cupoEquipos}
                                    onChange={e => setTorneoForm({ ...torneoForm, cupoEquipos: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="primary-action" style={{ height: 44 }}>Guardar Torneo</button>
                        </form>
                    )}

                    {loading ? <div className="empty-state">Cargando torneos...</div> : (
                        torneos.length === 0 ? <div className="empty-state">No hay torneos registrados.</div> : (
                            <div className="data-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Reglamento</th>
                                            <th>Formato</th>
                                            <th>Equipos</th>
                                            <th>Cupo</th>
                                            <th>Partidos</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {torneos.map(t => (
                                            <tr key={t.id} className={selectedTorneoId === t.id ? 'active-row' : ''} style={selectedTorneoId === t.id ? { background: 'rgba(49, 217, 79, 0.05)' } : {}}>
                                                <td>#{t.id}</td>
                                                <td style={{ fontWeight: 700 }}>{t.nombre}</td>
                                                <td>{t.reglamento}</td>
                                                <td>{t.formato === 'TodosContraTodos' ? 'Todos vs Todos' : 'Eliminación Directa'}</td>
                                                <td>{t.equiposInscriptos}</td>
                                                <td>{t.cupoEquipos}</td>
                                                <td>{t.partidos}</td>
                                                <td>
                                                    <span className={`pill ${t.estado === 'Abierto' ? 'success' : t.estado === 'En curso' ? 'pending' : 'danger'}`}>
                                                        {t.estado}
                                                    </span>
                                                </td>
                                                <td className="table-actions">
                                                    <button onClick={() => loadTorneoDetails(t.id)}>
                                                        <i className={`bi ${selectedTorneoId === t.id ? 'bi-eye-slash' : 'bi-search'}`}></i> {selectedTorneoId === t.id ? 'Ocultar' : 'Ver Detalle'}
                                                    </button>
                                                    {t.estado !== 'Cancelado' && (
                                                        <button className="danger" onClick={() => handleCancelTorneo(t.id)}>Cancelar</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {false && selectedTorneoId && torneoDetails && (
                        <div style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(149, 255, 172, 0.08)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3>Detalle del Torneo: <span style={{ color: '#31d94f' }}>{torneoDetails.nombre}</span></h3>
                                <span className={`pill ${torneoDetails.estado === 'Abierto' ? 'success' : torneoDetails.estado === 'En curso' ? 'pending' : 'danger'}`}>{torneoDetails.estado}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                                {/* Left Column: Teams */}
                                <div>
                                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Equipos Inscriptos ({torneoDetails.inscripciones?.length || 0} / {torneoDetails.cupoEquipos})</h4>
                                    {torneoDetails.inscripciones?.length === 0 ? (
                                        <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>No hay equipos inscriptos.</p>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                                            {torneoDetails.inscripciones?.map(i => (
                                                <li key={i.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span>⚽ {i.equipo?.nombre || `Equipo #${i.equipoId}`}</span>
                                                    <span style={{ color: '#8ca092', fontSize: '0.75rem' }}>{i.equipo?.categoria || 'Libre'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {torneoDetails.estado === 'Abierto' && (torneoDetails.inscripciones?.length || 0) < torneoDetails.cupoEquipos && (
                                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                            <select
                                                value={inscribirEquipoId}
                                                onChange={e => setInscribirEquipoId(e.target.value)}
                                                style={{ minHeight: 38, background: '#080c0a', color: '#fff', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, padding: '0 8px', flex: 1 }}
                                            >
                                                <option value="">Seleccionar Equipo</option>
                                                {equipos
                                                    .filter(eq => !torneoDetails.inscripciones?.some(ins => ins.equipoId === eq.id))
                                                    .map(eq => (
                                                        <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                                                    ))
                                                }
                                            </select>
                                            <button
                                                onClick={handleInscribirEquipoTorneo}
                                                className="primary-action"
                                                style={{ minHeight: 38, padding: '0 12px', fontSize: '0.85rem' }}
                                                disabled={!inscribirEquipoId}
                                            >
                                                Inscribir
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Fixture */}
                                <div>
                                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Fixture y Partidos</h4>

                                    {(!torneoDetails.partidos || torneoDetails.partidos.length === 0) ? (
                                        <div style={{ padding: 20, textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 8 }}>
                                            <p style={{ color: '#8ca092', marginBottom: 14, fontSize: '0.9rem' }}>El fixture aún no ha sido generado para este torneo.</p>
                                            {(torneoDetails.inscripciones?.length || 0) >= 2 ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                                    <input
                                                        type="date"
                                                        value={fixtureFechaInicio}
                                                        onChange={e => setFixtureFechaInicio(e.target.value)}
                                                        style={{ width: 'auto', minHeight: 38, padding: '0 10px', background: '#080c0a', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, color: '#fff' }}
                                                    />
                                                    <button onClick={handleGenerarFixtureTorneo} className="primary-action" style={{ minHeight: 38, padding: '0 16px' }}>
                                                        Generar Fixture
                                                    </button>
                                                </div>
                                            ) : (
                                                <p style={{ color: '#ff9a8f', fontSize: '0.85rem', fontWeight: 'bold' }}>Se necesitan al menos 2 equipos inscriptos para generar el fixture.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="data-table" style={{ maxHeight: 300, overflow: 'auto' }}>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Fecha/Hora</th>
                                                        <th>Fase</th>
                                                        <th>Local</th>
                                                        <th>Resultado</th>
                                                        <th>Visitante</th>
                                                        <th>Estado</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {torneoDetails.partidos.map(p => (
                                                        <tr key={p.id}>
                                                            <td style={{ fontSize: '0.8rem' }}>{formatLocalDateTime(p.fechaHora)}</td>
                                                            <td style={{ color: '#31d94f', fontWeight: 700 }}>
                                                                {(() => {
                                                                    const fixture = torneoDetails.fixtures?.find(f => f.id === p.fixtureId);
                                                                    let remaining = Math.max(2, torneoDetails.inscripciones?.filter(i => i.estado === 'Confirmado').length || 2);
                                                                    for (let round = 1; round < (fixture?.numero || 1); round += 1) remaining = Math.ceil(remaining / 2);
                                                                    if (remaining <= 2) return 'Final';
                                                                    if (remaining <= 4) return 'Semifinal';
                                                                    if (remaining <= 8) return 'Cuartos';
                                                                    if (remaining <= 16) return 'Octavos';
                                                                    return `Ronda de ${remaining}`;
                                                                })()}
                                                            </td>
                                                            <td style={{ fontWeight: p.golesLocal > p.golesVisitante ? 'bold' : 'normal', color: p.golesLocal > p.golesVisitante ? '#31d94f' : '#fff' }}>
                                                                {p.equipoLocal?.nombre || `Equipo #${p.equipoLocalId}`}
                                                            </td>
                                                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', color: '#4ade80' }}>
                                                                {p.estado === 'Finalizado' ? `${p.golesLocal} - ${p.golesVisitante}` : 'vs'}
                                                            </td>
                                                            <td style={{ fontWeight: p.golesVisitante > p.golesLocal ? 'bold' : 'normal', color: p.golesVisitante > p.golesLocal ? '#31d94f' : '#fff' }}>
                                                                {p.equipoVisitante?.nombre || `Equipo #${p.equipoVisitanteId}`}
                                                            </td>
                                                            <td>
                                                                <span className={`pill ${p.estado === 'Finalizado' ? 'success' : 'neutral'}`}>{p.estado}</span>
                                                            </td>
                                                            <td className="table-actions">
                                                                {p.estado !== 'Finalizado' && editingMatchId !== p.id && (
                                                                    <button onClick={() => { setEditingMatchId(p.id); setMatchResult({ golesLocal: 0, golesVisitante: 0 }); }}>✍️ Resultado</button>
                                                                )}
                                                                {editingMatchId === p.id && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                        <input
                                                                            type="number" min="0" style={{ width: 45, minHeight: 30, padding: 2, textAlign: 'center' }}
                                                                            value={matchResult.golesLocal}
                                                                            onChange={e => setMatchResult({ ...matchResult, golesLocal: e.target.value })}
                                                                        />
                                                                        <span>-</span>
                                                                        <input
                                                                            type="number" min="0" style={{ width: 45, minHeight: 30, padding: 2, textAlign: 'center' }}
                                                                            value={matchResult.golesVisitante}
                                                                            onChange={e => setMatchResult({ ...matchResult, golesVisitante: e.target.value })}
                                                                        />
                                                                        <button onClick={() => handleSaveMatchResult(p.id, false)} style={{ padding: '4px 8px', background: '#31d94f', color: '#000', border: 0, borderRadius: 4 }}>💾</button>
                                                                        <button onClick={() => setEditingMatchId(null)} style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', border: 0, borderRadius: 4 }}>❌</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
            />
        </section>
    );
}

// ─── Módulo Clases y Entrenamientos ───────────────────────────────────────────
function ClasesEntrenamientosPanel({ setMessage, API_URL, canchas }) {
    const [clases, setClases] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedClaseId, setSelectedClaseId] = useState(null);
    const [claseDetails, setClaseDetails] = useState(null);

    // Confirm modal state (local to this component)
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
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

    // Form states
    const [showClaseForm, setShowClaseForm] = useState(false);
    const [claseForm, setClaseForm] = useState({
        tipo: '',
        canchaId: '',
        profesorId: '',
        fechaHora: '',
        capacidadMax: 15
    });

    const [inscribirAlumnoId, setInscribirAlumnoId] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cr, ur] = await Promise.all([
                clasesApi.getAll(),
                usersApi.getAll()
            ]);
            setClases(cr);
            setUsers(ur);
        } catch (error) {
            setMessage('Error al cargar datos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const loadClaseDetails = async (id) => {
        try {
            const data = await clasesApi.getById(id);
            setClaseDetails(data);
            setSelectedClaseId(id);
        } catch (error) {
            setMessage('Error al cargar los detalles: ' + error.message);
        }
    };

    const handleCreateClase = async (e) => {
        e.preventDefault();
        try {
            await clasesApi.create({
                canchaId: Number(claseForm.canchaId),
                profesorId: Number(claseForm.profesorId),
                tipo: claseForm.tipo,
                fechaHora: new Date(claseForm.fechaHora).toISOString(),
                capacidadMax: Number(claseForm.capacidadMax)
            });
            setMessage('Clase programada con éxito');
            setClaseForm({ tipo: '', canchaId: '', profesorId: '', fechaHora: '', capacidadMax: 15 });
            setShowClaseForm(false);
            fetchAll();
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleCancelarClase = (id) => {
        showConfirm('¿Seguro que desea cancelar esta clase?', async () => {
            try {
                await clasesApi.remove(id);
                setMessage('Clase cancelada');
                fetchAll();
                if (selectedClaseId === id) {
                    setSelectedClaseId(null);
                    setClaseDetails(null);
                }
            } catch (error) {
                setMessage('Error: ' + error.message);
            }
        });
    };

    const handleToggleAsistencia = async (usuarioId, currentPresent) => {
        try {
            await clasesApi.toggleAsistencia(selectedClaseId, Number(usuarioId), !currentPresent);
            loadClaseDetails(selectedClaseId);
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleAddAlumno = async () => {
        if (!inscribirAlumnoId) return;
        try {
            await clasesApi.toggleAsistencia(selectedClaseId, Number(inscribirAlumnoId), false);
            setMessage('Alumno inscripto en clase');
            setInscribirAlumnoId('');
            loadClaseDetails(selectedClaseId);
            fetchAll();
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const formatLocalDateTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    };

    // Filter users to get Teachers/Trainers
    const profesores = users.filter(u => u.rol === 'Profesor' || u.rol === 'Entrenador');

    // Filter users to get Students (Client role)
    const alumnosDisponibles = users.filter(u =>
        u.rol === 'Usuario' &&
        !claseDetails?.asistencias?.some(a => a.usuarioId === u.id)
    );

    return (
        <section className="admin-panel" style={{ display: 'grid', gap: '20px' }}>
            {/* Clases Metrics */}
            <div className="metric-grid">
                <article>
                    <span>Total Clases</span>
                    <strong>{clases.length}</strong>
                </article>
                <article>
                    <span>Programadas</span>
                    <strong style={{ color: '#4ade80' }}>{clases.filter(c => c.estado === 'Programada').length}</strong>
                </article>
                <article>
                    <span>En Curso</span>
                    <strong style={{ color: '#f2b84b' }}>{clases.filter(c => c.estado === 'En curso').length}</strong>
                </article>
                <article>
                    <span>Canceladas</span>
                    <strong style={{ color: '#ef4444' }}>{clases.filter(c => c.estado === 'Cancelada').length}</strong>
                </article>
            </div>

            <div className="section-actions">
                <button className="primary-action" onClick={() => setShowClaseForm(!showClaseForm)}>
                    {showClaseForm ? 'Cancelar' : '+ Nueva Clase'}
                </button>
            </div>

            {showClaseForm && (
                <form className="admin-form" onSubmit={handleCreateClase} style={{ gridTemplateColumns: 'repeat(5, 1fr) auto', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Clase / Tipo</label>
                        <input
                            placeholder="Ej. Funcional, Escuelita"
                            value={claseForm.tipo}
                            onChange={e => setClaseForm({ ...claseForm, tipo: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Cancha</label>
                        <select
                            value={claseForm.canchaId}
                            onChange={e => setClaseForm({ ...claseForm, canchaId: e.target.value })}
                            required
                        >
                            <option value="">Seleccionar Cancha</option>
                            {canchas.map(c => (
                                <option key={c.id} value={c.id}>{c.superficie} (Cancha #{c.id})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Profesor</label>
                        <select
                            value={claseForm.profesorId}
                            onChange={e => setClaseForm({ ...claseForm, profesorId: e.target.value })}
                            required
                        >
                            <option value="">Seleccionar Profesor</option>
                            {profesores.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Fecha y Hora</label>
                        <input
                            type="datetime-local"
                            value={claseForm.fechaHora}
                            onChange={e => setClaseForm({ ...claseForm, fechaHora: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#8ca092', display: 'block', marginBottom: 4 }}>Capacidad Máx.</label>
                        <input
                            type="number"
                            min="1"
                            value={claseForm.capacidadMax}
                            onChange={e => setClaseForm({ ...claseForm, capacidadMax: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="primary-action" style={{ height: 44 }}>Guardar Clase</button>
                </form>
            )}

            {loading ? <div className="empty-state">Cargando clases...</div> : (
                clases.length === 0 ? <div className="empty-state">No hay clases programadas.</div> : (
                    <div className="data-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Clase</th>
                                    <th>Fecha / Hora</th>
                                    <th>Cancha</th>
                                    <th>Profesor</th>
                                    <th>Inscriptos</th>
                                    <th>Capacidad Máx</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clases.map(c => (
                                    <tr key={c.id} className={selectedClaseId === c.id ? 'active-row' : ''} style={selectedClaseId === c.id ? { background: 'rgba(49, 217, 79, 0.05)' } : {}}>
                                        <td>#{c.id}</td>
                                        <td style={{ fontWeight: 700 }}>{c.tipo}</td>
                                        <td>{formatLocalDateTime(c.fechaHora)}</td>
                                        <td>{c.cancha}</td>
                                        <td>{c.profesor}</td>
                                        <td>{c.alumnos}</td>
                                        <td>{c.capacidadMax}</td>
                                        <td>
                                            <span className={`pill ${c.estado === 'Programada' ? 'success' : c.estado === 'En curso' ? 'pending' : 'danger'}`}>
                                                {c.estado}
                                            </span>
                                        </td>
                                        <td className="table-actions">
                                            <button onClick={() => loadClaseDetails(c.id)}>👥 Alumnos / Asistencia</button>
                                            {c.estado !== 'Cancelada' && (
                                                <button className="danger" onClick={() => handleCancelarClase(c.id)}>Cancelar Clase</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {selectedClaseId && claseDetails && (
                <div style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(149, 255, 172, 0.08)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3>Gestión de Alumnos — Clase: <span style={{ color: '#31d94f' }}>{claseDetails.tipo}</span></h3>
                        <span className={`pill ${claseDetails.estado === 'Programada' ? 'success' : 'danger'}`}>{claseDetails.estado}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Alumnos List and Attendance */}
                        <div>
                            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Asistencia ({claseDetails.asistencias?.length || 0} / {claseDetails.capacidadMax})</h4>
                            {claseDetails.asistencias?.length === 0 ? (
                                <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>No hay alumnos inscriptos en esta clase.</p>
                            ) : (
                                <div className="data-table" style={{ maxHeight: 250 }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Email</th>
                                                <th>Asistencia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {claseDetails.asistencias.map(a => (
                                                <tr key={a.id}>
                                                    <td>{a.usuario?.nombre} {a.usuario?.apellido}</td>
                                                    <td style={{ fontSize: '0.8rem', color: '#8ca092' }}>{a.usuario?.email}</td>
                                                    <td>
                                                        <label className="check-field" style={{ minHeight: 'auto', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={a.presente}
                                                                onChange={() => handleToggleAsistencia(a.usuarioId, a.presente)}
                                                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                                                            />
                                                            <span style={{ fontSize: '0.85rem', color: a.presente ? '#31d94f' : '#ef4444' }}>{a.presente ? 'Presente' : 'Ausente'}</span>
                                                        </label>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {claseDetails.estado === 'Programada' && (claseDetails.asistencias?.length || 0) < claseDetails.capacidadMax && (
                                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                    <select
                                        value={inscribirAlumnoId}
                                        onChange={e => setInscribirAlumnoId(e.target.value)}
                                        style={{ minHeight: 38, background: '#080c0a', color: '#fff', border: '1px solid rgba(149,255,172,0.18)', borderRadius: 8, padding: '0 8px', flex: 1 }}
                                    >
                                        <option value="">Seleccionar Alumno</option>
                                        {alumnosDisponibles.map(al => (
                                            <option key={al.id} value={al.id}>{al.nombre} {al.apellido} ({al.email})</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAddAlumno}
                                        className="primary-action"
                                        style={{ minHeight: 38, padding: '0 12px', fontSize: '0.85rem' }}
                                        disabled={!inscribirAlumnoId}
                                    >
                                        Inscribir Alumno
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Class Info */}
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 12 }}>Detalles de Programación</h4>
                            <dl style={{ display: 'grid', gap: '10px', margin: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <dt style={{ color: '#8ca092', fontSize: '0.85rem' }}>Fecha y Hora:</dt>
                                    <dd style={{ margin: 0, fontWeight: 'bold' }}>{formatLocalDateTime(claseDetails.fechaHora)}</dd>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <dt style={{ color: '#8ca092', fontSize: '0.85rem' }}>Profesor Asignado:</dt>
                                    <dd style={{ margin: 0, fontWeight: 'bold', color: '#31d94f' }}>
                                        👨‍🏫 {claseDetails.profesor?.nombre} {claseDetails.profesor?.apellido}
                                    </dd>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <dt style={{ color: '#8ca092', fontSize: '0.85rem' }}>Cancha Asignada:</dt>
                                    <dd style={{ margin: 0, fontWeight: 'bold' }}>
                                        🏟️ {claseDetails.cancha?.superficie} (Cancha #{claseDetails.canchaId})
                                    </dd>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <dt style={{ color: '#8ca092', fontSize: '0.85rem' }}>Capacidad:</dt>
                                    <dd style={{ margin: 0, fontWeight: 'bold' }}>{claseDetails.capacidadMax} alumnos</dd>
                                </div>
                            </dl>
                        </div >
                    </div >
                </div >
            )}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
            />
        </section >
    );
}


// ─── Centro de Reportes y Estadísticas ─────────────────────────────────────────
function ReportsDashboard({ notify, moneyFmt }) {
    const todayStr = new Date().toISOString().split('T')[0];
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [reportTab, setReportTab] = useState('ingresos');
    const [desde, setDesde] = useState(thirtyDaysAgoStr);
    const [hasta, setHasta] = useState(todayStr);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [expandedEvent, setExpandedEvent] = useState(null);

    const loadReport = useCallback(async () => {
        if (!desde || !hasta) return;
        setLoading(true);
        try {
            let res;
            if (reportTab === 'ingresos') {
                res = await reportesApi.getIngresos(desde, hasta);
            } else if (reportTab === 'asistencia') {
                res = await reportesApi.getAsistencia(desde, hasta);
            } else {
                res = await reportesApi.getReservas(desde, hasta);
            }
            setData(res);
        } catch (error) {
            notify('Error al generar reporte: ' + error.message, 'error');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [reportTab, desde, hasta, notify]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleQuickFilter = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setDesde(start.toISOString().split('T')[0]);
        setHasta(end.toISOString().split('T')[0]);
    };

    const handlePrint = () => {
        if (!data) return;
        const w = window.open('', '_blank', 'width=900,height=700');
        
        let reportTitle = '';
        let contentHtml = '';

        const formattedDesde = new Date(desde).toLocaleDateString('es-AR');
        const formattedHasta = new Date(hasta).toLocaleDateString('es-AR');

        if (reportTab === 'ingresos') {
            reportTitle = 'Reporte de Ingresos por Período';
            contentHtml = `
                <h2>Resumen Financiero</h2>
                <div class="metrics">
                    <div class="metric-box">
                        <h3>Monto Original</h3>
                        <p>${moneyFmt.format(data.totalMontoOriginal)}</p>
                    </div>
                    <div class="metric-box">
                        <h3>Descuentos Aplicados</h3>
                        <p style="color:#ef4444">-${moneyFmt.format(data.totalDescuento)}</p>
                    </div>
                    <div class="metric-box highlight">
                        <h3>Ingreso Neto</h3>
                        <p>${moneyFmt.format(data.totalMontoFinal)}</p>
                    </div>
                </div>

                <h2>Ingresos por Categoría</h2>
                <table>
                    <thead>
                        <tr><th>Categoría</th><th>Monto Recaudado</th></tr>
                    </thead>
                    <tbody>
                        ${data.porCategoria.map(c => `
                            <tr>
                                <td><strong>${c.categoria}</strong></td>
                                <td>${moneyFmt.format(c.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2>Métodos de Pago Utilizados</h2>
                <table>
                    <thead>
                        <tr><th>Método</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                        ${data.porMetodoPago.map(m => `
                            <tr>
                                <td><strong>${m.metodoPago}</strong></td>
                                <td>${moneyFmt.format(m.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2>Detalle de Transacciones</h2>
                <table>
                    <thead>
                        <tr><th>ID</th><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Desc.</th><th>Total</th><th>Método</th></tr>
                    </thead>
                    <tbody>
                        ${data.transacciones.map(t => `
                            <tr>
                                <td>#${t.id}</td>
                                <td>${new Date(t.fecha).toLocaleDateString('es-AR')}</td>
                                <td>${t.concepto}</td>
                                <td>${moneyFmt.format(t.monto)}</td>
                                <td style="color:#ef4444">${t.descuento > 0 ? `-${moneyFmt.format(t.descuento)}` : '—'}</td>
                                <td style="color:#31d94f; font-weight:bold">${moneyFmt.format(t.montoFinal)}</td>
                                <td>${t.metodoPago}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (reportTab === 'asistencia') {
            reportTitle = 'Reporte de Asistencia a Clases y Entrenamientos';
            contentHtml = `
                <h2>Resumen de Asistencia</h2>
                <div class="metrics">
                    <div class="metric-box">
                        <h3>Total Eventos</h3>
                        <p>${data.totalEventos}</p>
                    </div>
                    <div class="metric-box">
                        <h3>Inscripciones Totales</h3>
                        <p>${data.totalInscritos}</p>
                    </div>
                    <div class="metric-box">
                        <h3>Asistencias Confirmadas</h3>
                        <p>${data.totalPresentes}</p>
                    </div>
                    <div class="metric-box highlight">
                        <h3>Tasa de Asistencia General</h3>
                        <p>${data.tasaGeneral}%</p>
                    </div>
                </div>

                <h2>Detalle de Clases y Entrenamientos</h2>
                <table>
                    <thead>
                        <tr><th>Tipo</th><th>Nombre</th><th>Fecha</th><th>Instructor</th><th>Cancha</th><th>Inscriptos</th><th>Presentes</th><th>Ausentes</th><th>Asistencia %</th></tr>
                    </thead>
                    <tbody>
                        ${data.eventos.map(e => `
                            <tr>
                                <td><span class="badge ${e.tipo.toLowerCase()}">${e.tipo}</span></td>
                                <td>
                                    <strong>${e.nombre}</strong>
                                    ${e.alumnos && e.alumnos.length > 0 ? `
                                        <div style="font-size:0.75rem; color:#555; margin-top:4px;">
                                            <strong>Alumnos:</strong> ${e.alumnos.map(al => `${al.nombreCompleto} (${al.presente ? 'Presente' : 'Ausente'})`).join(', ')}
                                        </div>
                                    ` : '<div style="font-size:0.75rem; color:#999; margin-top:4px; font-style:italic;">Sin alumnos</div>'}
                                </td>
                                <td>${new Date(e.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td>${e.instructor}</td>
                                <td>${e.cancha}</td>
                                <td>${e.inscriptos} / ${e.capacidad}</td>
                                <td>${e.presentes}</td>
                                <td>${e.ausentes}</td>
                                <td style="font-weight:bold; color: ${e.tasaAsistencia >= 70 ? '#31d94f' : e.tasaAsistencia >= 40 ? '#f2b84b' : '#ef4444'}">${e.tasaAsistencia}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            reportTitle = 'Reporte de Reservas Realizadas, Canceladas y Pendientes';
            contentHtml = `
                <h2>Estado de Reservas</h2>
                <div class="metrics">
                    <div class="metric-box">
                        <h3>Total Reservas</h3>
                        <p>${data.totalReservas}</p>
                    </div>
                    <div class="metric-box">
                        <h3>Confirmadas (Pagadas)</h3>
                        <p style="color:#31d94f">${data.confirmadas}</p>
                    </div>
                    <div class="metric-box">
                        <h3>Pendientes</h3>
                        <p style="color:#f2b84b">${data.pendientes}</p>
                    </div>
                    <div class="metric-box">
                        <h3>Canceladas / Expiradas</h3>
                        <p style="color:#ef4444">${data.canceladas + data.expiradas}</p>
                    </div>
                </div>
                <div class="metrics" style="margin-top: 10px;">
                    <div class="metric-box highlight">
                        <h3>Tasa de Cancelación</h3>
                        <p>${data.tasaCancelacion}%</p>
                    </div>
                </div>

                <h2>Rendimiento de Canchas</h2>
                <table>
                    <thead>
                        <tr><th>Cancha</th><th>Total Reservas</th><th>Ingreso Confirmado</th></tr>
                    </thead>
                    <tbody>
                        ${data.porCancha.map(c => `
                            <tr>
                                <td><strong>${c.cancha}</strong></td>
                                <td>${c.total} reservas</td>
                                <td style="color:#31d94f; font-weight:bold">${moneyFmt.format(c.ingresoEstimado)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2>Listado Detallado de Reservas</h2>
                <table>
                    <thead>
                        <tr><th>ID</th><th>Cancha</th><th>Cliente</th><th>Fecha</th><th>Horario</th><th>Precio</th><th>Estado</th><th>Pago</th></tr>
                    </thead>
                    <tbody>
                        ${data.reservas.map(r => `
                            <tr>
                                <td>#${r.id}</td>
                                <td>${r.cancha}</td>
                                <td>${r.cliente}</td>
                                <td>${new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                                <td>${r.horaInicio} - ${r.horaFin}</td>
                                <td>${moneyFmt.format(r.precio)}</td>
                                <td><span class="badge ${r.estado.toLowerCase()}">${r.estado}</span></td>
                                <td>${r.pago}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        w.document.write(`
            <html>
            <head>
                <title>${reportTitle}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff; color: #333; padding: 30px; }
                    .header { border-bottom: 2px solid #2d6a4f; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
                    .header h1 { margin: 0; color: #2d6a4f; font-size: 24px; }
                    .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
                    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                    .metric-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; background: #f9f9f9; }
                    .metric-box h3 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #666; }
                    .metric-box p { margin: 0; font-size: 20px; font-weight: bold; color: #333; }
                    .metric-box.highlight { background: #e8f5e9; border-color: #a5d6a7; }
                    .metric-box.highlight p { color: #2e7d32; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #f2f2f2; color: #333; font-weight: bold; }
                    tr:nth-child(even) { background-color: #fcfcfc; }
                    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
                    .badge.clase { background: #e3f2fd; color: #1565c0; }
                    .badge.entrenamiento { background: #efebe9; color: #4e342e; }
                    .badge.confirmada { background: #e8f5e9; color: #2e7d32; }
                    .badge.pendiente { background: #fff8e1; color: #f57f17; }
                    .badge.cancelada { background: #ffeeeef; color: #c62828; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>GOL AHORA - SISTEMA DE GESTIÓN</h1>
                        <p>${reportTitle} · Período: ${formattedDesde} al ${formattedHasta}</p>
                    </div>
                    <div style="font-size: 12px; color: #666; text-align: right;">
                        Generado el ${new Date().toLocaleString('es-AR')}<br>
                        Exportación Oficial
                    </div>
                </div>
                ${contentHtml}
                <script>window.onload = () => window.print()</script>
            </body>
            </html>
        `);
        w.document.close();
    };

    return (
        <section className="admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div className="status-tabs" style={{ display: 'flex', gap: '6px', margin: 0 }}>
                    <button className={reportTab === 'ingresos' ? 'active' : ''} onClick={() => { setReportTab('ingresos'); setData(null); setExpandedEvent(null); }}>
                        <i className="bi bi-cash-stack me-2"></i> Ingresos
                    </button>
                    <button className={reportTab === 'asistencia' ? 'active' : ''} onClick={() => { setReportTab('asistencia'); setData(null); setExpandedEvent(null); }}>
                        <i className="bi bi-people-fill me-2"></i> Asistencia
                    </button>
                    <button className={reportTab === 'reservas' ? 'active' : ''} onClick={() => { setReportTab('reservas'); setData(null); setExpandedEvent(null); }}>
                        <i className="bi bi-calendar-check me-2"></i> Reservas
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleQuickFilter(7)} className="ghost-button" style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: 'auto' }}>7d</button>
                        <button onClick={() => handleQuickFilter(30)} className="ghost-button" style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: 'auto' }}>30d</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                            type="date"
                            value={desde}
                            onChange={e => setDesde(e.target.value)}
                            style={{ minHeight: 38, background: '#0a100c', color: '#fff', border: '1px solid rgba(49,217,79,0.25)', borderRadius: 8, padding: '0 8px', fontSize: '0.85rem' }}
                        />
                        <span style={{ color: '#8ca092' }}>al</span>
                        <input
                            type="date"
                            value={hasta}
                            onChange={e => setHasta(e.target.value)}
                            style={{ minHeight: 38, background: '#0a100c', color: '#fff', border: '1px solid rgba(49,217,79,0.25)', borderRadius: 8, padding: '0 8px', fontSize: '0.85rem' }}
                        />
                    </div>
                    <button onClick={handlePrint} className="ghost-button" style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 38, border: '1px solid rgba(255,255,255,0.15)' }} disabled={!data}>
                        <i className="bi bi-printer-fill"></i> Imprimir PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Generando reporte y calculando métricas...</div>
            ) : !data ? (
                <div className="empty-state">No se pudieron cargar datos para el período seleccionado.</div>
            ) : (
                <>
                    {reportTab === 'ingresos' && (
                        <>
                            <div className="metric-grid">
                                <article>
                                    <span>Ingreso Bruto</span>
                                    <strong>{moneyFmt.format(data.totalMontoOriginal)}</strong>
                                </article>
                                <article>
                                    <span>Descuentos</span>
                                    <strong style={{ color: '#ef4444' }}>-{moneyFmt.format(data.totalDescuento)}</strong>
                                </article>
                                <article>
                                    <span>Ingreso Neto (Cobrado)</span>
                                    <strong style={{ color: '#31d94f' }}>{moneyFmt.format(data.totalMontoFinal)}</strong>
                                </article>
                                <article>
                                    <span>Transacciones</span>
                                    <strong>{data.transacciones?.length || 0}</strong>
                                </article>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: 10 }}>
                                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                                    <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}><i className="bi bi-pie-chart-fill me-2 text-success"></i>Por Categoría</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {data.porCategoria.map(c => {
                                            const pct = data.totalMontoFinal > 0 ? (c.total / data.totalMontoFinal) * 100 : 0;
                                            return (
                                                <div key={c.categoria}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4 }}>
                                                        <span style={{ fontWeight: 'bold' }}>{c.categoria}</span>
                                                        <span style={{ color: '#31d94f', fontWeight: 'bold' }}>{moneyFmt.format(c.total)} ({Math.round(pct)}%)</span>
                                                    </div>
                                                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #1b4332, #31d94f)', borderRadius: 3 }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {data.porCategoria.length === 0 && <p style={{ color: '#8ca092', fontSize: '0.85rem', textAlign: 'center' }}>Sin registros por categoría.</p>}
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                                    <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}><i className="bi bi-wallet2 me-2 text-success"></i>Por Método de Pago</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {data.porMetodoPago.map(m => {
                                            const pct = data.totalMontoFinal > 0 ? (m.total / data.totalMontoFinal) * 100 : 0;
                                            return (
                                                <div key={m.metodoPago}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4 }}>
                                                        <span style={{ fontWeight: 'bold' }}>{m.metodoPago}</span>
                                                        <span style={{ color: '#31d94f', fontWeight: 'bold' }}>{moneyFmt.format(m.total)} ({Math.round(pct)}%)</span>
                                                    </div>
                                                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0f2c3b, #3ca6d8)', borderRadius: 3 }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {data.porMetodoPago.length === 0 && <p style={{ color: '#8ca092', fontSize: '0.85rem', textAlign: 'center' }}>Sin registros por método de pago.</p>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 10 }}>
                                <h4 style={{ marginBottom: 12 }}><i className="bi bi-list-ul me-2 text-success"></i>Detalle de Transacciones</h4>
                                <div className="data-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Fecha</th>
                                                <th>Concepto</th>
                                                <th>Monto</th>
                                                <th>Desc.</th>
                                                <th>Total</th>
                                                <th>Método</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.transacciones.map(t => (
                                                <tr key={t.id}>
                                                    <td><span style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700 }}>#{t.id}</span></td>
                                                    <td style={{ fontSize: '0.82rem' }}>{new Date(t.fecha).toLocaleDateString('es-AR')}</td>
                                                    <td><strong>{t.concepto}</strong></td>
                                                    <td>{moneyFmt.format(t.monto)}</td>
                                                    <td style={{ color: '#ef4444' }}>{t.descuento > 0 ? `-${moneyFmt.format(t.descuento)}` : '—'}</td>
                                                    <td style={{ color: '#31d94f', fontWeight: 700 }}>{moneyFmt.format(t.montoFinal)}</td>
                                                    <td><span className="pill neutral" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{t.metodoPago}</span></td>
                                                </tr>
                                            ))}
                                            {data.transacciones.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#8ca092' }}>No se encontraron cobros registrados en este período.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {reportTab === 'asistencia' && (
                        <>
                            <div className="metric-grid">
                                <article>
                                    <span>Eventos Realizados</span>
                                    <strong>{data.totalEventos}</strong>
                                </article>
                                <article>
                                    <span>Inscripciones Totales</span>
                                    <strong>{data.totalInscritos}</strong>
                                </article>
                                <article>
                                    <span>Asistencias (Presentes)</span>
                                    <strong style={{ color: '#31d94f' }}>{data.totalPresentes}</strong>
                                </article>
                                <article>
                                    <span>Asistencia General</span>
                                    <strong style={{ color: data.tasaGeneral >= 70 ? '#31d94f' : data.tasaGeneral >= 40 ? '#f2b84b' : '#ef4444' }}>
                                        {data.tasaGeneral}%
                                    </strong>
                                </article>
                            </div>

                            <div style={{ marginTop: 10 }}>
                                <h4 style={{ marginBottom: 12 }}><i className="bi bi-journal-check me-2 text-success"></i>Asistencia por Evento</h4>
                                <div className="data-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Tipo</th>
                                                <th>Nombre</th>
                                                <th>Fecha / Hora</th>
                                                <th>Instructor</th>
                                                <th>Cancha</th>
                                                <th>Alumnos</th>
                                                <th>Presentes</th>
                                                <th>Ausentes</th>
                                                <th>Asistencia %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                             {data.eventos.map((e, idx) => {
                                                 const isExpanded = expandedEvent === `${e.tipo}-${e.id}`;
                                                 return (
                                                     <Fragment key={idx}>
                                                         <tr>
                                                             <td>
                                                                 <span className={`pill ${e.tipo === 'Clase' ? 'success' : 'neutral'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                                                                     {e.tipo}
                                                                 </span>
                                                             </td>
                                                             <td><strong>{e.nombre}</strong></td>
                                                             <td style={{ fontSize: '0.82rem' }}>{new Date(e.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                             <td>{e.instructor}</td>
                                                             <td style={{ color: '#8ca092' }}>{e.cancha}</td>
                                                             <td 
                                                                 style={{ cursor: 'pointer', userSelect: 'none' }}
                                                                 onClick={() => setExpandedEvent(isExpanded ? null : `${e.tipo}-${e.id}`)}
                                                                 title="Haga clic para ver alumnos"
                                                             >
                                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                     <span style={{ textDecoration: 'underline', color: '#31d94f', fontWeight: 'bold' }}>{e.inscriptos} / {e.capacidad}</span>
                                                                     <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-success`} style={{ fontSize: '0.75rem' }}></i>
                                                                 </div>
                                                             </td>
                                                             <td style={{ color: '#31d94f', fontWeight: 'bold' }}>{e.presentes}</td>
                                                             <td style={{ color: '#ef4444' }}>{e.ausentes}</td>
                                                             <td>
                                                                 <span style={{
                                                                     fontWeight: 'bold',
                                                                     color: e.tasaAsistencia >= 70 ? '#31d94f' : e.tasaAsistencia >= 40 ? '#f2b84b' : '#ef4444'
                                                                 }}>
                                                                     {e.tasaAsistencia}%
                                                                 </span>
                                                             </td>
                                                         </tr>
                                                         {isExpanded && (
                                                             <tr style={{ background: 'rgba(49,217,79,0.02)' }}>
                                                                 <td colSpan="9" style={{ padding: '12px 20px', borderBottom: '1px solid rgba(49,217,79,0.1)' }}>
                                                                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                         <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#31d94f', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                             <i className="bi bi-people-fill"></i> Alumnos Inscriptos y Asistencia:
                                                                         </div>
                                                                         {e.alumnos && e.alumnos.length > 0 ? (
                                                                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginTop: 4 }}>
                                                                                 {e.alumnos.map(al => (
                                                                                     <div key={al.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, fontSize: '0.8rem' }}>
                                                                                         <span style={{ color: '#fff', fontWeight: 500 }}>{al.nombreCompleto}</span>
                                                                                         <span className={`pill ${al.presente ? 'success' : 'danger'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                                                                                             {al.presente ? 'Presente' : 'Ausente'}
                                                                                         </span>
                                                                                     </div>
                                                                                 ))}
                                                                             </div>
                                                                         ) : (
                                                                             <div style={{ fontSize: '0.8rem', color: '#8ca092', fontStyle: 'italic' }}>No hay alumnos inscriptos en este evento.</div>
                                                                         )}
                                                                     </div>
                                                                 </td>
                                                             </tr>
                                                         )}
                                                     </Fragment>
                                                 );
                                             })}
                                            {data.eventos.length === 0 && (
                                                <tr>
                                                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#8ca092' }}>No se encontraron clases o entrenamientos programados en este período.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {reportTab === 'reservas' && (
                        <>
                            <div className="metric-grid">
                                <article>
                                    <span>Total Reservas</span>
                                    <strong>{data.totalReservas}</strong>
                                </article>
                                <article>
                                    <span>Confirmadas</span>
                                    <strong style={{ color: '#31d94f' }}>{data.confirmadas}</strong>
                                </article>
                                <article>
                                    <span>Pendientes / Verificación</span>
                                    <strong style={{ color: '#f2b84b' }}>{data.pendientes}</strong>
                                </article>
                                <article>
                                    <span>Canceladas / Expiradas</span>
                                    <strong style={{ color: '#ef4444' }}>{data.canceladas + data.expiradas}</strong>
                                </article>
                            </div>
                            <div className="metric-grid" style={{ marginTop: '-10px' }}>
                                <article>
                                    <span>Tasa de Cancelación</span>
                                    <strong style={{ color: data.tasaCancelacion > 30 ? '#ef4444' : data.tasaCancelacion > 15 ? '#f2b84b' : '#31d94f' }}>
                                        {data.tasaCancelacion}%
                                    </strong>
                                </article>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: 10 }}>
                                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, gridColumn: 'span 2' }}>
                                    <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}><i className="bi bi-grid-3x3-gap me-2 text-success"></i>Rendimiento por Cancha</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                        {data.porCancha.map(c => {
                                            return (
                                                <div key={c.cancha} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: 6 }}>{c.cancha}</strong>
                                                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#8ca092', marginBottom: 4 }}>Reservas totales: {c.total}</span>
                                                    <span style={{ display: 'block', fontSize: '0.9rem', color: '#31d94f', fontWeight: 'bold' }}>Ingresos netos: {moneyFmt.format(c.ingresoEstimado)}</span>
                                                </div>
                                            );
                                        })}
                                        {data.porCancha.length === 0 && <p style={{ color: '#8ca092', fontSize: '0.85rem', textAlign: 'center', gridColumn: 'span 2' }}>Sin reservas en este período.</p>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 10 }}>
                                <h4 style={{ marginBottom: 12 }}><i className="bi bi-calendar-check-fill me-2 text-success"></i>Listado Detallado de Reservas</h4>
                                <div className="data-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Cancha</th>
                                                <th>Cliente</th>
                                                <th>Fecha</th>
                                                <th>Horario</th>
                                                <th>Precio</th>
                                                <th>Estado</th>
                                                <th>Pago</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.reservas.map(r => (
                                                <tr key={r.id}>
                                                    <td><span style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700 }}>#{r.id}</span></td>
                                                    <td><strong>{r.cancha}</strong></td>
                                                    <td>{r.cliente}</td>
                                                    <td style={{ fontSize: '0.82rem' }}>{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                                                    <td>{r.horaInicio} - {r.horaFin}</td>
                                                    <td>{moneyFmt.format(r.precio)}</td>
                                                    <td>
                                                        <span className={`pill ${r.estado === 'Confirmada' ? 'success' : r.estado === 'Cancelada' ? 'danger' : 'pending'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                            {r.estado}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`pill ${r.pago === 'Pagado' ? 'success' : 'pending'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                            {r.pago}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {data.reservas.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#8ca092' }}>No se encontraron reservas en este período.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </section>
    );
}


