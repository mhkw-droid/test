import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

type ViewMode = "pages" | "recent" | "starred" | "people" | "apps";

type RichEditorProps = {
  initialValue: string;
  onChange: (value: string) => void;
};

function RichEditor({ initialValue, onChange }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialValue) {
      editorRef.current.innerHTML = initialValue || "";
    }
  }, [initialValue]);

  function run(command: string, value?: string) {
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function insertLink() {
    const url = prompt("Link URL eingeben:", "https://");
    if (url) run("createLink", url);
  }

  function insertImage() {
    const url = prompt("Bild URL eingeben:", "https://");
    if (url) run("insertImage", url);
  }

  function insertTable() {
    run(
      "insertHTML",
      '<table border="1" style="border-collapse:collapse;width:100%"><tr><th>Spalte 1</th><th>Spalte 2</th></tr><tr><td>Inhalt</td><td>Inhalt</td></tr></table><p></p>'
    );
  }

  return (
    <div className="rich-editor-wrap">
      <div className="rich-toolbar">
        <button type="button" className="ghost" onClick={() => run("bold")}><b>B</b></button>
        <button type="button" className="ghost" onClick={() => run("italic")}><i>I</i></button>
        <button type="button" className="ghost" onClick={() => run("underline")}><u>U</u></button>
        <button type="button" className="ghost" onClick={() => run("formatBlock", "H1")}>H1</button>
        <button type="button" className="ghost" onClick={() => run("formatBlock", "H2")}>H2</button>
        <button type="button" className="ghost" onClick={() => run("foreColor", "#0052cc")}>Farbe</button>
        <button type="button" className="ghost" onClick={insertLink}>Link</button>
        <button type="button" className="ghost" onClick={insertImage}>Bild</button>
        <button type="button" className="ghost" onClick={insertTable}>Tabelle</button>
        <button type="button" className="ghost" onClick={() => run("insertUnorderedList")}>• Liste</button>
        <button type="button" className="ghost" onClick={() => run("insertOrderedList")}>1. Liste</button>
      </div>
      <div
        ref={editorRef}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
      />
    </div>
  );
}

