const SUPABASE_URL = 'https://davxzhiyegkufjgoxluv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdnh6aGl5ZWdrdWZqZ294bHV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTE2NTUsImV4cCI6MjA5MTM4NzY1NX0.axaEpn0yF06VIw8q1ErfK0DobAXAjybWzM-9P8XrCcQ';

async function test() {
    try {
        console.log("Fetching /rest/v1/profiles...");
        const start = Date.now();
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        console.log(`Status: ${res.status} (${Date.now() - start}ms)`);
        const text = await res.text();
        console.log("Body:", text);
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

test();
