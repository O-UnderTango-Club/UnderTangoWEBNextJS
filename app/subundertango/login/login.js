const SUPABASE_URL = "https://gxfrdztmophpmywcaqjt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G8H99tYuejvs1b_oRkWajg_nkU1qtGD";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const form = document.getElementById('login-form');
const email = document.getElementById('email');
const password = document.getElementById('password');
const msg = document.getElementById('msg');
const forgotPassword = document.getElementById('forgot-password');

/* ======================
   LOGIN NORMAL
====================== */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  msg.className = 'msg';

  const btn = form.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value
  });

  if (error) {
    msg.textContent = error.message;
    msg.className = 'msg error';
    btn.disabled = false;
    btn.textContent = 'Ingresar';
    return;
  }

  // ✅ LOGIN OK
  window.location.href = '../perfil_usuario.html';
});

/* ======================
   RECUPERAR CONTRASEÑA
====================== */
forgotPassword.addEventListener('click', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  msg.className = 'msg';

  if (!email.value) {
    msg.textContent = 'Ingresá tu email para recuperar la contraseña.';
    msg.className = 'msg error';
    return;
  }

  msg.textContent = 'Enviando email de recuperación...';

  const { error } = await supabaseClient.auth.resetPasswordForEmail(
    email.value.trim(),
    {
      redirectTo: 'https://sprightly-griffin-33f04f.netlify.app/login/recuperar_contrasena.html'
    }
  );

  if (error) {
    msg.textContent = error.message;
    msg.className = 'msg error';
  } else {
    msg.textContent =
      'Te enviamos un email para que puedas restablecer tu contraseña.';
  }
});
