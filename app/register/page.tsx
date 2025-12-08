import RegisterForm from "../components/registerForm";
import Header from "../components/header";

import "../styles/login.css";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <div className="register-page-container">
        <div className="register-wrapper">
          <h2>Registrarse</h2>
          <RegisterForm />
        </div>
      </div>
    </>
  );
}
