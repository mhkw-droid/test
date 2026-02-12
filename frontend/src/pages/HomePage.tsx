import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";

type Dashboard = {
  recentPages: { id: string; title: string; updatedAt: string }[];
  myPagesCount: number;
  myCommentsCount: number;
  unreadNotifications: { id: string; message: string }[];
};

type WikiPage = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  parentId?: string | null;
};

export function HomePage({ token }: { token: string }) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [space, setSpace] = useState("engineering");

  const load = async () => {
    const [p, d] = await Promise.all([
      apiFetch<WikiPage[]>("/pages", {}, token),
      apiFetch<Dashboard>("/dashboard", {}, token)
    ]);
    setPages(p);
    setDashboard(d);
    if (!selectedPageId && p.length > 0) {
      setSelectedPageId(p[0].id);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function createPage(e: FormEvent) {
    e.preventDefault();
    await apiFetch(
      "/pages",
      {
        method: "POST",
        body: JSON.stringify({ title, content, tagNames: ["wiki"], parentId: selectedPageId ?? undefined })
      },
      token
    );
    setTitle("");
    setContent("");
    await load();
  }

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((page) => page.title.toLowerCase().includes(q) || page.content.toLowerCase().includes(q));
  }, [pages, search]);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? filteredPages[0] ?? null,
    [pages, filteredPages, selectedPageId]
  );

  const rootPages = useMemo(() => filteredPages.filter((page) => !page.parentId), [filteredPages]);

  function childPages(parentId: string) {
    return filteredPages.filter((page) => page.parentId === parentId);
  }

  return (
    <div className="wiki-layout">
      <header className="wiki-topbar">
        <div className="wiki-top-left">
          <strong>Confluence-like Wiki</strong>
          <select value={space} onChange={(e) => setSpace(e.target.value)}>
            <option value="engineering">Engineering</option>
            <option value="product">Product</option>
            <option value="ops">Operations</option>
          </select>
        </div>
        <input
          className="wiki-search"
          placeholder="Suche Seiten, Inhalte, Titel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <aside className="wiki-sidebar">
        <h3>Seitenbaum</h3>
        <ul>
          {rootPages.map((root) => (
            <li key={root.id}>
              <button
                className={selectedPage?.id === root.id ? "tree-btn active" : "tree-btn"}
                onClick={() => setSelectedPageId(root.id)}
              >
                {root.title}
              </button>
              {childPages(root.id).length > 0 && (
                <ul>
                  {childPages(root.id).map((child) => (
                    <li key={child.id}>
                      <button
                        className={selectedPage?.id === child.id ? "tree-btn active" : "tree-btn"}
                        onClick={() => setSelectedPageId(child.id)}
                      >
                        {child.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <div className="sidebar-stats">
          <h4>Übersicht</h4>
          <p>Meine Seiten: {dashboard?.myPagesCount ?? 0}</p>
          <p>Meine Kommentare: {dashboard?.myCommentsCount ?? 0}</p>
          <p>Benachrichtigungen: {dashboard?.unreadNotifications.length ?? 0}</p>
        </div>
      </aside>

      <section className="wiki-content">
        {selectedPage ? (
          <article className="content-card">
            <h2>{selectedPage.title}</h2>
            <small>Zuletzt geändert: {new Date(selectedPage.updatedAt).toLocaleString()}</small>
            <pre>{selectedPage.content}</pre>
          </article>
        ) : (
          <article className="content-card">
            <h2>Keine Seite ausgewählt</h2>
            <p>Erstelle eine neue Seite oder wähle einen Eintrag im Seitenbaum.</p>
          </article>
        )}

        <article className="content-card">
          <h3>Neue Seite erstellen</h3>
          <form onSubmit={createPage} className="create-form">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Seitentitel" required />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Inhalt (Markdown/Wiki-Text)"
              required
            />
            <button type="submit">Seite anlegen</button>
          </form>
        </article>
      </section>
    </div>
  );
}
