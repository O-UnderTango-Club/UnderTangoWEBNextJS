export function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 6) score++;        // Largo mínimo
  if (password.length >= 10) score++;       // Largo recomendado
  if (/[A-Z]/.test(password)) score++;      // Mayúsculas
  if (/[0-9]/.test(password)) score++;      // Números
  if (/[^A-Za-z0-9]/.test(password)) score++; // Símbolos

  return score; // de 0 a 5
}

export function getStrengthLabel(score: number) {
  switch (score) {
    case 0:
    case 1:
      return "Muy débil";
    case 2:
      return "Débil";
    case 3:
      return "Regular";
    case 4:
      return "Fuerte";
    case 5:
      return "Muy fuerte";
    default:
      return "";
  }
}

export function getStrengthColor(score: number) {
  switch (score) {
    case 0:
    case 1:
      return "#e74c3c"; // rojo
    case 2:
      return "#e67e22"; // naranja
    case 3:
      return "#f1c40f"; // amarillo
    case 4:
      return "#2ecc71"; // verde
    case 5:
      return "#27ae60"; // verde oscuro
    default:
      return "#ccc";
  }
}
