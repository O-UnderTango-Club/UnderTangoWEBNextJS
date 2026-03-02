// ==============================
// SUPABASE CONFIG
// ==============================
const SUPABASE_URL = "https://gxfrdztmophpmywcaqjt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G8H99tYuejvs1b_oRkWajg_nkU1qtGD";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ==============================
// ELEMENTOS
// ==============================
const form = document.getElementById("signup-form");
const msg  = document.getElementById("form-msg");

// ==============================
// REGISTRO
// ==============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.textContent = "Creando cuenta...";
  msg.className = "muted";

  const full_name  = document.getElementById("fullname").value.trim();
  const email      = document.getElementById("email").value.trim();
  const phone      = document.getElementById("phone").value.trim();
  // guardamos string (no parseInt). Si querés códigos, envía "80" etc.
  const department = document.getElementById("department").value;
  const password   = document.getElementById("password").value;

  if (!full_name || !email || !password || !department) {
    msg.textContent = "Completá todos los campos obligatorios";
    msg.className = "error";
    return;
  }

  const username = email.split("@")[0].toLowerCase();

  try {
    // ---- 0) debug local antes de todo ----
    console.log("Payload signup:", { full_name, email, username, department, phone });

    // ---- 0.5) chequeo rápido: username único (evita conflict por unique constraint) ----
    const { data: existingUser } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      msg.textContent = "El nombre de usuario derivado del email ya existe. Usá otro username o cambiá el email.";
      msg.className = "error";
      return;
    }

    // ---- 1) Crear usuario en Auth (envío metadata) ----
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          username,
          role: "user",
          department,
          phone
        }
      }
    });

    if (error) {
      console.error("SignUp error:", error);
      msg.textContent = error.message || "Error al crear la cuenta";
      msg.className = "error";
      return;
    }

    // algunos SDK devuelven data.user, otros data (ver si user está aquí)
    const userId = data?.user?.id ?? (await supabaseClient.auth.getUser()).data?.user?.id;
    if (!userId) {
      console.error("No se obtuvo userId tras signup:", data);
      msg.textContent = "Cuenta creada, pero no se obtuvo userId";
      msg.className = "error";
      return;
    }

    // ---- 2) Upsert profile (inserta o actualiza). pedimos .select() para recibir la fila resultante ----
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .upsert({
        id: userId,
        email,
        full_name,
        username,
        phone,
        department
      })
      .select() // importante para obtener la fila
      .single();

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      msg.textContent = "Cuenta creada, pero error al guardar el perfil";
      msg.className = "error";
      return;
    }

    // ---- 3) Confirmación + debug post-upsert ----
    console.log("Profile creado/actualizado:", profileData);

    msg.textContent = "Cuenta creada con éxito 🎉";
    msg.className = "success";

    setTimeout(() => {
      window.location.href = "/login/login.html";
    }, 1500);

  } catch (err) {
    console.error("Error inesperado:", err);
    msg.textContent = "Ocurrió un error inesperado. Mirá la consola.";
    msg.className = "error";
  }
});