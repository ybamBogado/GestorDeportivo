async function test() {
    try {
        const res = await fetch('http://localhost:5071/api/v1/cobros/2');
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
