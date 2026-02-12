import { useState } from "react";
import { apiFetch } from "./api/client";
import { AuthForm } from "./components/AuthForm";
import { HomePage } from "./pages/HomePage";

type LoginResponse = { token: string; user: { name: string; role: string } };

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function login(email: string, password: string) {
    const data = await apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setToken(data.token);
    setMessage(`Angemeldet als ${data.user.name} (${data.user.role})`);
  }

  async function register(email: string, password: string, name?: string) {
    await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) });
    setMessage("Registrierung erfolgreich. Bitte einloggen.");
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Confluence-like Wiki</h1>
      {message && <p>{message}</p>}
      {!token ? (
        <>
          <h2>Login</h2>
          <AuthForm mode="login" onSubmit={login} />
          <h2>Registrierung</h2>
          <AuthForm mode="register" onSubmit={register} />
        </>
      ) : (
        <HomePage token={token} />
      )}
    </main>
  );
}
