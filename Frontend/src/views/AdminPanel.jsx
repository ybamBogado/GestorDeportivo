import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const API_URL = 'http://localhost:5071/api/v1';

const todayInput = () => new Date().toISOString().split('T')[0];

const moneyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
});

const menuItems = [
    { id: 'usuarios', label: 'Gestión de usuarios' },
    { id: 'canchas', label: 'Gestión de canchas' },
    { id: 'reservas', label: 'Reservas y turnos' },
    { id: 'pagos', label: 'Pagos y recibos' },
    { id: 'ligas', label: 'Ligas y torneos' },
    { id: 'clases', label: 'Clases y entren.' },
    { id: 'reportes', label: 'Reportes' }
];

const statusFilters = ['Todas', 'Pendiente', 'Confirmada', 'Cancelada'];

export default function AdminPanel() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState('reservas');
    const [selectedDate, setSelectedDate] = useState(todayInput());
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const [reservas, setReservas] = useState([]);
    const [canchas, setCanchas] = useState([]);
    const [users, setUsers] = useState([]);

    const [showCanchaForm, setShowCanchaForm] = useState(false);
    const [canchaFormData, setCanchaFormData] = useState({
        superficie: '',
        capacidad: 10,
        tipoCancha: 'Futbol5'
    });

    const [showReservaForm, setShowReservaForm] = useState(false);
    const [reservaFormData, setReservaFormData] = useState({
        canchaId: '',
        personaId: '',
        fecha: todayInput(),
        horaInicio: '20:00',
        horaFin: '21:00',
        precio: 4500,
        pago: false
    });

    const [usuariosSubTab, setUsuariosSubTab] = useState('lista');
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

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setMessage('');

        try {
            const reservaParams = new URLSearchParams();
            if (selectedDate) reservaParams.append('fecha', selectedDate);
            if (statusFilter !== 'Todas') reservaParams.append('estado', statusFilter);

            const [reservasResponse, canchasResponse, usersResponse] = await Promise.all([
                fetch(`${API_URL}/reservas?${reservaParams.toString()}`),
                fetch(`${API_URL}/canchas`),
                fetch(`${API_URL}/users`)
            ]);

            if (!reservasResponse.ok || !canchasResponse.ok || !usersResponse.ok) {
                throw new Error('No se pudieron cargar los datos del panel');
            }

            const [reservasData, canchasData, usersData] = await Promise.all([
                reservasResponse.json(),
                canchasResponse.json(),
                usersResponse.json()
            ]);

            setReservas(reservasData);
            setCanchas(canchasData);
            setUsers(usersData);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, statusFilter]);

    useEffect(() => {
        if (!user || user.rol !== 'Administrador') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

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

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const shiftDate = (days) => {
        const date = new Date(`${selectedDate}T00:00:00`);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
        setReservaFormData(current => ({ ...current, fecha: date.toISOString().split('T')[0] }));
    };

    const handleCreateCancha = async (e) => {
        e.preventDefault();

        const response = await fetch(`${API_URL}/canchas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(canchaFormData)
        });

        if (response.ok) {
            setMessage('Cancha creada con éxito');
            setShowCanchaForm(false);
            setCanchaFormData({ superficie: '', capacidad: 10, tipoCancha: 'Futbol5' });
            fetchDashboardData();
        } else {
            setMessage('No se pudo crear la cancha');
        }
    };

    const handleCreateReserva = async (e) => {
        e.preventDefault();

        const response = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...reservaFormData,
                canchaId: Number(reservaFormData.canchaId),
                personaId: Number(reservaFormData.personaId),
                precio: Number(reservaFormData.precio)
            })
        });

        if (response.ok) {
            setMessage('Reserva creada con éxito');
            setShowReservaForm(false);
            setSelectedDate(reservaFormData.fecha);
            fetchDashboardData();
        } else {
            setMessage('No se pudo crear la reserva');
        }
    };

    const updateReservaEstado = async (id, estado) => {
        const response = await fetch(`${API_URL}/reservas/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, estado })
        });

        if (response.ok) {
            setMessage(`Reserva ${estado.toLowerCase()} con éxito`);
            fetchDashboardData();
        } else {
            setMessage('No se pudo actualizar la reserva');
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
            certificacion: selectedUser.certificacion ?? selectedUser.certificado ?? true,
            fechaVencimientoCertificacion: selectedUser.fechaVencimientoCertificacion 
                ? new Date(selectedUser.fechaVencimientoCertificacion).toISOString().split('T')[0] 
                : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();

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

        const response = await fetch(`${API_URL}/users/${userFormData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            setMessage('Usuario actualizado con éxito');
            setEditingUser(null);
            fetchDashboardData();
        } else {
            const err = await response.text();
            setMessage(`Error al actualizar: ${err}`);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            setMessage('Usuario eliminado con éxito');
            fetchDashboardData();
        } else {
            setMessage('Error al eliminar el usuario');
        }
    };

    const handleKycAction = async (targetUser, newRol, isApprove) => {
        const actionLabel = isApprove ? `aprobar como ${newRol}` : 'rechazar';
        if (!window.confirm(`¿Estás seguro de que deseas ${actionLabel} la solicitud de ${targetUser.nombre} ${targetUser.apellido}?`)) {
            return;
        }

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
            certificacion: isApprove,
            fechaVencimientoCertificacion: isApprove ? nextYear.toISOString() : null,
            certificadoPdf: isApprove ? targetUser.certificadoPdf : null
        };

        try {
            const response = await fetch(`${API_URL}/users/${targetUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage(isApprove ? `Usuario aprobado como ${newRol} con éxito` : 'Solicitud rechazada con éxito');
                fetchDashboardData();
            } else {
                const err = await response.text();
                setMessage(`Error al procesar solicitud: ${err}`);
            }
        } catch (error) {
            setMessage(`Error de red: ${error.message}`);
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
                            {item.label}
                        </button>
                    ))}
                </nav>

                <button className="admin-logout" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </aside>

            <section className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <p>Administrador</p>
                        <h1>{menuItems.find(item => item.id === activeSection)?.label}</h1>
                    </div>
                    <button className="ghost-button" onClick={fetchDashboardData}>
                        Actualizar
                    </button>
                </header>

                {message && <div className="admin-message">{message}</div>}

                {activeSection === 'reservas' && (
                    <section className="admin-panel">
                        <div className="reservation-toolbar">
                            <div>
                                <p>Fecha</p>
                                <div className="date-controls">
                                    <button type="button" onClick={() => shiftDate(-1)}>&lt;</button>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setReservaFormData(current => ({ ...current, fecha: e.target.value }));
                                        }}
                                    />
                                    <button type="button" onClick={() => shiftDate(1)}>&gt;</button>
                                </div>
                            </div>

                            <div className="status-tabs">
                                {statusFilters.map(filter => (
                                    <button
                                        key={filter}
                                        className={statusFilter === filter ? 'active' : ''}
                                        onClick={() => setStatusFilter(filter)}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            <button className="primary-action" onClick={() => setShowReservaForm(!showReservaForm)}>
                                {showReservaForm ? 'Cancelar' : '+ Nueva reserva'}
                            </button>
                        </div>

                        <div className="metric-grid">
                            <article>
                                <span>Confirmadas</span>
                                <strong>{metrics.confirmed}</strong>
                            </article>
                            <article>
                                <span>Pendientes</span>
                                <strong>{metrics.pending}</strong>
                            </article>
                            <article>
                                <span>Canceladas</span>
                                <strong>{metrics.canceled}</strong>
                            </article>
                            <article>
                                <span>Ingresos del día</span>
                                <strong>{moneyFormatter.format(metrics.revenue)}</strong>
                            </article>
                        </div>

                        {showReservaForm && (
                            <form className="admin-form reservation-form" onSubmit={handleCreateReserva}>
                                <select
                                    value={reservaFormData.canchaId}
                                    onChange={(e) => setReservaFormData({ ...reservaFormData, canchaId: e.target.value })}
                                    required
                                >
                                    <option value="">Cancha</option>
                                    {canchas.map(cancha => (
                                        <option key={cancha.id} value={cancha.id}>{cancha.superficie}</option>
                                    ))}
                                </select>

                                <select
                                    value={reservaFormData.personaId}
                                    onChange={(e) => setReservaFormData({ ...reservaFormData, personaId: e.target.value })}
                                    required
                                >
                                    <option value="">Cliente</option>
                                    {users.map(selectedUser => (
                                        <option key={selectedUser.id} value={selectedUser.id}>
                                            {selectedUser.nombre} {selectedUser.apellido}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="date"
                                    value={reservaFormData.fecha}
                                    onChange={(e) => setReservaFormData({ ...reservaFormData, fecha: e.target.value })}
                                    required
                                />
                                <input
                                    type="time"
                                    value={reservaFormData.horaInicio}
                                    onChange={(e) => setReservaFormData({ ...reservaFormData, horaInicio: e.target.value })}
                                    required
                                />
                                <input
                                    type="time"
                                    value={reservaFormData.horaFin}
                                    onChange={(e) => setReservaFormData({ ...reservaFormData, horaFin: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    min="0"
                                    value={reservaFormData.precio}
                                    onChange={(e) => setReservaFormData({ ...reservaFormData, precio: e.target.value })}
                                    required
                                />
                                <label className="check-field">
                                    <input
                                        type="checkbox"
                                        checked={reservaFormData.pago}
                                        onChange={(e) => setReservaFormData({ ...reservaFormData, pago: e.target.checked })}
                                    />
                                    Pago recibido
                                </label>
                                <button type="submit" className="primary-action">Guardar reserva</button>
                            </form>
                        )}

                        <div className="reservation-board">
                            {loading && <div className="empty-state">Cargando reservas...</div>}

                            {!loading && reservas.length === 0 && (
                                <div className="empty-state">No hay reservas para los filtros seleccionados.</div>
                            )}

                            {!loading && Object.entries(reservasByCancha).map(([canchaName, canchaReservas]) => (
                                <section key={canchaName} className="court-row">
                                    <div className="court-heading">
                                        <h2>Cancha: <span>{canchaName}</span></h2>
                                        <small>{canchaReservas.length} turno{canchaReservas.length === 1 ? '' : 's'}</small>
                                    </div>

                                    <div className="reservation-cards">
                                        {canchaReservas.map(reserva => (
                                            <article key={reserva.id} className={`reservation-card status-${reserva.estado.toLowerCase()}`}>
                                                <div className="reservation-card-head">
                                                    <strong>ID #{reserva.id}</strong>
                                                    <span>{reserva.estado}</span>
                                                </div>
                                                <dl>
                                                    <div>
                                                        <dt>Cliente</dt>
                                                        <dd>{reserva.cliente}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Precio</dt>
                                                        <dd>{moneyFormatter.format(reserva.precio || 0)}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Horario</dt>
                                                        <dd>{reserva.horaInicio} hs a {reserva.horaFin} hs</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Pago</dt>
                                                        <dd>{reserva.pago ? 'Recibido' : 'Pendiente'}</dd>
                                                    </div>
                                                </dl>
                                                <div className="reservation-actions">
                                                    {reserva.estado !== 'Confirmada' && (
                                                        <button onClick={() => updateReservaEstado(reserva.id, 'Confirmada')}>
                                                            Confirmar
                                                        </button>
                                                    )}
                                                    {reserva.estado !== 'Cancelada' && (
                                                        <button className="danger" onClick={() => updateReservaEstado(reserva.id, 'Cancelada')}>
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </section>
                )}

                {activeSection === 'canchas' && (
                    <section className="admin-panel">
                        <div className="section-actions">
                            <button className="primary-action" onClick={() => setShowCanchaForm(!showCanchaForm)}>
                                {showCanchaForm ? 'Cancelar' : '+ Nueva cancha'}
                            </button>
                        </div>

                        {showCanchaForm && (
                            <form className="admin-form" onSubmit={handleCreateCancha}>
                                <input
                                    type="text"
                                    placeholder="Superficie"
                                    value={canchaFormData.superficie}
                                    onChange={(e) => setCanchaFormData({ ...canchaFormData, superficie: e.target.value })}
                                    required
                                />
                                <select
                                    value={canchaFormData.tipoCancha}
                                    onChange={(e) => setCanchaFormData({ ...canchaFormData, tipoCancha: e.target.value })}
                                >
                                    <option value="Futbol5">Fútbol 5</option>
                                    <option value="Futbol7">Fútbol 7</option>
                                    <option value="Futbol11">Fútbol 11</option>
                                </select>
                                <input
                                    type="number"
                                    value={canchaFormData.capacidad}
                                    onChange={(e) => setCanchaFormData({ ...canchaFormData, capacidad: parseInt(e.target.value) })}
                                />
                                <button type="submit" className="primary-action">Guardar cancha</button>
                            </form>
                        )}

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Superficie</th>
                                        <th>Capacidad</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {canchas.map(cancha => (
                                        <tr key={cancha.id}>
                                            <td>#{cancha.id}</td>
                                            <td>{cancha.superficie}</td>
                                            <td>{cancha.capacidad} jugadores</td>
                                            <td><span className="pill success">{cancha.estado}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

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
                                        fetchDashboardData();
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
                            <form className="admin-form user-form" onSubmit={handleUpdateUser} style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nombre"
                                        value={userFormData.nombre}
                                        onChange={(e) => setUserFormData({ ...userFormData, nombre: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Apellido"
                                        value={userFormData.apellido}
                                        onChange={(e) => setUserFormData({ ...userFormData, apellido: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="DNI"
                                        value={userFormData.dni}
                                        onChange={(e) => setUserFormData({ ...userFormData, dni: parseInt(e.target.value) })}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={userFormData.email}
                                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="Legajo"
                                        value={userFormData.legajo}
                                        onChange={(e) => setUserFormData({ ...userFormData, legajo: parseInt(e.target.value) })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Dirección"
                                        value={userFormData.direccion}
                                        onChange={(e) => setUserFormData({ ...userFormData, direccion: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Teléfono"
                                        value={userFormData.telefono}
                                        onChange={(e) => setUserFormData({ ...userFormData, telefono: e.target.value })}
                                    />
                                    <select
                                        value={userFormData.rol}
                                        onChange={(e) => setUserFormData({ ...userFormData, rol: e.target.value })}
                                    >
                                        <option value="Usuario">Cliente / Usuario</option>
                                        <option value="Empleado">Empleado</option>
                                        <option value="Profesor">Profesor</option>
                                        <option value="Entrenador">Entrenador</option>
                                        <option value="Administrador">Administrador</option>
                                    </select>
                                </div>

                                {(userFormData.rol === 'Profesor' || userFormData.rol === 'Entrenador') && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(149,255,172,0.1)' }}>
                                        <label className="check-field" style={{ cursor: 'pointer' }}>
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

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" className="ghost-button" onClick={() => setEditingUser(null)}>Cancelar</button>
                                    <button type="submit" className="primary-action">Guardar cambios</button>
                                </div>
                            </form>
                        )}

                        {usuariosSubTab === 'lista' && !editingUser && (
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
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(selectedUser => (
                                            <tr key={selectedUser.id}>
                                                <td>#{selectedUser.id}</td>
                                                <td style={{ fontWeight: 'bold' }}>{selectedUser.nombre} {selectedUser.apellido}</td>
                                                <td>{selectedUser.dni}</td>
                                                <td>
                                                    <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <span>📞 {selectedUser.telefono || '—'}</span>
                                                        <span style={{ color: '#8ca092' }}>📍 {selectedUser.direccion || '—'}</span>
                                                    </div>
                                                </td>
                                                <td>{selectedUser.email}</td>
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
                                                <td className="table-actions">
                                                    <button onClick={() => handleEditUser(selectedUser)}>Editar</button>
                                                    <button onClick={() => handlePrintUser(selectedUser)}>Imprimir</button>
                                                    <button className="danger" onClick={() => handleDeleteUser(selectedUser.id)}>Borrar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                                            <th>Certificado PDF</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingKycUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#8ca092' }}>
                                                    No hay solicitudes pendientes de validación (KYC).
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingKycUsers.map(selectedUser => (
                                                <tr key={selectedUser.id}>
                                                    <td>#{selectedUser.id}</td>
                                                    <td style={{ fontWeight: 'bold' }}>{selectedUser.nombre} {selectedUser.apellido}</td>
                                                    <td>{selectedUser.dni}</td>
                                                    <td>
                                                        <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                            <span>📞 {selectedUser.telefono || '—'}</span>
                                                            <span style={{ color: '#8ca092' }}>📍 {selectedUser.direccion || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td>{selectedUser.email}</td>
                                                    <td>
                                                        <a 
                                                            href={`http://localhost:5071${selectedUser.certificadoPdf}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="pill success text-decoration-none"
                                                            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-block', fontWeight: 'bold' }}
                                                        >
                                                            📄 Ver Documento PDF
                                                        </a>
                                                    </td>
                                                    <td className="table-actions">
                                                        <button 
                                                            onClick={() => handleKycAction(selectedUser, 'Profesor', true)}
                                                            style={{ backgroundColor: '#1b4332', borderColor: '#2d6a4f', color: '#52b788', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}
                                                        >
                                                            Aprobar Profesor
                                                        </button>
                                                        <button 
                                                            onClick={() => handleKycAction(selectedUser, 'Entrenador', true)}
                                                            style={{ backgroundColor: '#0f2c3b', borderColor: '#1b4d66', color: '#3ca6d8', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}
                                                        >
                                                            Aprobar Entrenador
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
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {activeSection === 'pagos' && <PagosPanel moneyFormatter={moneyFormatter} setMessage={setMessage} />}

                {activeSection === 'ligas' && (
                    <LigasTorneosPanel moneyFormatter={moneyFormatter} setMessage={setMessage} API_URL={API_URL} />
                )}

                {activeSection === 'clases' && (
                    <ClasesEntrenamientosPanel setMessage={setMessage} API_URL={API_URL} canchas={canchas} />
                )}

                {activeSection === 'reportes' && (
                    <section className="admin-panel placeholder-panel">
                        <h2>Reportes</h2>
                        <p>La estructura del panel ya está preparada para sumar este módulo cuando se definan sus datos.</p>
                    </section>
                )}
            </section>
        </main>
    );
}

// ─── Módulo Pagos y Recibos ───────────────────────────────────────────────────
function PagosPanel({ moneyFormatter, setMessage }) {
    const [tab, setTab] = useState('cobros');
    const [cobros, setCobros] = useState([]);
    const [recibos, setRecibos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cobro form state
    const [showCobroForm, setShowCobroForm] = useState(false);
    const [editingCobro, setEditingCobro] = useState(null);
    const [cobroForm, setCobroForm] = useState({
        concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: ''
    });

    const fetchAll = async () => {
        setLoading(true);
        const [cr, rr] = await Promise.all([
            fetch(`${API_URL}/cobros`),
            fetch(`${API_URL}/recibos`)
        ]);
        if (cr.ok) setCobros(await cr.json());
        if (rr.ok) setRecibos(await rr.json());
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    // ── Cobros CRUD ────────────────────────────────────────────────────────────
    const handleSaveCobro = async (e) => {
        e.preventDefault();
        const monto = Number(cobroForm.monto);
        const desc  = Number(cobroForm.descuento);
        const body = {
            concepto: cobroForm.concepto,
            monto,
            descuento: desc,
            estado: cobroForm.estado,
            metodoPago: cobroForm.metodoPago
        };
        const url    = editingCobro ? `${API_URL}/cobros/${editingCobro}` : `${API_URL}/cobros`;
        const method = editingCobro ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) {
            setMessage(editingCobro ? 'Cobro actualizado' : 'Cobro creado');
            setShowCobroForm(false);
            setEditingCobro(null);
            setCobroForm({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' });
            fetchAll();
        } else {
            setMessage('No se pudo guardar el cobro');
        }
    };

    const handleEditCobro = (c) => {
        setEditingCobro(c.id);
        setCobroForm({ concepto: c.concepto, monto: c.monto, descuento: c.descuento, estado: c.estado, metodoPago: c.metodoPago });
        setShowCobroForm(true);
    };

    const handleDeleteCobro = async (id) => {
        if (!window.confirm('¿Eliminar este cobro?')) return;
        const res = await fetch(`${API_URL}/cobros/${id}`, { method: 'DELETE' });
        if (res.ok) { setMessage('Cobro eliminado'); fetchAll(); }
        else setMessage('No se pudo eliminar');
    };

    const handlePagarCobro = async (cobro) => {
        if (!window.confirm(`¿Registrar pago de ${moneyFormatter.format(cobro.montoFinal)} para el cobro #${cobro.id}?`)) return;
        const res = await fetch(`${API_URL}/cobros/${cobro.id}/pagar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monto: cobro.montoFinal, metodoPago: 'Efectivo', aprobado: true })
        });
        if (res.ok) { setMessage('Pago registrado y recibo generado'); fetchAll(); }
        else setMessage('Error al procesar el pago');
    };

    const handlePrintCobro = (c) => {
        const win = window.open('', '_blank', 'width=650,height=520');
        win.document.write(`
            <html><head><title>Cobro #${c.id} - Gol Ahora</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0b130e; color: #fff; padding: 40px; }
                .card { border: 2px solid #28a745; border-radius: 12px; padding: 28px; max-width: 480px; margin: auto; background: #111d13; }
                .header { font-size: 20px; font-weight: bold; border-bottom: 2px solid #28a745; padding-bottom: 12px; margin-bottom: 20px; color: #28a745; text-align: center; }
                .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
                .label { color: #8ca092; }
                .value { color: #fff; font-weight: bold; }
                .total { margin-top: 16px; padding-top: 12px; border-top: 1px solid #1b4332; font-size: 18px; }
                .pill { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: ${c.estado === 'Pagado' ? '#22c55e' : c.estado === 'Rechazado' ? '#ef4444' : '#f2b84b'}; color: #061007; }
                .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #6b7280; }
            </style></head>
            <body>
                <div class="card">
                    <div class="header">GOL AHORA — COMPROBANTE DE COBRO</div>
                    <div class="row"><span class="label">N° Cobro</span><span class="value">#${c.id}</span></div>
                    <div class="row"><span class="label">Fecha</span><span class="value">${new Date(c.fecha).toLocaleDateString('es-AR')}</span></div>
                    <div class="row"><span class="label">Concepto</span><span class="value">${c.concepto}</span></div>
                    <div class="row"><span class="label">Monto</span><span class="value">$${Number(c.monto).toLocaleString('es-AR')}</span></div>
                    <div class="row"><span class="label">Descuento</span><span class="value">-$${Number(c.descuento).toLocaleString('es-AR')}</span></div>
                    <div class="row total"><span class="label">Total</span><span class="value" style="color:#4ade80;font-size:20px">$${Number(c.montoFinal).toLocaleString('es-AR')}</span></div>
                    <div class="row"><span class="label">Método de Pago</span><span class="value">${c.metodoPago || '—'}</span></div>
                    <div class="row"><span class="label">Estado</span><span class="value"><span class="pill">${c.estado}</span></span></div>
                    <div class="footer">Gol Ahora — ${new Date().toLocaleString('es-AR')}</div>
                </div>
                <script>window.onload = () => window.print();</script>
            </body></html>`);
        win.document.close();
    };

    // ── Recibos ────────────────────────────────────────────────────────────────
    const handleDeleteRecibo = async (id) => {
        if (!window.confirm('¿Eliminar este recibo?')) return;
        const res = await fetch(`${API_URL}/recibos/${id}`, { method: 'DELETE' });
        if (res.ok) { setMessage('Recibo eliminado'); fetchAll(); }
        else setMessage('No se pudo eliminar');
    };

    const handlePrintRecibo = (r) => {
        const win = window.open('', '_blank', 'width=650,height=520');
        win.document.write(`
            <html><head><title>Recibo ${r.numero} - Gol Ahora</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0b130e; color: #fff; padding: 40px; }
                .card { border: 2px solid #28a745; border-radius: 12px; padding: 28px; max-width: 480px; margin: auto; background: #111d13; }
                .header { font-size: 20px; font-weight: bold; border-bottom: 2px solid #28a745; padding-bottom: 12px; margin-bottom: 20px; color: #28a745; text-align: center; }
                .check { font-size: 48px; text-align: center; margin-bottom: 8px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
                .label { color: #8ca092; }
                .value { color: #fff; font-weight: bold; }
                .datos { margin-top: 16px; padding: 14px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; font-size: 13px; color: #d1fae5; }
                .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #6b7280; }
            </style></head>
            <body>
                <div class="card">
                    <div class="check">✅</div>
                    <div class="header">GOL AHORA — RECIBO DE PAGO</div>
                    <div class="row"><span class="label">N° Recibo</span><span class="value">${r.numero}</span></div>
                    <div class="row"><span class="label">Fecha de Emisión</span><span class="value">${new Date(r.fechaEmision).toLocaleString('es-AR', { dateStyle:'medium', timeStyle:'short' })}</span></div>
                    <div class="row"><span class="label">Cobro vinculado</span><span class="value">#${r.cobroId}</span></div>
                    <div class="datos">${r.datos}</div>
                    <div class="footer">Gol Ahora — Comprobante oficial de pago — ${new Date().toLocaleString('es-AR')}</div>
                </div>
                <script>window.onload = () => window.print();</script>
            </body></html>`);
        win.document.close();
    };

    // ── Estadísticas cobros ────────────────────────────────────────────────────
    const totalCobrado  = cobros.filter(c => c.estado === 'Pagado').reduce((s, c) => s + Number(c.montoFinal), 0);
    const totalPendiente = cobros.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + Number(c.montoFinal), 0);

    const estadoPill = (estado) => {
        const map = { Pagado: 'success', Pendiente: 'pending', Rechazado: 'danger' };
        return map[estado] ?? 'neutral';
    };

    return (
        <section className="admin-panel">
            {/* Sub-tabs */}
            <div className="pagos-tabs">
                <button className={tab === 'cobros' ? 'active' : ''} onClick={() => setTab('cobros')}>📋 Cobros</button>
                <button className={tab === 'recibos' ? 'active' : ''} onClick={() => setTab('recibos')}>🧾 Recibos</button>
            </div>

            {/* ── COBROS ── */}
            {tab === 'cobros' && (
                <>
                    {/* Métricas */}
                    <div className="metric-grid" style={{ marginTop: 16 }}>
                        <article>
                            <span>Total cobros</span>
                            <strong>{cobros.length}</strong>
                        </article>
                        <article>
                            <span>Cobrado</span>
                            <strong style={{ color: '#4ade80' }}>{moneyFormatter.format(totalCobrado)}</strong>
                        </article>
                        <article>
                            <span>Pendiente</span>
                            <strong style={{ color: '#f2b84b' }}>{moneyFormatter.format(totalPendiente)}</strong>
                        </article>
                        <article>
                            <span>Recibos emitidos</span>
                            <strong>{recibos.length}</strong>
                        </article>
                    </div>

                    {/* Toolbar */}
                    <div className="section-actions">
                        <button className="primary-action" onClick={() => {
                            setEditingCobro(null);
                            setCobroForm({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' });
                            setShowCobroForm(v => !v);
                        }}>
                            {showCobroForm ? 'Cancelar' : '+ Nuevo cobro'}
                        </button>
                    </div>

                    {/* Formulario */}
                    {showCobroForm && (
                        <form className="admin-form cobro-form" onSubmit={handleSaveCobro}>
                            <input
                                placeholder="Concepto"
                                value={cobroForm.concepto}
                                onChange={e => setCobroForm({ ...cobroForm, concepto: e.target.value })}
                                required
                            />
                            <input
                                type="number" min="0" placeholder="Monto"
                                value={cobroForm.monto}
                                onChange={e => setCobroForm({ ...cobroForm, monto: e.target.value })}
                                required
                            />
                            <input
                                type="number" min="0" placeholder="Descuento"
                                value={cobroForm.descuento}
                                onChange={e => setCobroForm({ ...cobroForm, descuento: e.target.value })}
                            />
                            <select value={cobroForm.estado} onChange={e => setCobroForm({ ...cobroForm, estado: e.target.value })}>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagado">Pagado</option>
                                <option value="Rechazado">Rechazado</option>
                            </select>
                            <input
                                placeholder="Método de pago"
                                value={cobroForm.metodoPago}
                                onChange={e => setCobroForm({ ...cobroForm, metodoPago: e.target.value })}
                            />
                            <button type="submit" className="primary-action">
                                {editingCobro ? 'Actualizar' : 'Guardar cobro'}
                            </button>
                        </form>
                    )}

                    {/* Tabla */}
                    {loading ? <div className="empty-state">Cargando cobros...</div> : (
                        cobros.length === 0
                            ? <div className="empty-state">No hay cobros registrados.</div>
                            : (
                                <div className="data-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Fecha</th>
                                                <th>Concepto</th>
                                                <th>Monto</th>
                                                <th>Descuento</th>
                                                <th>Total</th>
                                                <th>Método</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cobros.map(c => (
                                                <tr key={c.id}>
                                                    <td>#{c.id}</td>
                                                    <td>{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                                                    <td>{c.concepto}</td>
                                                    <td>{moneyFormatter.format(c.monto)}</td>
                                                    <td style={{ color: '#f2b84b' }}>{c.descuento > 0 ? `-${moneyFormatter.format(c.descuento)}` : '—'}</td>
                                                    <td style={{ color: '#4ade80', fontWeight: 700 }}>{moneyFormatter.format(c.montoFinal)}</td>
                                                    <td>{c.metodoPago || '—'}</td>
                                                    <td>
                                                        <span className={`pill ${estadoPill(c.estado)}`}>{c.estado}</span>
                                                    </td>
                                                    <td className="table-actions">
                                                        {c.estado === 'Pendiente' && (
                                                            <button onClick={() => handlePagarCobro(c)}>💳 Pagar</button>
                                                        )}
                                                        <button onClick={() => handleEditCobro(c)}>Editar</button>
                                                        <button onClick={() => handlePrintCobro(c)}>🖨️ Imprimir</button>
                                                        <button className="danger" onClick={() => handleDeleteCobro(c.id)}>Borrar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                    )}
                </>
            )}

            {/* ── RECIBOS ── */}
            {tab === 'recibos' && (
                <>
                    {loading ? <div className="empty-state">Cargando recibos...</div> : (
                        recibos.length === 0
                            ? <div className="empty-state">No hay recibos emitidos.</div>
                            : (
                                <div className="data-table" style={{ marginTop: 16 }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>N° Recibo</th>
                                                <th>Cobro</th>
                                                <th>Fecha Emisión</th>
                                                <th>Datos</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recibos.map(r => (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: 700, color: '#4ade80' }}>{r.numero}</td>
                                                    <td>#{r.cobroId}</td>
                                                    <td>{new Date(r.fechaEmision).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.datos}</td>
                                                    <td className="table-actions">
                                                        <button onClick={() => handlePrintRecibo(r)}>🖨️ Imprimir</button>
                                                        <button className="danger" onClick={() => handleDeleteRecibo(r.id)}>Borrar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                    )}
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
        try {
            const res = await fetch(`${API_URL}/torneos/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTorneoDetails(data);
                setSelectedTorneoId(id);
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

    const handleCancelLiga = async (id) => {
        if (!window.confirm('¿Seguro que desea cancelar esta liga?')) return;
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
    };

    const handleInscribirEquipoLiga = async () => {
        if (!inscribirEquipoId) return;
        try {
            const res = await fetch(`${API_URL}/ligas/${selectedLigaId}/equipos/${inscribirEquipoId}`, {
                method: 'POST'
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

    const handleCancelTorneo = async (id) => {
        if (!window.confirm('¿Seguro que desea cancelar este torneo?')) return;
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
    };

    const handleInscribirEquipoTorneo = async () => {
        if (!inscribirEquipoId) return;
        try {
            const res = await fetch(`${API_URL}/torneos/${selectedTorneoId}/equipos/${inscribirEquipoId}`, {
                method: 'POST'
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
            : `${API_URL}/torneos/partidos/${partidoId}/resultado`;
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
                                    <option value="TodosContraTodos">Todos contra Todos</option>
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
                                                    <button onClick={() => loadTorneoDetails(t.id)}>🔍 Ver Detalle</button>
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

                    {selectedTorneoId && torneoDetails && (
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
                fetch(`${API_URL}/clases`),
                fetch(`${API_URL}/users`)
            ]);
            if (cr.ok) setClases(await cr.json());
            if (ur.ok) setUsers(await ur.json());
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
            const res = await fetch(`${API_URL}/clases/${id}`);
            if (res.ok) {
                const data = await res.json();
                setClaseDetails(data);
                setSelectedClaseId(id);
            } else {
                setMessage('No se pudieron cargar los detalles de la clase');
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleCreateClase = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/clases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    canchaId: Number(claseForm.canchaId),
                    profesorId: Number(claseForm.profesorId),
                    tipo: claseForm.tipo,
                    fechaHora: new Date(claseForm.fechaHora).toISOString(),
                    capacidadMax: Number(claseForm.capacidadMax)
                })
            });
            if (res.ok) {
                setMessage('Clase programada con éxito');
                setClaseForm({ tipo: '', canchaId: '', profesorId: '', fechaHora: '', capacidadMax: 15 });
                setShowClaseForm(false);
                fetchAll();
            } else {
                const txt = await res.text();
                setMessage('Error al crear clase: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleCancelarClase = async (id) => {
        if (!window.confirm('¿Seguro que desea cancelar esta clase?')) return;
        try {
            const res = await fetch(`${API_URL}/clases/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage('Clase cancelada');
                fetchAll();
                if (selectedClaseId === id) {
                    setSelectedClaseId(null);
                    setClaseDetails(null);
                }
            } else {
                const txt = await res.text();
                setMessage('Error al cancelar: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleToggleAsistencia = async (usuarioId, currentPresent) => {
        try {
            const res = await fetch(`${API_URL}/clases/${selectedClaseId}/asistencias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuarioId: Number(usuarioId),
                    presente: !currentPresent
                })
            });
            if (res.ok) {
                loadClaseDetails(selectedClaseId);
            } else {
                const txt = await res.text();
                setMessage('Error al marcar asistencia: ' + txt);
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleAddAlumno = async () => {
        if (!inscribirAlumnoId) return;
        try {
            const res = await fetch(`${API_URL}/clases/${selectedClaseId}/asistencias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuarioId: Number(inscribirAlumnoId),
                    presente: false
                })
            });
            if (res.ok) {
                setMessage('Alumno inscripto en clase');
                setInscribirAlumnoId('');
                loadClaseDetails(selectedClaseId);
                fetchAll();
            } else {
                const txt = await res.text();
                setMessage('Error al inscribir alumno: ' + txt);
            }
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
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
