import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

type Space = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

type Role = "Admin" | "Editor" | "Viewer";

type ViewMode = "page" | "dashboard" | "recent" | "starred" | "people" | "space-settings";

type VersionEntry = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type PageComment = {
  id: string;
  pageId: string;
  parentId?: string;
  author: string;
  text: string;
  selectedText?: string;
  createdAt: string;
};

const SPACES: Space[] = [
  { id: "it", name: "IT", icon: "🖥️", description: "Infrastruktur, Betrieb und Security" },
  { id: "hr", name: "HR", icon: "🧑‍💼", description: "Richtlinien, Onboarding und Recruiting" },
  { id: "devops", name: "DevOps", icon: "🚀", description: "Deployments, Pipelines und SRE" }
];

const PEOPLE = ["admin", "emma", "jonas", "mia", "harvey", "wil"];

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

  function pickColor(e: ChangeEvent<HTMLInputElement>) {
    run("foreColor", e.target.value);
  }

  function pickFontSize(value: string) {
    run("fontSize", value);
  }

  function insertLink() {
    const url = prompt("Link URL eingeben:", "https://");
    if (url) run("createLink", url);
  }

  function insertImage() {
    const url = prompt("Bild URL eingeben:", "https://picsum.photos/800/400");
    if (url) run("insertImage", url);
  }

  function insertTable() {
    run(
      "insertHTML",
      '<table><thead><tr><th>Spalte 1</th><th>Spalte 2</th></tr></thead><tbody><tr><td>Inhalt</td><td>Inhalt</td></tr></tbody></table><p></p>'
    );
  }

  function insertPanel(kind: "info" | "warning" | "error") {
    const text = kind === "info" ? "Info Hinweis" : kind === "warning" ? "Warnung" : "Fehler";
    run("insertHTML", `<div class="panel ${kind}">${text}</div><p></p>`);
  }

  function insertCodeBlock() {
    run("insertHTML", '<pre><code>// code block\nconsole.log("Hokkaido Wiki")</code></pre><p></p>');
  }

  function insertEmoji() {
    run("insertText", "😀");
  }

  return (
    <div className="rich-editor-wrap">
      <div className="rich-toolbar">
        <button type="button" className="ghost" onClick={() => run("bold")}>B</button>
        <button type="button" className="ghost" onClick={() => run("italic")}>I</button>
        <button type="button" className="ghost" onClick={() => run("underline")}>U</button>
        <button type="button" className="ghost" onClick={() => run("formatBlock", "H1")}>H1</button>
        <button type="button" className="ghost" onClick={() => run("formatBlock", "H2")}>H2</button>
        <button type="button" className="ghost" onClick={() => run("formatBlock", "H3")}>H3</button>
        <button type="button" className="ghost" onClick={() => run("formatBlock", "H4")}>H4</button>
        <button type="button" className="ghost" onClick={() => run("formatBlock", "H5")}>H5</button>
        <button type="button" className="ghost" onClick={() => run("formatBlock", "H6")}>H6</button>
        <select onChange={(e) => pickFontSize(e.target.value)} defaultValue="">
          <option value="" disabled>Schriftgröße</option>
          <option value="2">Klein</option>
          <option value="3">Normal</option>
          <option value="5">Groß</option>
          <option value="7">XL</option>
        </select>
        <label className="color-picker">Farbe<input type="color" onChange={pickColor} /></label>
        <button type="button" className="ghost" onClick={insertLink}>Link</button>
        <button type="button" className="ghost" onClick={insertImage}>Bild</button>
        <button type="button" className="ghost" onClick={insertTable}>Tabelle</button>
        <button type="button" className="ghost" onClick={insertCodeBlock}>Code</button>
        <button type="button" className="ghost" onClick={() => insertPanel("info")}>Info Panel</button>
        <button type="button" className="ghost" onClick={() => insertPanel("warning")}>Warning</button>
        <button type="button" className="ghost" onClick={() => insertPanel("error")}>Error</button>
        <button type="button" className="ghost" onClick={() => run("insertUnorderedList")}>• Liste</button>
        <button type="button" className="ghost" onClick={() => run("insertOrderedList")}>1. Liste</button>
        <button type="button" className="ghost" onClick={insertEmoji}>😀</button>
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

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildSnippet(content: string, q: string) {
  const text = stripHtml(content);
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text.slice(0, 120);
  return text.slice(Math.max(0, idx - 20), idx + 120);
}

export function HomePage({ token }: { token: string }) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [search, setSearch] = useState("");
  const [spaceId, setSpaceId] = useState(SPACES[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState("");

  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [watching, setWatching] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [role, setRole] = useState<Role>("Admin");

  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"page" | "blog" | "space">("page");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("<p>Neue Seite</p>");
  const [newParentId, setNewParentId] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [versionHistory, setVersionHistory] = useState<Record<string, VersionEntry[]>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [diffVersion, setDiffVersion] = useState<VersionEntry | null>(null);

  const [comments, setComments] = useState<PageComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSpaceSettings, setShowSpaceSettings] = useState(false);
  const [spaceNameDraft, setSpaceNameDraft] = useState("");
  const [spaceDescDraft, setSpaceDescDraft] = useState("");
  const [spaces, setSpaces] = useState<Space[]>(SPACES);

  const dragPageId = useRef<string | null>(null);

  const selectedSpace = useMemo(() => spaces.find((s) => s.id === spaceId) ?? spaces[0], [spaces, spaceId]);

  const load = async () => {
    const [p, d] = await Promise.all([
      apiFetch<WikiPage[]>("/pages", {}, token),
      apiFetch<Dashboard>("/dashboard", {}, token)
    ]);
    const spaced = p.map((page, idx) => ({ ...page, parentId: page.parentId ?? null, spaceId: idx % spaces.length === 1 ? "hr" : idx % spaces.length === 2 ? "devops" : "it" })) as (WikiPage & { spaceId: string })[];
    setPages(spaced as unknown as WikiPage[]);
    setDashboard(d);
    if (!selectedPageId && spaced.length > 0) setSelectedPageId(spaced[0].id);

    const initialVersions: Record<string, VersionEntry[]> = {};
    spaced.forEach((page) => {
      initialVersions[page.id] = [{ id: `v-${page.id}-1`, title: page.title, content: page.content, updatedAt: page.updatedAt }];
    });
    setVersionHistory(initialVersions);

    setComments([
      { id: "c1", pageId: spaced[0]?.id ?? "", author: "emma", text: "@admin bitte Abschnitt 2 prüfen", createdAt: new Date().toISOString() },
      { id: "c2", pageId: spaced[0]?.id ?? "", parentId: "c1", author: "admin", text: "Erledigt ✅", createdAt: new Date().toISOString() }
    ].filter((c) => c.pageId));
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "e" && role !== "Viewer" && selectedPage) {
        e.preventDefault();
        startEdit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const currentPages = useMemo(
    () => (pages as (WikiPage & { spaceId?: string })[]).filter((p) => (p.spaceId ?? "it") === spaceId),
    [pages, spaceId]
  );

  const selectedPage = useMemo(
    () => currentPages.find((p) => p.id === selectedPageId) ?? currentPages[0] ?? null,
    [currentPages, selectedPageId]
  );

  const rootPages = useMemo(() => currentPages.filter((p) => !p.parentId), [currentPages]);
  const childPages = (parentId: string) => currentPages.filter((p) => p.parentId === parentId);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return (pages as (WikiPage & { spaceId?: string })[])
      .filter((p) => p.title.toLowerCase().includes(q) || stripHtml(p.content).toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, pages]);

  const mentions = useMemo(() => {
    const m = commentText.match(/@([a-zA-Z0-9_]*)$/);
    if (!m) return [];
    return PEOPLE.filter((u) => u.startsWith(m[1].toLowerCase())).slice(0, 5);
  }, [commentText]);

  const pageComments = useMemo(
    () => comments.filter((c) => c.pageId === selectedPage?.id && !c.parentId),
    [comments, selectedPage?.id]
  );

  const toc = useMemo(() => {
    if (!selectedPage) return [] as { text: string; level: string }[];
    const matches = selectedPage.content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) ?? [];
    return matches.map((m) => ({
      text: m.replace(/<[^>]*>/g, ""),
      level: (m.match(/<h([1-6])/)?.[1] ?? "1")
    }));
  }, [selectedPage]);

  function toggleFavorite(id: string) {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleWatch(id: string) {
    setWatching((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openCreate(type: "page" | "blog" | "space") {
    setCreateType(type);
    setNewTitle("");
    setNewContent("<p>Neue Seite</p>");
    setNewParentId(selectedPage?.id ?? "");
    setShowCreateMenu(false);
    setShowCreateModal(true);
  }

  async function createEntry(e: FormEvent) {
    e.preventDefault();

    if (createType === "space") {
      const id = newTitle.toLowerCase().replace(/\s+/g, "-");
      const newSpace = { id, name: newTitle, icon: "📁", description: stripHtml(newContent).slice(0, 120) };
      setSpaces((prev) => [...prev, newSpace]);
      setSpaceId(id);
      setActionInfo(`Space "${newTitle}" erstellt.`);
      setShowCreateModal(false);
      return;
    }

    const payload = {
      title: createType === "blog" ? `[Blog] ${newTitle}` : newTitle,
      content: newContent,
      parentId: createType === "blog" ? undefined : newParentId || undefined,
      tagNames: createType === "blog" ? ["blog"] : ["knowledge", "team"]
    };

    await apiFetch("/pages", { method: "POST", body: JSON.stringify(payload) }, token);
    await load();
    setShowCreateModal(false);
    setViewMode("page");
    setActionInfo(`${createType === "blog" ? "Blogpost" : "Seite"} "${newTitle}" erstellt.`);
  }

  function startEdit() {
    if (!selectedPage || role === "Viewer") return;
    setEditTitle(selectedPage.title);
    setEditContent(selectedPage.content);
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!selectedPage || role === "Viewer") return;

    const oldVersion: VersionEntry = {
      id: `v-${selectedPage.id}-${Date.now()}`,
      title: selectedPage.title,
      content: selectedPage.content,
      updatedAt: selectedPage.updatedAt
    };

    await apiFetch(
      `/pages/${selectedPage.id}`,
      { method: "PUT", body: JSON.stringify({ title: editTitle, content: editContent }) },
      token
    );

    setVersionHistory((prev) => ({ ...prev, [selectedPage.id]: [...(prev[selectedPage.id] ?? []), oldVersion] }));
    setIsEditing(false);
    setActionInfo("Seite gespeichert. Neue Version erzeugt.");
    await load();
  }

  function restoreVersion(v: VersionEntry) {
    setEditTitle(v.title);
    setEditContent(v.content);
    setIsEditing(true);
    setShowHistory(false);
    setDiffVersion(v);
    setActionInfo(`Version vom ${new Date(v.updatedAt).toLocaleString()} geladen.`);
  }

  function addComment(e: FormEvent) {
    e.preventDefault();
    if (!selectedPage || !commentText.trim()) return;

    const c: PageComment = {
      id: `c-${Date.now()}`,
      pageId: selectedPage.id,
      parentId: replyTarget ?? undefined,
      author: "admin",
      text: commentText,
      selectedText: selectedText || undefined,
      createdAt: new Date().toISOString()
    };

    setComments((prev) => [...prev, c]);
    setCommentText("");
    setReplyTarget(null);
    setSelectedText("");
  }

  function applyMention(user: string) {
    setCommentText((prev) => prev.replace(/@([a-zA-Z0-9_]*)$/, `@${user} `));
  }

  function captureSelection() {
    const text = window.getSelection()?.toString().trim() ?? "";
    setSelectedText(text);
  }

  function handleDragStart(pageId: string) {
    dragPageId.current = pageId;
  }

  function movePageToParent(targetParentId: string | null) {
    const dragged = dragPageId.current;
    if (!dragged || dragged === targetParentId) return;
    setPages((prev) =>
      (prev as (WikiPage & { spaceId?: string })[]).map((p) =>
        p.id === dragged ? { ...p, parentId: targetParentId } : p
      ) as WikiPage[]
    );
    setActionInfo("Seite im Baum verschoben.");
  }

  function saveSpaceSettings(e: FormEvent) {
    e.preventDefault();
    if (!selectedSpace) return;
    setSpaces((prev) => prev.map((s) => (s.id === selectedSpace.id ? { ...s, name: spaceNameDraft || s.name, description: spaceDescDraft || s.description } : s)));
    setShowSpaceSettings(false);
    setActionInfo("Space-Einstellungen gespeichert.");
  }

  const favoritePages = currentPages.filter((p) => favorites[p.id]);
  const notifications = [
    ...(dashboard?.unreadNotifications ?? []).map((n) => n.message),
    ...Object.entries(watching).filter(([, v]) => v).map(([id]) => `Updates für Seite ${currentPages.find((p) => p.id === id)?.title ?? id}`)
  ];

  return (
    <div className={`hwiki-shell ${darkMode ? "dark" : ""}`}>
      <header className="hwiki-topnav">
        <div className="hwiki-topnav-left">
          <div className="brand-pill">❄️ Hokkaido Wiki</div>
          <select value={spaceId} onChange={(e) => { setSpaceId(e.target.value); setViewMode("dashboard"); }}>
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>

        <div className="hwiki-topnav-center">
          <input
            className="global-search"
            placeholder="Search in pages, blogs, attachments..."
            value={search}
            onFocus={() => setShowSearchDropdown(true)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 180)}
            onChange={(e) => {
              setSearch(e.target.value);
              setViewMode("page");
            }}
          />
          {showSearchDropdown && search && (
            <div className="search-dropdown">
              {searchResults.length === 0 && <div className="search-item muted">Keine Treffer</div>}
              {searchResults.map((r) => (
                <button key={r.id} className="search-item" onClick={() => { setSelectedPageId(r.id); setViewMode("page"); setSearch(""); }}>
                  <strong>{r.title}</strong>
                  <span>{buildSnippet(r.content, search)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hwiki-topnav-right">
          <div className="menu-wrap">
            <button onClick={() => setShowCreateMenu((v) => !v)}>+ Create</button>
            {showCreateMenu && (
              <div className="menu-dropdown">
                <button onClick={() => openCreate("page")}>Page</button>
                <button onClick={() => openCreate("blog")}>Blog</button>
                <button onClick={() => openCreate("space")}>Space</button>
              </div>
            )}
          </div>
          <button className="ghost" onClick={() => setShowNotif((v) => !v)}>🔔</button>
          <button className="ghost" onClick={() => setShowHelp((v) => !v)}>❓</button>
          <button className="ghost" onClick={() => setDarkMode((v) => !v)}>{darkMode ? "☀️" : "🌙"}</button>
          <div className="menu-wrap">
            <button className="avatar" onClick={() => setShowUserMenu((v) => !v)}>HK</button>
            {showUserMenu && (
              <div className="menu-dropdown">
                <button onClick={() => setActionInfo("Profil geöffnet")}>Profile</button>
                <button onClick={() => setActionInfo("User Settings geöffnet")}>Settings</button>
                <button onClick={() => setActionInfo("Logout oben rechts verfügbar")}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNotif && <div className="floating-panel">{notifications.length ? notifications.map((n) => <p key={n}>{n}</p>) : <p>Keine Benachrichtigungen.</p>}</div>}
      {showHelp && <div className="floating-panel help"><p><strong>Shortcuts:</strong> Taste <code>e</code> zum Editieren.</p><p><strong>Tip:</strong> Markiere Text in der Seite für Inline-Kommentare.</p></div>}

      <aside className="hwiki-sidebar">
        <div className="sidebar-top">
          <h3>{selectedSpace.icon} {selectedSpace.name}</h3>
          <p>{selectedSpace.description}</p>
          <button onClick={() => openCreate("page")}>Create Page</button>
          <button className="ghost" onClick={() => { setViewMode("space-settings"); setShowSpaceSettings(true); setSpaceNameDraft(selectedSpace.name); setSpaceDescDraft(selectedSpace.description); }}>Space Settings</button>
        </div>

        <h4>Page Tree</h4>
        <button className="ghost" onClick={() => movePageToParent(null)}>Drop to root</button>
        <ul className="tree-list">
          {rootPages.map((root) => (
            <li
              key={root.id}
              draggable
              onDragStart={() => handleDragStart(root.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => movePageToParent(root.id)}
            >
              <div className="tree-row">
                <button className="ghost icon" onClick={() => setCollapsed((prev) => ({ ...prev, [root.id]: !prev[root.id] }))}>{collapsed[root.id] ? "▸" : "▾"}</button>
                <button className={selectedPage?.id === root.id ? "tree-btn active" : "tree-btn"} onClick={() => { setSelectedPageId(root.id); setViewMode("page"); }}>📄 {root.title}</button>
                <button className="ghost icon" onClick={() => toggleFavorite(root.id)}>{favorites[root.id] ? "⭐" : "☆"}</button>
              </div>
              {!collapsed[root.id] && childPages(root.id).length > 0 && (
                <ul>
                  {childPages(root.id).map((child) => (
                    <li
                      key={child.id}
                      draggable
                      onDragStart={() => handleDragStart(child.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => movePageToParent(child.id)}
                    >
                      <div className="tree-row">
                        <button className={selectedPage?.id === child.id ? "tree-btn active" : "tree-btn"} onClick={() => { setSelectedPageId(child.id); setViewMode("page"); }}>↳ 📄 {child.title}</button>
                        <button className="ghost icon" onClick={() => toggleFavorite(child.id)}>{favorites[child.id] ? "⭐" : "☆"}</button>
                      </div>
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

        {viewMode === "dashboard" && (
          <section className="card">
            <h2>{selectedSpace.name} Dashboard</h2>
            <p>{selectedSpace.description}</p>
            <div className="dashboard-grid">
              <article>
                <h4>Recently viewed</h4>
                <ul>{(dashboard?.recentPages ?? []).slice(0, 5).map((p) => <li key={p.id}>{p.title}</li>)}</ul>
              </article>
              <article>
                <h4>Recently updated</h4>
                <ul>{currentPages.slice(0, 5).map((p) => <li key={p.id}>{p.title}</li>)}</ul>
              </article>
              <article>
                <h4>Favorite pages</h4>
                <ul>{favoritePages.length ? favoritePages.map((p) => <li key={p.id}>{p.title}</li>) : <li>Keine Favoriten</li>}</ul>
              </article>
              <article>
                <h4>Activity feed</h4>
                <p>{dashboard?.myCommentsCount ?? 0} Kommentare, {dashboard?.myPagesCount ?? 0} Seiten.</p>
              </article>
            </div>
          </section>
        )}

        {viewMode === "space-settings" && showSpaceSettings && (
          <section className="card">
            <h2>Space Settings</h2>
            <form onSubmit={saveSpaceSettings} className="create-form">
              <input value={spaceNameDraft} onChange={(e) => setSpaceNameDraft(e.target.value)} placeholder="Space Name" required />
              <textarea value={spaceDescDraft} onChange={(e) => setSpaceDescDraft(e.target.value)} placeholder="Beschreibung" required />
              <div className="modal-actions">
                <button type="submit">Speichern</button>
              </div>
            </form>
          </section>
        )}

        {viewMode === "recent" && <section className="card"><h3>Recent Pages</h3><ul>{(dashboard?.recentPages ?? []).map((p) => <li key={p.id}>{p.title}</li>)}</ul></section>}
        {viewMode === "starred" && <section className="card"><h3>Starred Pages</h3><ul>{favoritePages.map((p) => <li key={p.id}>{p.title}</li>)}</ul></section>}
        {viewMode === "people" && <section className="card"><h3>People Directory</h3><ul>{PEOPLE.map((person) => <li key={person}>{person}</li>)}</ul></section>}

        {viewMode === "page" && (
          <>
            <section className="page-header card">
              <div>
                <small className="muted">{selectedSpace.name} / Home / {selectedPage?.title ?? "No page selected"}</small>
                <h2>{isEditing ? editTitle : selectedPage?.title ?? "Willkommen"}</h2>
              </div>
              <div className="page-actions">
                <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option>Admin</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
                <button className="ghost" onClick={() => setViewMode("dashboard")}>Overview</button>
                <button className="ghost" disabled={role === "Viewer"} onClick={startEdit}>Edit</button>
                <button className="ghost" onClick={() => setActionInfo("Share-Link in Zwischenablage kopiert")}>Share</button>
                <button className="ghost" onClick={() => selectedPage && toggleWatch(selectedPage.id)}>{selectedPage && watching[selectedPage.id] ? "Watching" : "Watch"}</button>
                <button className="ghost" onClick={() => setShowHistory(true)}>History</button>
                <button className="ghost" onClick={() => setShowRightSidebar((v) => !v)}>{showRightSidebar ? "Hide" : "Show"} Info</button>
              </div>
            </section>

            <section className="card content-view" onMouseUp={captureSelection}>
              {selectedPage ? (
                isEditing ? (
                  <>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <RichEditor initialValue={editContent} onChange={setEditContent} />
                    <div className="modal-actions">
                      <button className="ghost" onClick={() => setIsEditing(false)}>Abbrechen</button>
                      <button onClick={saveEdit}>Speichern</button>
                    </div>
                  </>
                ) : (
                  <>
                    <small className="muted">Updated: {new Date(selectedPage.updatedAt).toLocaleString()}</small>
                    <div className="rendered-content" dangerouslySetInnerHTML={{ __html: selectedPage.content }} />
                  </>
                )
              ) : (
                <p>Wähle eine Seite aus dem Baum oder erstelle eine neue Seite.</p>
              )}
              <div className="page-meta">
                <span>Labels: knowledge, team</span>
                <span>{selectedPage && favorites[selectedPage.id] ? "⭐ Favorit" : "☆ Kein Favorit"}</span>
                <span>{selectedPage && watching[selectedPage.id] ? "Watching: on" : "Watching: off"}</span>
                <span>Versionen: {selectedPage ? (versionHistory[selectedPage.id]?.length ?? 0) : 0}</span>
              </div>
            </section>

            <section className="card">
              <h3>Kommentare</h3>
              {selectedText && <p className="muted">Inline-Kommentar auf: "{selectedText}"</p>}
              <form onSubmit={addComment} className="create-form">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Kommentar schreiben... nutze @username für Mentions"
                  required
                />
                {mentions.length > 0 && (
                  <div className="mention-box">
                    {mentions.map((m) => (
                      <button type="button" key={m} className="ghost" onClick={() => applyMention(m)}>@{m}</button>
                    ))}
                  </div>
                )}
                <div className="modal-actions">
                  <button type="submit">Kommentar senden</button>
                </div>
              </form>

              <ul className="comments-list">
                {pageComments.map((c) => (
                  <li key={c.id}>
                    <strong>@{c.author}</strong> <small>{new Date(c.createdAt).toLocaleString()}</small>
                    {c.selectedText && <blockquote>{c.selectedText}</blockquote>}
                    <p>{c.text}</p>
                    <button className="ghost" onClick={() => setReplyTarget(c.id)}>Antworten</button>
                    <ul>
                      {comments.filter((x) => x.parentId === c.id).map((reply) => (
                        <li key={reply.id}><strong>@{reply.author}</strong> {reply.text}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      {showRightSidebar && (
        <aside className="hwiki-rightbar">
          <section>
            <h4>Page Info</h4>
            <p>Role: {role}</p>
            <p>Space: {selectedSpace.name}</p>
            <p>Updated: {selectedPage ? new Date(selectedPage.updatedAt).toLocaleString() : "-"}</p>
          </section>
          <section>
            <h4>Table of Contents</h4>
            <ul>
              {toc.length ? toc.map((h, idx) => <li key={`${h.text}-${idx}`} className={`toc-l${h.level}`}>{h.text}</li>) : <li>Keine Überschriften</li>}
            </ul>
          </section>
          <section>
            <h4>Attachments</h4>
            <p>Bild-URLs aus dem Editor werden inline angezeigt.</p>
          </section>
          <section>
            <h4>Page Properties</h4>
            <p>Favorit: {selectedPage && favorites[selectedPage.id] ? "Ja" : "Nein"}</p>
            <p>Watching: {selectedPage && watching[selectedPage.id] ? "Ja" : "Nein"}</p>
          </section>
        </aside>
      )}

      {showHistory && selectedPage && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
            <h3>Version History</h3>
            <ul className="history-list">
              {(versionHistory[selectedPage.id] ?? []).map((v) => (
                <li key={v.id}>
                  <div>
                    <strong>{v.title}</strong>
                    <small>{new Date(v.updatedAt).toLocaleString()}</small>
                  </div>
                  <div>
                    <button className="ghost" onClick={() => setDiffVersion(v)}>Diff</button>
                    <button className="ghost" onClick={() => restoreVersion(v)}>Restore</button>
                  </div>
                </li>
              ))}
            </ul>
            {diffVersion && (
              <div className="diff-view">
                <h4>Diff (Vorher/Nachher)</h4>
                <div className="diff-grid">
                  <pre>{stripHtml(diffVersion.content)}</pre>
                  <pre>{stripHtml(selectedPage.content)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
            <h3>{createType === "space" ? "Create Space" : createType === "blog" ? "Create Blog" : "Create Page"}</h3>
            <form onSubmit={createEntry} className="create-form">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titel" required />
              <RichEditor initialValue={newContent} onChange={setNewContent} />
              {createType === "page" && (
                <select value={newParentId} onChange={(e) => setNewParentId(e.target.value)}>
                  <option value="">Kein Parent (Root-Seite)</option>
                  {currentPages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              )}
              <div className="modal-actions">
                <button type="button" className="ghost" onClick={() => setShowCreateModal(false)}>Abbrechen</button>
                <button type="submit">Erstellen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
