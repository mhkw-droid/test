import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { PageList, type Page } from "../components/PageList";

type DashboardData = {
  recentPages: { id: string; title: string; updatedAt: string }[];
  myPagesCount: number;
  openComments: number;
  unreadNotifications: { id: string; message: string; createdAt: string }[];
};

type Props = { token: string };

export function HomePage({ token }: Props) {
  const [pages, setPages] = useState<Page[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");

  async function loadPages(query?: string) {
    if (query && query.trim()) {
      const data = await apiFetch<{ pages: Page[] }>(`/search?q=${encodeURIComponent(query)}`, {}, token);
      setPages(data.pages);
      return;
    }
    const data = await apiFetch<Page[]>("/pages", {}, token);
    setPages(data);
  }

  async function loadDashboard() {
    const data = await apiFetch<DashboardData>("/dashboard", {}, token);
    setDashboard(data);
  }

  useEffect(() => {
    loadPages().catch(console.error);
    loadDashboard().catch(console.error);
  }, []);

  async function createPage(event: FormEvent) {
    event.preventDefault();
    await apiFetch(
      "/pages",
      {
        method: "POST",
        body: JSON.stringify({ title, content, tagNames: ["demo"] })
      },
      token
    );
    setTitle("");
    setContent("");
    await Promise.all([loadPages(), loadDashboard()]);
  }

  async function submitSearch(event: FormEvent) {
    event.preventDefault();
    await loadPages(search);
  }

  return (
    <div>
      <h2>Dashboard</h2>
      {dashboard && (
        <section style={{ marginBottom: 16, padding: 12, border: "1px solid #ddd" }}>
          <p>Meine Seiten: {dashboard.myPagesCount}</p>
          <p>Meine Kommentare: {dashboard.openComments}</p>
          <p>Ungelesene Benachrichtigungen: {dashboard.unreadNotifications.length}</p>
          <ul>
            {dashboard.unreadNotifications.map((notification) => (
              <li key={notification.id}>{notification.message}</li>
            ))}
          </ul>
        </section>
      )}

      <h2>Seiten</h2>
      <form onSubmit={submitSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input placeholder="Suche" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit">Suchen</button>
        <button type="button" onClick={() => loadPages().catch(console.error)}>
          Zurücksetzen
        </button>
      </form>

      <form onSubmit={createPage} style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        <input placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Inhalt (Markdown)" value={content} onChange={(e) => setContent(e.target.value)} required />
        <button type="submit">Seite erstellen</button>
      </form>
      <PageList pages={pages} />
    </div>
  );
}
