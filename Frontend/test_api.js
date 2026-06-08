async function test() {
    try {
        const res = await fetch('http://localhost:5071/api/v1/reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                canchaId: 1,
                personaId: 1,
                fecha: '2026-06-08',
                horaInicio: '10:00',
                horaFin: '11:00',
                precio: 4500,
                pago: false,
                metodoPago: 'tarjeta'
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
