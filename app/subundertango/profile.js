const SUPABASE_URL = "https://gxfrdztmophpmywcaqjt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G8H99tYuejvs1b_oRkWajg_nkU1qtGD";

/* ===============================
   URL PARAMS
================================ */
const params = new URLSearchParams(window.location.search);
const usernameFromUrl = params.get("u");

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===============================
   ELEMENTOS PERFIL
================================ */
const fullNameEl = document.getElementById('fullName');
const deptEl = document.getElementById('department');
const emailEl = document.getElementById('email');
const avatarEl = document.getElementById('avatar');

/* ===============================
   ENCUESTA
================================ */
const interestSelect = document.getElementById("interest");
const roleSelect = document.getElementById("role");
const saveSurveyBtn = document.getElementById("saveSurvey");

/* ===============================
   CALENDARIO UI
================================ */
const eventsListEl = document.getElementById("eventsList");
const newEventBtn = document.getElementById("newEventBtn");

/* ===============================
   MODAL EVENTO
================================ */
const eventModal = document.getElementById("eventModal");
const closeEventModalBtn = document.getElementById("closeEventModal");
const cancelEventBtn = document.getElementById("cancelEvent");
const saveEventBtn = document.getElementById("saveEvent");

const eventTitleInput = document.getElementById("eventTitle");
const eventDescriptionInput = document.getElementById("eventDescription");
const eventDateInput = document.getElementById("eventDate");
const eventTimeInput = document.getElementById("eventTime");

/* ===============================
   MAPEO DEPARTAMENTOS
================================ */
const deptMap = {
  80: 'Programación',
  81: 'Shows',
  28: 'Clases',
  83: 'E-shop Moda',
  84: 'Redes Sociales',
  85: 'Obra de Teatro',
  86: 'Música / Podcast',
  87: 'FDI (Finanzas)',
  88: 'Red Social',
  89: 'Equipo Central'
};

/* ===============================
   ESTADO GLOBAL
================================ */
let currentUser = null;
let myCalendar = null;
let myEvents = [];

/* ===============================
   PERFIL
================================ */
async function loadMyProfile() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = user;

  // 1️⃣ Intentar cargar perfil
  let { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('full_name, department, interest, role')
    .eq('id', user.id)
    .maybeSingle(); // ⬅️ CLAVE

  if (!profile) {
    const { data: newProfile, error: insertError } = await supabaseClient
      .from('profiles')
      .insert([{
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Sin nombre',
        email: user.email,
        department: null,
        interest: null,
        role: null
      }])
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Error creando perfil', insertError);
      return;
    }

    profile = newProfile;
  }

  fullNameEl.textContent = profile.full_name;
  emailEl.textContent = user.email;
  deptEl.textContent = deptMap[profile.department] || 'Sin departamento';

  avatarEl.textContent = profile.full_name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (profile.interest) interestSelect.value = profile.interest;
  if (profile.role) roleSelect.value = profile.role;

  await loadOrCreateCalendar();
  await loadMyEvents();
}

async function loadPublicProfile(rawUsername) {
  try {
    const username = String(rawUsername || "").trim();
    console.log("loadPublicProfile -> username from URL:", JSON.stringify(username));

    if (!username) {
      fullNameEl.textContent = "Usuario no especificado";
      deptEl.textContent = "";
      emailEl.textContent = "";
      return;
    }

    // uso de maybeSingle() para evitar errores si no hay fila
    const { data: profile, error, status } = await supabaseClient
      .from("profiles")
      .select("full_name, email, department, interest, role")
      .eq("username", username)
      .maybeSingle();

    console.log("Supabase response loadPublicProfile:", { profile, error, status });

    if (error) {
      // logueamos y mostramos mensaje genérico
      console.error("Error en loadPublicProfile:", error);
      fullNameEl.textContent = "Error cargando perfil";
      deptEl.textContent = "";
      emailEl.textContent = "";
      return;
    }

    if (!profile) {
      fullNameEl.textContent = "Usuario no encontrado";
      deptEl.textContent = "";
      emailEl.textContent = "";
      return;
    }

    renderProfile(profile);
    disableEditing();
  } catch (err) {
    console.error("Excepción loadPublicProfile:", err);
    fullNameEl.textContent = "Error inesperado";
    deptEl.textContent = "";
    emailEl.textContent = "";
  }
}

