import { FormEvent, useState } from "react";

type Props = {
  mode: "login" | "register";
  onSubmit: (email: string, password: string, name?: string) => Promise<void>;
  loading?: boolean;
};

export function AuthForm({ mode, onSubmit, loading = false }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(email, password, mode === "register" ? name : undefined);
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {mode === "register" && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          disabled={loading}
        />
      )}
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-Mail"
        type="email"
        required
        disabled={loading}
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Passwort"
        type="password"
        minLength={8}
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Bitte warten..." : mode === "login" ? "Login" : "Registrieren"}
      </button>
    </form>
  );
}
