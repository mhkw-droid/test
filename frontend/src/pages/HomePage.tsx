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

const SPACE_OPTIONS = [
  "Team Space",
  "Knowledge Base",
  "Projekt Space",
  "Dokumentations Space",
  "Persönlicher Space"
];

export function HomePage({ token }: { token: string }) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [space, setSpace] = useState(SPACE_OPTIONS[0]);

  const load = async () => {
    const [p, d] = await Promise.all([
      apiFetch<WikiPage[]>("/pages", {}, token),
      apiFetch<Dashboard>("/dashboard", {}, token)
    ]);
    setPages(p);
    setDashboard(d);
    if (!selectedPageId && p.length > 0) setSelectedPageId(p[0].id);
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
        body: JSON.stringify({
          title,
          content,
          tagNames: ["knowledge", "team"],
          parentId: selectedPageId ?? undefined
        })
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
  const childPages = (parentId: string) => filteredPages.filter((page) => page.parentId === parentId);

  return (
    <div className="hwiki-shell">
      <header className="hwiki-topnav">
        <div className="hwiki-topnav-left">
          <div className="brand-pill">❄️ Hokkaido Wiki</div>
          <button className="ghost">Recent</button>
          <button className="ghost">Starred</button>
          <button className="ghost">People</button>
          <button className="ghost">Apps</button>
        </div>

        <div className="hwiki-topnav-center">
          <select value={space} onChange={(e) => setSpace(e.target.value)}>
            {SPACE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            className="global-search"
            placeholder="Globale Suche (Seiten, Blogs, Anhänge...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="hwiki-topnav-right">
          <button>Create</button>
          <button className="ghost">Admin</button>
          <div className="avatar">HK</div>
        </div>
      </header>

      <aside className="hwiki-sidebar">
        <h3>{space}</h3>
        <nav className="space-links">
          <button className="ghost">Space Overview</button>
          <button className="ghost">Blog Posts</button>
          <button className="ghost">Shortcuts</button>
          <button className="ghost">Space Tools</button>
          <button className="ghost">Space Settings</button>
        </nav>

        <h4>Page Tree</h4>
        <ul className="tree-list">
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
      </aside>

      <main className="hwiki-main">
        <section className="page-header card">
          <div>
            <small className="muted">{space} / Home / {selectedPage?.title ?? "No page selected"}</small>
            <h2>{selectedPage?.title ?? "Willkommen"}</h2>
          </div>
          <div className="page-actions">
            <button>Edit</button>
            <button className="ghost">Share</button>
            <button className="ghost">…</button>
          </div>
        </section>

        <section className="card content-view">
          {selectedPage ? (
            <>
              <small className="muted">Updated: {new Date(selectedPage.updatedAt).toLocaleString()}</small>
              <pre>{selectedPage.content}</pre>
            </>
          ) : (
            <p>Wähle eine Seite aus dem Baum oder erstelle eine neue Seite.</p>
          )}

          <div className="page-meta">
            <span>Labels: knowledge, team</span>
            <span>Likes: 12</span>
            <span>Watching: on</span>
            <span>Version: 1</span>
          </div>
        </section>

        <section className="card grid-two">
          <article>
            <h3>Dashboard</h3>
            <p>Recent Pages: {dashboard?.recentPages.length ?? 0}</p>
            <p>Assigned to me: 2 Tasks</p>
            <p>Unread Notifications: {dashboard?.unreadNotifications.length ?? 0}</p>
            <p>My Comments: {dashboard?.myCommentsCount ?? 0}</p>
          </article>

          <article>
            <h3>Neue Seite erstellen</h3>
            <form onSubmit={createPage} className="create-form">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Seitentitel" required />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Inhalt (WYSIWYG/Markdown Platzhalter)"
                required
              />
              <button type="submit">Create Page</button>
            </form>
          </article>
        </section>

        <section className="card grid-three">
          <article>
            <h4>Kommentare</h4>
            <ul>
              <li>Inline-Kommentar Thread #1</li>
              <li>Seitenkommentar @team</li>
            </ul>
          </article>
          <article>
            <h4>Anhänge</h4>
            <ul>
              <li>architecture.pdf (v2)</li>
              <li>roadmap.png (v1)</li>
            </ul>
          </article>
          <article>
            <h4>Makros & Tools</h4>
            <ul>
              <li>Table of Contents</li>
              <li>Status Macro</li>
              <li>Children Display</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
