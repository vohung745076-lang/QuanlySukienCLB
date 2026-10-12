const SUPABASE_URL = 'https://davxzhiyegkufjgoxluv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdnh6aGl5ZWdrdWZqZ294bHV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTE2NTUsImV4cCI6MjA5MTM4NzY1NX0.axaEpn0yF06VIw8q1ErfK0DobAXAjybWzM-9P8XrCcQ';

async function testAuth() {
    try {
        console.log("Testing auth...");
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: 'vohung745076@gmail.com', password: 'password123' })
        });
        console.log(res.status);
        const text = await res.text();
        console.log(text);
    } catch (e) {
        console.log(e);
    }
}
testAuth();
