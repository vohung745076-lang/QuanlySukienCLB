/* ============================================================
   state.js — Global State (In-memory cache)
   Không còn localStorage — data lấy từ Supabase
   ============================================================ */

let currentUser  = null; // { id, name, role, studentId, email }
let events       = [];
let userTickets  = [];
let checkinLogs  = [];
let users        = [];
