import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (email: string, password: string, name?: string) => Promise<void>;
  mode: "login" | "register";
};

export function AuthForm({ onSubmit, mode }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(email, password, mode === "register" ? name : undefined);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
      {mode === "register" && (
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      )}
      <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        minLength={8}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">{mode === "login" ? "Anmelden" : "Registrieren"}</button>
    </form>
  );
}
