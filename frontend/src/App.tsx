import { useEffect, useState } from "react";
import { BASE_URL, apiFetch } from "./api/client";
import { AuthForm } from "./components/AuthForm";
import { HomePage } from "./pages/HomePage";
import "./styles.css";

type LoginResponse = { token: string; user: { name: string; role: string } };

function toReadableError(error: unknown): string {
  if (!(error instanceof Error)) return "Unbekannter Fehler";

  try {
    const parsed = JSON.parse(error.message) as { message?: string };
    if (parsed?.message) return parsed.message;
  } catch {
    // no-op
  }

  if (error.message.includes("Failed to fetch")) {
    return "Backend nicht erreichbar. Bitte prüfe, ob docker compose läuft.";
  }

  return error.message;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("wiki_token");
    if (saved) setToken(saved);
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.token);
      localStorage.setItem("wiki_token", data.token);
      setMessage(`Angemeldet als ${data.user.name} (${data.user.role})`);
    } catch (e) {
      setError(toReadableError(e));
      setMessage("Tipp: Seed laden mit `docker compose exec backend npm run prisma:seed`.");
    } finally {
      setLoading(false);
    }
  }

  async function register(email: string, password: string, name?: string) {
    setLoading(true);
    setError("");

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name })
      });
      setMessage("Registrierung erfolgreich. Bitte einloggen.");
    } catch (e) {
      setError(toReadableError(e));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("wiki_token");
    setToken(null);
    setMessage("Erfolgreich ausgeloggt.");
  }

  return (
    <main className="app-shell">
      <h1>Confluence-like Wiki</h1>
      {message && <p className="banner info">{message}</p>}
      {error && <p className="banner error">{error}</p>}
      {!token && <p style={{ fontSize: 12, opacity: 0.8 }}>API Endpoint: {BASE_URL}</p>}

      {!token ? (
        <section className="auth-grid">
          <article className="card">
            <h2>Login</h2>
            <AuthForm mode="login" onSubmit={login} loading={loading} />
          </article>
          <article className="card">
            <h2>Registrierung</h2>
            <AuthForm mode="register" onSubmit={register} loading={loading} />
          </article>
        </section>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button onClick={logout}>Logout</button>
          </div>
          <HomePage token={token} />
        </>
      )}
    </main>
  );
}
