export function validateEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return "El correo no es válido.";
  }
  return null;
}

// Contraseña segura: min 8, mayúscula, minúscula, número, símbolo
export function validatePassword(password: string) {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Debe contener al menos una letra mayúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "Debe contener al menos una letra minúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "Debe contener al menos un número.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Debe contener al menos un símbolo.";
  }
  return null;
}

export function validatePasswordMatch(password: string, confirmPassword: string) {
  if (password !== confirmPassword) {
    return "Las contraseñas no coinciden.";
  }
  return null;
}
