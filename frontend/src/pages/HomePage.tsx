import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { PageList, type Page } from "../components/PageList";

type Dashboard = {
  recentPages: { id: string; title: string; updatedAt: string }[];
  myPagesCount: number;
  myCommentsCount: number;
  unreadNotifications: { id: string; message: string }[];
};

export function HomePage({ token }: { token: string }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const load = async () => {
    const [p, d] = await Promise.all([apiFetch<Page[]>("/pages", {}, token), apiFetch<Dashboard>("/dashboard", {}, token)]);
    setPages(p);
    setDashboard(d);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function createPage(e: FormEvent) {
    e.preventDefault();
    await apiFetch("/pages", { method: "POST", body: JSON.stringify({ title, content, tagNames: ["demo"] }) }, token);
    setTitle("");
    setContent("");
    await load();
  }

  return (
    <div>
      <h2>Dashboard</h2>
      {dashboard && (
        <div>
          <p>Meine Seiten: {dashboard.myPagesCount}</p>
          <p>Meine Kommentare: {dashboard.myCommentsCount}</p>
          <p>Ungelesene Benachrichtigungen: {dashboard.unreadNotifications.length}</p>
        </div>
      )}
      <h2>Seiten</h2>
      <form onSubmit={createPage} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" required />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Inhalt" required />
        <button type="submit">Seite erstellen</button>
      </form>
      <PageList pages={pages} />
    </div>
  );
}
