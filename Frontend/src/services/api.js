const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5071/api/v1';

function getAuthHeaders() {
    const user = localStorage.getItem('ticket_user');
    if (!user) return { 'Content-Type': 'application/json' };
    try {
        const { token } = JSON.parse(user);
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
    } catch {
        return { 'Content-Type': 'application/json' };
    }
}

async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { ...getAuthHeaders(), ...(options.headers || {}) };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Error ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
    login:    (email, password)  => request('/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
    google:   (idToken)          => request('/auth/google',   { method: 'POST', body: JSON.stringify({ idToken }) }),
    register: (data)             => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Canchas ───────────────────────────────────────────────────────────────────
export const canchas = {
    getAll:  ()     => request('/canchas'),
    getById: (id)   => request(`/canchas/${id}`),
    create:  (data) => request('/canchas', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Reservas ─────────────────────────────────────────────────────────────────
export const reservas = {
    getAll:  (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/reservas${qs ? `?${qs}` : ''}`);
    },
    create:       (data)        => request('/reservas',             { method: 'POST', body: JSON.stringify(data) }),
    updateEstado: (id, estado)  => request(`/reservas/${id}/estado`, { method: 'PUT',  body: JSON.stringify({ id, estado }) }),
    updateMetodoPago: (id, metodoPago, comprobantePdf) => request(`/reservas/${id}/metodo-pago`, { method: 'PUT', body: JSON.stringify({ metodoPago, comprobantePdf }) }),
    cancelar:     (id)          => request(`/reservas/${id}/cancelar`, { method: 'POST' }),
};

// ─── Cobros ────────────────────────────────────────────────────────────────────
export const cobros = {
    getAll:   ()      => request('/cobros'),
    getById:  (id)    => request(`/cobros/${id}`),
    create:   (data)  => request('/cobros',         { method: 'POST',   body: JSON.stringify(data) }),
    update:   (id, d) => request(`/cobros/${id}`,   { method: 'PUT',    body: JSON.stringify(d) }),
    remove:   (id)    => request(`/cobros/${id}`,   { method: 'DELETE' }),
    pagar:    (id, d) => request(`/cobros/${id}/pagar`, { method: 'POST', body: JSON.stringify(d) }),
};

// ─── Recibos ───────────────────────────────────────────────────────────────────
export const recibos = {
    getAll: ()   => request('/recibos'),
    remove: (id) => request(`/recibos/${id}`, { method: 'DELETE' }),
};

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export const users = {
    getAll:  ()       => request('/users'),
    update:  (id, d)  => request(`/users/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
    remove:  (id)     => request(`/users/${id}`, { method: 'DELETE' }),
};

// ─── Clases ───────────────────────────────────────────────────────────────────
export const clases = {
    getAll:            ()       => request('/clases'),
    getById:           (id)     => request(`/clases/${id}`),
    create:            (data)   => request('/clases', { method: 'POST', body: JSON.stringify(data) }),
    remove:            (id)     => request(`/clases/${id}`, { method: 'DELETE' }),
    toggleAsistencia:  (claseId, usuarioId, presente) => request(`/clases/${claseId}/asistencias`, { method: 'POST', body: JSON.stringify({ usuarioId, presente }) }),
};
