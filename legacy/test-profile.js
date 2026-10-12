const SUPABASE_URL = 'https://davxzhiyegkufjgoxluv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdnh6aGl5ZWdrdWZqZ294bHV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTE2NTUsImV4cCI6MjA5MTM4NzY1NX0.axaEpn0yF06VIw8q1ErfK0DobAXAjybWzM-9P8XrCcQ';

async function checkProfile() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.test_random_1776412308495@gmail.com`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const text = await res.text();
        console.log("Profile for test user:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}
checkProfile();
