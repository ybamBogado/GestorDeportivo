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

    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        id: 0,
        nombre: '',
        apellido: '',
        dni: 0,
        email: '',
        rol: 'Usuario',
        legajo: 0
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
            legajo: selectedUser.legajo || 0
        });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();

        const response = await fetch(`${API_URL}/users/${userFormData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userFormData)
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

    const handlePrintUser = (selectedUser) => {
        const printWindow = window.open('', '_blank', 'width=600,height=450');
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
                    <div class="field"><span class="label">Email:</span><span class="value">${selectedUser.email}</span></div>
                    <div class="field"><span class="label">Rol asignado:</span><span class="value">${selectedUser.rol}</span></div>
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
                        {editingUser && (
                            <form className="admin-form user-form" onSubmit={handleUpdateUser}>
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
                                <button type="button" className="ghost-button" onClick={() => setEditingUser(null)}>Cancelar</button>
                                <button type="submit" className="primary-action">Guardar cambios</button>
                            </form>
                        )}

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>DNI</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(selectedUser => (
                                        <tr key={selectedUser.id}>
                                            <td>#{selectedUser.id}</td>
                                            <td>{selectedUser.nombre} {selectedUser.apellido}</td>
                                            <td>{selectedUser.dni}</td>
                                            <td>{selectedUser.email}</td>
                                            <td><span className="pill neutral">{selectedUser.rol}</span></td>
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
                    </section>
                )}

                {(activeSection === 'pagos' || activeSection === 'reportes') && (
                    <section className="admin-panel placeholder-panel">
                        <h2>{activeSection === 'pagos' ? 'Pagos y recibos' : 'Reportes'}</h2>
                        <p>La estructura del panel ya está preparada para sumar este módulo cuando se definan sus datos.</p>
                    </section>
                )}
            </section>
        </main>
    );
}
