const SUPABASE_URL = 'https://davxzhiyegkufjgoxluv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdnh6aGl5ZWdrdWZqZ294bHV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTE2NTUsImV4cCI6MjA5MTM4NzY1NX0.axaEpn0yF06VIw8q1ErfK0DobAXAjybWzM-9P8XrCcQ';

async function testSignup() {
    try {
        console.log("Testing signup...");
        const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'thu123@gmail.com',
                password: 'password123',
                data: {
                    full_name: 'Nguyễn Thị Minh Thư',
                    student_id: 'DH24QL01'
                }
            })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}
testSignup();