export function HomePage({ token }: { token: string }) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [space, setSpace] = useState(SPACE_OPTIONS[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("pages");
  const [actionInfo, setActionInfo] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newParentId, setNewParentId] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

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

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }, [pages, search]);

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedPageId) ?? filteredPages[0] ?? null,
    [pages, filteredPages, selectedPageId]
  );

  const rootPages = useMemo(() => filteredPages.filter((p) => !p.parentId), [filteredPages]);
  const childPages = (parentId: string) => filteredPages.filter((p) => p.parentId === parentId);

  const starredPages = useMemo(() => pages.slice(0, 3), [pages]);
  const peopleDemo = ["Admin", "Editor", "Viewer"];
  const appsDemo = ["Jira Issues", "Task Report", "Page Tree Macro"];

  function openCreateModal() {
    setNewTitle("");
    setNewContent("");
    setNewParentId(selectedPageId ?? "");
    setShowCreateModal(true);
  }

  function openEditModal() {
    if (!selectedPage) {
      setActionInfo("Bitte zuerst eine Seite auswählen.");
      return;
    }
    setEditTitle(selectedPage.title);
    setEditContent(selectedPage.content);
    setShowEditModal(true);
  }

  async function createPage(e: FormEvent) {
    e.preventDefault();
    await apiFetch(
      "/pages",
      {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          content: newContent || "<p>Neue Seite</p>",
          tagNames: ["knowledge", "team"],
          parentId: newParentId || undefined
        })
      },
      token
    );
    setShowCreateModal(false);
    setActionInfo(`Seite "${newTitle}" erstellt.`);
    await load();
  }

  async function updatePage(e: FormEvent) {
    e.preventDefault();
    if (!selectedPage) return;

    await apiFetch(
      `/pages/${selectedPage.id}`,
      {
        method: "PUT",
        body: JSON.stringify({ title: editTitle, content: editContent })
      },
      token
    );

    setShowEditModal(false);
    setActionInfo(`Seite "${editTitle}" gespeichert.`);
    await load();
  }

  return (
    <div className="hwiki-shell">
      <header className="hwiki-topnav">
        <div className="hwiki-topnav-left">
          <div className="brand-pill">❄️ Hokkaido Wiki</div>
          <button className={viewMode === "recent" ? "ghost active" : "ghost"} onClick={() => setViewMode("recent")}>Recent</button>
          <button className={viewMode === "starred" ? "ghost active" : "ghost"} onClick={() => setViewMode("starred")}>Starred</button>
          <button className={viewMode === "people" ? "ghost active" : "ghost"} onClick={() => setViewMode("people")}>People</button>
          <button className={viewMode === "apps" ? "ghost active" : "ghost"} onClick={() => setViewMode("apps")}>Apps</button>
        </div>

        <div className="hwiki-topnav-center">
          <select value={space} onChange={(e) => setSpace(e.target.value)}>
            {SPACE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input
            className="global-search"
            placeholder="Globale Suche (Seiten, Blogs, Anhänge...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setViewMode("pages");
            }}
          />
        </div>

        <div className="hwiki-topnav-right">
          <button onClick={openCreateModal}>Create Seite</button>
          <button className="ghost" onClick={() => setActionInfo("Admin Bereich: Demo-Ansicht")}>Admin</button>
          <div className="avatar">HK</div>
        </div>
      </header>

      <aside className="hwiki-sidebar">
        <h3>{space}</h3>
        <nav className="space-links">
          <button className="ghost" onClick={() => setViewMode("pages")}>Space Overview</button>
          <button className="ghost" onClick={() => setViewMode("recent")}>Blog Posts</button>
          <button className="ghost" onClick={() => setViewMode("apps")}>Space Tools</button>
          <button className="ghost" onClick={() => setViewMode("people")}>Space Settings</button>
        </nav>

        <h4>Page Tree</h4>
        <ul className="tree-list">
          {rootPages.map((root) => (
            <li key={root.id}>
              <button className={selectedPage?.id === root.id ? "tree-btn active" : "tree-btn"} onClick={() => {setSelectedPageId(root.id); setViewMode("pages");}}>{root.title}</button>
              {childPages(root.id).length > 0 && (
                <ul>
                  {childPages(root.id).map((child) => (
                    <li key={child.id}>
                      <button className={selectedPage?.id === child.id ? "tree-btn active" : "tree-btn"} onClick={() => {setSelectedPageId(child.id); setViewMode("pages");}}>{child.title}</button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>

      <main className="hwiki-main">
        {actionInfo && <div className="inline-info">{actionInfo}</div>}

        {viewMode === "pages" && (
          <>
            <section className="page-header card">
              <div>
                <small className="muted">{space} / Home / {selectedPage?.title ?? "No page selected"}</small>
                <h2>{selectedPage?.title ?? "Willkommen"}</h2>
              </div>
              <div className="page-actions">
                <button className="ghost" onClick={openEditModal}>Edit</button>
                <button className="ghost" onClick={() => setActionInfo("Share-Link kopieren: Feature-Demo aktiv.")}>Share</button>
                <button className="ghost" onClick={() => setActionInfo("Weitere Aktionen folgen: Move, Copy, History.")}>…</button>
              </div>
            </section>

            <section className="card content-view">
              {selectedPage ? (
                <>
                  <small className="muted">Updated: {new Date(selectedPage.updatedAt).toLocaleString()}</small>
                  <div className="rendered-content" dangerouslySetInnerHTML={{ __html: selectedPage.content }} />
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
          </>
        )}

        {viewMode === "recent" && <section className="card"><h3>Recent Pages</h3><ul>{(dashboard?.recentPages ?? []).map((p) => <li key={p.id}>{p.title}</li>)}</ul></section>}
        {viewMode === "starred" && <section className="card"><h3>Starred Pages</h3><ul>{starredPages.map((p) => <li key={p.id}>{p.title}</li>)}</ul></section>}
        {viewMode === "people" && <section className="card"><h3>People Directory</h3><ul>{peopleDemo.map((person) => <li key={person}>{person}</li>)}</ul></section>}
        {viewMode === "apps" && <section className="card"><h3>Apps & Integrationen</h3><button className="ghost" onClick={() => setActionInfo("Jira-Integration Demo geöffnet.")}>Jira Integration öffnen</button><ul>{appsDemo.map((app) => <li key={app}>{app}</li>)}</ul></section>}
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
            <h3>Create Seite</h3>
            <form onSubmit={createPage} className="create-form">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Seitentitel" required />
              <RichEditor initialValue={newContent} onChange={setNewContent} />
              <select value={newParentId} onChange={(e) => setNewParentId(e.target.value)}>
                <option value="">Kein Parent (Root-Seite)</option>
                {pages.map((p) => <option key={p.id} value={p.id}>Parent: {p.title}</option>)}
              </select>
              <div className="modal-actions">
                <button type="button" className="ghost" onClick={() => setShowCreateModal(false)}>Abbrechen</button>
                <button type="submit">Seite erstellen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
            <h3>Seite bearbeiten</h3>
            <form onSubmit={updatePage} className="create-form">
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Seitentitel" required />
              <RichEditor initialValue={editContent} onChange={setEditContent} />
              <div className="modal-actions">
                <button type="button" className="ghost" onClick={() => setShowEditModal(false)}>Abbrechen</button>
                <button type="submit">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