if (usernameFromUrl) {
  loadPublicProfile(usernameFromUrl);
} else {
  loadMyProfile();
}

function renderProfile(profile) {
  fullNameEl.textContent = profile.full_name;
  emailEl.textContent = profile.email || "";
  deptEl.textContent = deptMap[profile.department] || "Sin departamento";

  avatarEl.textContent = profile.full_name
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (profile.interest) interestSelect.value = profile.interest;
  if (profile.role) roleSelect.value = profile.role;
}

function disableEditing() {
  document.querySelector(".survey")?.remove();
  document.querySelector(".calendar")?.remove();
  document.querySelector(".fab-calendario")?.remove();
}

/* ===============================
   CALENDARIO
================================ */
async function loadOrCreateCalendar() {
  const { data } = await supabaseClient
    .from('calendars')
    .select('*')
    .eq('owner', currentUser.id)
    .limit(1)
    .single();

  if (data) {
    myCalendar = data;
    return;
  }

  const { data: newCalendar, error } = await supabaseClient
    .from('calendars')
    .insert([{
      owner: currentUser.id,
      title: 'Mi calendario',
      description: 'Calendario personal',
      public: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }])
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  myCalendar = newCalendar;
}

async function loadMyEvents() {
  if (!myCalendar) return;

  const { data, error } = await supabaseClient
    .from('events')
    .select('*')
    .eq('calendar_id', myCalendar.id)
    .order('start_time', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  myEvents = data;
  renderEvents();
}

function renderEvents() {
  eventsListEl.innerHTML = '';

  if (!myEvents.length) {
    eventsListEl.innerHTML = `<p class="empty">No tenés eventos todavía</p>`;
    return;
  }

  myEvents.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";

    const date = new Date(ev.start_time).toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    card.innerHTML = `
      <div class="event-title">${ev.title}</div>
      <div class="event-date">${date}</div>
    `;

    eventsListEl.appendChild(card);
  });
}

/* ===============================
   MODAL UX
================================ */
function openModal() {
  eventModal.classList.add("open");
}

function closeModal() {
  eventModal.classList.remove("open");
  eventTitleInput.value = '';
  eventDescriptionInput.value = '';
  eventDateInput.value = '';
  eventTimeInput.value = '';
}

newEventBtn.addEventListener("click", openModal);
closeEventModalBtn.addEventListener("click", closeModal);
cancelEventBtn.addEventListener("click", closeModal);

eventModal.addEventListener("click", (e) => {
  if (e.target === eventModal) closeModal();
});

/* ===============================
   CREAR EVENTO
================================ */
saveEventBtn.addEventListener("click", async () => {
  const title = eventTitleInput.value.trim();
  const date = eventDateInput.value;
  const time = eventTimeInput.value || "00:00";

  if (!title || !date) {
    alert("Completá título y fecha");
    return;
  }

  const start = new Date(`${date}T${time}`);

  saveEventBtn.disabled = true;
  saveEventBtn.textContent = "Guardando…";

  const { error } = await supabaseClient
    .from("events")
    .insert([{
      calendar_id: myCalendar.id,
      owner: currentUser.id,
      title,
      description: eventDescriptionInput.value,
      start_time: start.toISOString(),
      end_time: start.toISOString(),
      all_day: false
    }]);

  if (error) {
    console.error(error);
    alert("Error creando evento");
  } else {
    await loadMyEvents();
    closeModal();
  }

  saveEventBtn.disabled = false;
  saveEventBtn.textContent = "Crear";
});

/* ===============================
   GUARDAR ENCUESTA
================================ */
saveSurveyBtn.addEventListener("click", async () => {
  const interest = interestSelect.value;
  const role = roleSelect.value;

  if (!interest || !role) {
    alert("Completá todas las opciones");
    return;
  }

  saveSurveyBtn.disabled = true;
  saveSurveyBtn.textContent = "Guardando…";

  const { error } = await supabaseClient
    .from("profiles")
    .update({ interest, role })
    .eq("id", currentUser.id);

  if (error) {
    console.error(error);
    alert("Error guardando preferencias");
  } else {
    alert("Preferencias guardadas");
  }

  saveSurveyBtn.disabled = false;
  saveSurveyBtn.textContent = "Guardar preferencias";
});