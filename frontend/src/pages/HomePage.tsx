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

type Space = { id: string; name: string; icon: string; description: string };
type Role = "Admin" | "Editor" | "Viewer";
type ViewMode = "dashboard" | "page" | "space-settings" | "profile" | "user-settings";
type CreateType = "page" | "blog" | "space";
type PrefState = { favorites: Record<string, boolean>; watching: Record<string, boolean>; darkMode: boolean };

type VersionEntry = { id: string; title: string; content: string; updatedAt: string };
type PageComment = { id: string; pageId: string; parentId?: string; author: string; text: string; selectedText?: string; createdAt: string };

const SPACES: Space[] = [
  { id: "it", name: "IT", icon: "🖥️", description: "Infrastruktur, Betrieb und Security" },
  { id: "hr", name: "HR", icon: "🧑‍💼", description: "Richtlinien, Recruiting und Onboarding" },
  { id: "devops", name: "DevOps", icon: "🚀", description: "Deployments, CI/CD und SRE" }
];

const PEOPLE = ["admin", "emma", "jonas", "mia", "harvey", "wil"];

const VERSION_KEY = "wiki_versions";
const SPACE_MAP_KEY = "wiki_page_space_map";
const PREF_KEY = "wiki_prefs";

type RichEditorProps = {
  initialValue: string;
  onChange: (value: string) => void;
};

function RichEditor({ initialValue, onChange }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const sel = window.getSelection();
    if (!sel || !savedRangeRef.current) return;
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  }

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialValue) {
      editorRef.current.innerHTML = initialValue || "";
    }
  }, [initialValue]);

  function run(command: string, value?: string) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function insertImageUrl() {
    const url = prompt("Bild URL eingeben:", "https://picsum.photos/900/420");
    if (url) run("insertImage", url);
  }

  function uploadImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") run("insertImage", reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function insertPanel(kind: "info" | "warning" | "error") {
    const text = kind === "info" ? "Info Hinweis" : kind === "warning" ? "Warnung" : "Fehler";
    run("insertHTML", `<div class=\"panel ${kind}\">${text}</div><p></p>`);
  }

  return (
    <div className="rich-editor-wrap">
      <div className="rich-toolbar">
        <button type="button" className="ghost" onClick={() => run("bold")}>B</button>
        <button type="button" className="ghost" onClick={() => run("italic")}>I</button>
        <button type="button" className="ghost" onClick={() => run("underline")}>U</button>
        {([1, 2, 3, 4, 5, 6] as const).map((h) => (
          <button key={h} type="button" className="ghost" onClick={() => run("formatBlock", `H${h}`)}>{`H${h}`}</button>
        ))}
        <select onChange={(e) => run("fontSize", e.target.value)} defaultValue="">
          <option value="" disabled>Schriftgröße</option>
          <option value="2">Klein</option>
          <option value="3">Normal</option>
          <option value="5">Groß</option>
          <option value="7">XL</option>
        </select>
        <label className="color-picker">Farbe<input type="color" onChange={(e) => run("foreColor", e.target.value)} /></label>
        <button type="button" className="ghost" onClick={() => run("createLink", prompt("Link URL:", "https://") ?? "")}>Link</button>
        <button type="button" className="ghost" onClick={insertImageUrl}>Bild URL</button>
        <button type="button" className="ghost" onClick={() => fileInputRef.current?.click()}>Bild Upload</button>
        <input ref={fileInputRef} hidden type="file" accept="image/*" onChange={uploadImage} />
        <button type="button" className="ghost" onClick={() => run("insertHTML", "<table><thead><tr><th>Spalte 1</th><th>Spalte 2</th></tr></thead><tbody><tr><td>Inhalt</td><td>Inhalt</td></tr></tbody></table><p></p>")}>Tabelle</button>
        <button type="button" className="ghost" onClick={() => run("insertHTML", "<pre><code>// code\nconsole.log('Hokkaido Wiki');</code></pre><p></p>")}>Code</button>
        <button type="button" className="ghost" onClick={() => insertPanel("info")}>Info</button>
        <button type="button" className="ghost" onClick={() => insertPanel("warning")}>Warning</button>
        <button type="button" className="ghost" onClick={() => insertPanel("error")}>Error</button>
        <button type="button" className="ghost" onClick={() => run("insertUnorderedList")}>• Liste</button>
        <button type="button" className="ghost" onClick={() => run("insertOrderedList")}>1. Liste</button>
        <button type="button" className="ghost" onClick={() => run("insertText", "@admin ")}>@Mention</button>
        <button type="button" className="ghost" onClick={() => run("insertText", "😀")}>😀</button>
      </div>
      <div
        ref={editorRef}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
      />
    </div>
  );
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function snippet(content: string, q: string) {
  const text = stripHtml(content);
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text.slice(0, 120);
  return text.slice(Math.max(0, idx - 30), idx + 120);
}

function safeJson<T>(v: string | null, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function HomePage({ token, onLogout }: { token: string; onLogout: () => void }) {
  const pref = safeJson<PrefState>(localStorage.getItem(PREF_KEY), { favorites: {}, watching: {}, darkMode: false });

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [spaces, setSpaces] = useState<Space[]>(SPACES);
  const [spaceId, setSpaceId] = useState(SPACES[0].id);
  const [spaceMap, setSpaceMap] = useState<Record<string, string>>(() => safeJson(localStorage.getItem(SPACE_MAP_KEY), {}));
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState("");

  const [search, setSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [favorites, setFavorites] = useState<Record<string, boolean>>(pref.favorites);
  const [watching, setWatching] = useState<Record<string, boolean>>(pref.watching);
  const [collapsedTree, setCollapsedTree] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(pref.darkMode);
  const [role, setRole] = useState<Role>("Admin");

  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<CreateType>("page");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("<p>Neue Seite</p>");
  const [newParentId, setNewParentId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [showHistory, setShowHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState<Record<string, VersionEntry[]>>(() => safeJson(localStorage.getItem(VERSION_KEY), {}));
  const [diffVersion, setDiffVersion] = useState<VersionEntry | null>(null);

  const [comments, setComments] = useState<PageComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");

  const [showNotif, setShowNotif] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [spaceNameDraft, setSpaceNameDraft] = useState("");
  const [spaceDescDraft, setSpaceDescDraft] = useState("");

  const dragPageId = useRef<string | null>(null);

  const selectedSpace = useMemo(() => spaces.find((s) => s.id === spaceId) ?? spaces[0], [spaces, spaceId]);

  const load = async () => {
    const [pageData, dashboardData] = await Promise.all([
      apiFetch<WikiPage[]>("/pages", {}, token),
      apiFetch<Dashboard>("/dashboard", {}, token)
    ]);

    setPages(pageData);
    setDashboard(dashboardData);
    if (!selectedPageId && pageData.length > 0) setSelectedPageId(pageData[0].id);

    setVersionHistory((prev) => {
      const next = { ...prev };
      pageData.forEach((page) => {
        if (!next[page.id] || next[page.id].length === 0) {
          next[page.id] = [{ id: `v-${page.id}-1`, title: page.title, content: page.content, updatedAt: page.updatedAt }];
        }
      });
      return next;
    });

    if (comments.length === 0 && pageData[0]) {
      setComments([
        { id: "c1", pageId: pageData[0].id, author: "emma", text: "@admin Bitte Struktur prüfen", createdAt: new Date().toISOString() },
        { id: "c2", pageId: pageData[0].id, parentId: "c1", author: "admin", text: "Ist angepasst ✅", createdAt: new Date().toISOString() }
      ]);
    }

    return pageData;
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem(VERSION_KEY, JSON.stringify(versionHistory));
  }, [versionHistory]);

  useEffect(() => {
    localStorage.setItem(SPACE_MAP_KEY, JSON.stringify(spaceMap));
  }, [spaceMap]);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ favorites, watching, darkMode }));
  }, [favorites, watching, darkMode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowCreateMenu(false);
        setShowUserMenu(false);
        setShowMoreMenu(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const currentPages = useMemo(
    () => pages.filter((p) => (spaceMap[p.id] ?? "it") === spaceId),
    [pages, spaceMap, spaceId]
  );

  const selectedPage = useMemo(
    () => currentPages.find((p) => p.id === selectedPageId) ?? currentPages[0] ?? null,
    [currentPages, selectedPageId]
  );

  const rootPages = useMemo(() => currentPages.filter((p) => !p.parentId), [currentPages]);
  const children = (parentId: string) => currentPages.filter((p) => p.parentId === parentId);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [] as WikiPage[];
    return pages
      .filter((p) => p.title.toLowerCase().includes(q) || stripHtml(p.content).toLowerCase().includes(q))
      .slice(0, 8);
  }, [pages, search]);

  const pageComments = useMemo(
    () => comments.filter((c) => c.pageId === selectedPage?.id && !c.parentId),
    [comments, selectedPage?.id]
  );

  const mentions = useMemo(() => {
    const m = commentText.match(/@([a-zA-Z0-9_]*)$/);
    if (!m) return [];
    return PEOPLE.filter((u) => u.startsWith(m[1].toLowerCase())).slice(0, 5);
  }, [commentText]);

  const toc = useMemo(() => {
    if (!selectedPage) return [] as { text: string; level: string }[];
    const matches = selectedPage.content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) ?? [];
    return matches.map((m) => ({ text: m.replace(/<[^>]*>/g, ""), level: m.match(/<h([1-6])/)?.[1] ?? "1" }));
  }, [selectedPage]);

  const notifications = [
    ...(dashboard?.unreadNotifications ?? []).map((n) => n.message),
    ...Object.entries(watching).filter(([, v]) => v).map(([id]) => `Watching: ${pages.find((p) => p.id === id)?.title ?? id}`)
  ];

  function openCreate(type: CreateType) {
    setCreateType(type);
    setNewTitle("");
    setNewContent("<p>Neue Seite</p>");
    setNewParentId(selectedPage?.id ?? "");
    setShowCreateMenu(false);
    setShowCreateModal(true);
  }

  async function createEntry(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      setActionInfo("Bitte einen Titel eingeben.");
      return;
    }

    if (createType === "space") {
      const id = newTitle.toLowerCase().trim().replace(/\s+/g, "-");
      if (!id) return;
      if (spaces.some((s) => s.id === id)) {
        setActionInfo("Space existiert bereits.");
        return;
      }
      const created = { id, name: newTitle, icon: "📁", description: stripHtml(newContent).slice(0, 150) };
      setSpaces((prev) => [...prev, created]);
      setSpaceId(id);
      setShowCreateModal(false);
      setViewMode("dashboard");
      setActionInfo(`Space "${newTitle}" erstellt.`);
      return;
    }

    setIsCreating(true);
    const beforeIds = new Set(pages.map((p) => p.id));
    const fallbackId = `local-${Date.now()}`;

    try {
      await apiFetch(
        "/pages",
        {
          method: "POST",
          body: JSON.stringify({
            title: createType === "blog" ? `[Blog] ${newTitle}` : newTitle,
            content: newContent,
            parentId: createType === "page" ? (newParentId || undefined) : undefined,
            tagNames: createType === "blog" ? ["blog"] : ["knowledge", "team"]
          })
        },
        token
      );

      const loadedPages = await load();
      const createdIds = loadedPages.filter((p) => !beforeIds.has(p.id)).map((p) => p.id);

      if (createdIds.length > 0) {
        setSpaceMap((prev) => {
          const next = { ...prev };
          createdIds.forEach((id) => {
            next[id] = spaceId;
          });
          return next;
        });
        setSelectedPageId(createdIds[0]);
      } else {
        setPages((prev) => [
          {
            id: fallbackId,
            title: createType === "blog" ? `[Blog] ${newTitle}` : newTitle,
            content: newContent,
            updatedAt: new Date().toISOString(),
            parentId: createType === "page" ? (newParentId || null) : null
          },
          ...prev
        ]);
        setSpaceMap((prev) => ({ ...prev, [fallbackId]: spaceId }));
        setSelectedPageId(fallbackId);
      }

      setActionInfo(`${createType === "blog" ? "Blogpost" : "Seite"} "${newTitle}" erstellt.`);
    } catch (error) {
      const createdTitle = createType === "blog" ? `[Blog] ${newTitle}` : newTitle;
      setPages((prev) => [
        {
          id: fallbackId,
          title: createdTitle,
          content: newContent,
          updatedAt: new Date().toISOString(),
          parentId: createType === "page" ? (newParentId || null) : null
        },
        ...prev
      ]);
      setSpaceMap((prev) => ({ ...prev, [fallbackId]: spaceId }));
      setVersionHistory((prev) => ({
        ...prev,
        [fallbackId]: [{ id: `v-${fallbackId}-1`, title: createdTitle, content: newContent, updatedAt: new Date().toISOString() }]
      }));
      setSelectedPageId(fallbackId);
      setActionInfo(`Seite lokal erstellt (API Fehler): ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
    } finally {
      setShowCreateModal(false);
      setViewMode("page");
      setIsCreating(false);
    }
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
    setActionInfo("Seite gespeichert. Version aktualisiert.");
    await load();
  }

  async function deletePage() {
    if (!selectedPage || role === "Viewer") return;
    await apiFetch(`/pages/${selectedPage.id}`, { method: "DELETE" }, token);
    setShowMoreMenu(false);
    setActionInfo(`Seite "${selectedPage.title}" gelöscht.`);
    setSelectedPageId(null);
    await load();
  }

  async function duplicatePage() {
    if (!selectedPage || role === "Viewer") return;
    const title = `${selectedPage.title} (Copy)`;
    await apiFetch(
      "/pages",
      { method: "POST", body: JSON.stringify({ title, content: selectedPage.content, parentId: selectedPage.parentId || undefined, tagNames: ["copy"] }) },
      token
    );
    setShowMoreMenu(false);
    setActionInfo(`Seite dupliziert: ${title}`);
    await load();
  }

  async function sharePage() {
    if (!selectedPage) return;
    const link = `${window.location.origin}/page/${selectedPage.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setActionInfo("Seitenlink in Zwischenablage kopiert.");
    } catch {
      setActionInfo(`Seitenlink: ${link}`);
    }
  }

  function toggleFavorite(pageId: string) {
    setFavorites((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  }

  function toggleWatch(pageId: string) {
    setWatching((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  }

  function restoreVersion(v: VersionEntry) {
    setEditTitle(v.title);
    setEditContent(v.content);
    setIsEditing(true);
    setShowHistory(false);
    setDiffVersion(v);
  }

  function captureSelection() {
    const selected = window.getSelection()?.toString().trim();
    if (selected) setSelectedText(selected);
  }

  function applyMention(user: string) {
    setCommentText((prev) => prev.replace(/@([a-zA-Z0-9_]*)$/, `@${user} `));
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

  function startDrag(pageId: string) {
    dragPageId.current = pageId;
  }

  async function dropOn(targetParentId: string | null) {
    const dragged = dragPageId.current;
    if (!dragged || dragged === targetParentId) return;

    const draggedPage = pages.find((p) => p.id === dragged);
    if (!draggedPage) return;

    await apiFetch(`/pages/${dragged}`, { method: "PUT", body: JSON.stringify({ title: draggedPage.title, content: draggedPage.content, parentId: targetParentId ?? undefined }) }, token);
    setActionInfo("Seitenbaum aktualisiert.");
    await load();
  }

  function saveSpaceSettings(e: FormEvent) {
    e.preventDefault();
    setSpaces((prev) => prev.map((s) => (s.id === selectedSpace.id ? { ...s, name: spaceNameDraft || s.name, description: spaceDescDraft || s.description } : s)));
    setActionInfo("Space-Einstellungen gespeichert.");
    setViewMode("dashboard");
  }

  const favoritePages = currentPages.filter((p) => favorites[p.id]);

  return (
    <div className={`hwiki-shell ${darkMode ? "dark" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${!showRightSidebar ? "rightbar-hidden" : ""}`}>
      <header className="hwiki-topnav">
        <div className="hwiki-topnav-left">
          <button className="ghost" onClick={() => setSidebarCollapsed((v) => !v)}>{sidebarCollapsed ? "☰" : "⇤"}</button>
          <div className="brand-pill">❄️ Hokkaido Wiki</div>
          <select value={spaceId} onChange={(e) => { setSpaceId(e.target.value); setViewMode("dashboard"); }}>
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>

        <div className="hwiki-topnav-center">
          <input
            className="global-search"
            placeholder="Search in title/content"
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
              {searchResults.map((p) => (
                <button key={p.id} className="search-item" onClick={() => { setSelectedPageId(p.id); setSpaceId(spaceMap[p.id] ?? "it"); setViewMode("page"); setSearch(""); }}>
                  <strong>{p.title}</strong>
                  <span>{snippet(p.content, search)}</span>
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
                <button onClick={() => { setViewMode("profile"); setShowUserMenu(false); }}>Profile</button>
                <button onClick={() => { setViewMode("user-settings"); setShowUserMenu(false); }}>Settings</button>
                <button onClick={onLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNotif && <div className="floating-panel">{notifications.length ? notifications.map((n) => <p key={n}>{n}</p>) : <p>Keine Benachrichtigungen.</p>}</div>}
      {showHelp && <div className="floating-panel help"><p><strong>Shortcuts</strong>: <code>Esc</code> = Menüs schließen.</p></div>}

      {!sidebarCollapsed && (
        <aside className="hwiki-sidebar">
          <div className="sidebar-top">
            <h3>{selectedSpace.icon} {selectedSpace.name}</h3>
            <p>{selectedSpace.description}</p>
            <button onClick={() => openCreate("page")}>Create Page</button>
            <button className="ghost" onClick={() => { setSpaceNameDraft(selectedSpace.name); setSpaceDescDraft(selectedSpace.description); setViewMode("space-settings"); }}>Space Settings</button>
          </div>

          <h4>Page Tree</h4>
          <button className="ghost" onClick={() => dropOn(null)}>Drop to root</button>
          <ul className="tree-list">
            {rootPages.map((root) => (
              <li key={root.id} draggable onDragStart={() => startDrag(root.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(root.id)}>
                <div className="tree-row">
                  <button className="ghost icon" onClick={() => setCollapsedTree((prev) => ({ ...prev, [root.id]: !prev[root.id] }))}>{collapsedTree[root.id] ? "▸" : "▾"}</button>
                  <button className={selectedPage?.id === root.id ? "tree-btn active" : "tree-btn"} onClick={() => { setSelectedPageId(root.id); setViewMode("page"); }}>📄 {root.title}</button>
                  <button className="ghost icon" onClick={() => toggleFavorite(root.id)}>{favorites[root.id] ? "⭐" : "☆"}</button>
                </div>
                {!collapsedTree[root.id] && children(root.id).length > 0 && (
                  <ul>
                    {children(root.id).map((child) => (
                      <li key={child.id} draggable onDragStart={() => startDrag(child.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(child.id)}>
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
      )}

      <main className="hwiki-main">
        {actionInfo && <div className="inline-info">{actionInfo}</div>}

        {viewMode === "dashboard" && (
          <section className="card">
            <h2>{selectedSpace.name} Dashboard</h2>
            <div className="dashboard-grid">
              <article>
                <h4>Recently viewed</h4>
                <ul>{(dashboard?.recentPages ?? []).slice(0, 5).map((p) => <li key={p.id}>{p.title}</li>)}</ul>
              </article>
              <article>
                <h4>Recent updates</h4>
                <ul>{currentPages.slice(0, 5).map((p) => <li key={p.id}>{p.title}</li>)}</ul>
              </article>
              <article>
                <h4>Favorites</h4>
                <ul>{favoritePages.length ? favoritePages.map((p) => <li key={p.id}>{p.title}</li>) : <li>Keine Favoriten</li>}</ul>
              </article>
              <article>
                <h4>Activity Feed</h4>
                <p>{dashboard?.myCommentsCount ?? 0} Kommentare, {dashboard?.myPagesCount ?? 0} Seiten.</p>
              </article>
            </div>
          </section>
        )}

        {viewMode === "profile" && (
          <section className="card">
            <h2>User Profile</h2>
            <p>Name: Hokkaido Admin</p>
            <p>Rolle: {role}</p>
            <p>Beobachtete Seiten: {Object.values(watching).filter(Boolean).length}</p>
            <p>Favoriten: {Object.values(favorites).filter(Boolean).length}</p>
          </section>
        )}

        {viewMode === "user-settings" && (
          <section className="card">
            <h2>User Settings</h2>
            <div className="create-form">
              <input value="Hokkaido Admin" readOnly />
              <input value="HK" readOnly />
              <button onClick={() => setActionInfo("User Settings gespeichert (lokal)")}>Speichern</button>
            </div>
          </section>
        )}

        {viewMode === "space-settings" && (
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
                <button className="ghost" disabled={role === "Viewer" || !selectedPage} onClick={startEdit}>Edit</button>
                <button className="ghost" disabled={!selectedPage} onClick={sharePage}>Share</button>
                <button className="ghost" disabled={!selectedPage} onClick={() => selectedPage && toggleWatch(selectedPage.id)}>{selectedPage && watching[selectedPage.id] ? "Watching" : "Watch"}</button>
                <button className="ghost" onClick={() => setShowRightSidebar((v) => !v)}>{showRightSidebar ? "Hide" : "Show"} Info</button>
                <div className="menu-wrap">
                  <button className="ghost" onClick={() => setShowMoreMenu((v) => !v)}>…</button>
                  {showMoreMenu && (
                    <div className="menu-dropdown">
                      <button onClick={duplicatePage}>Copy</button>
                      <button onClick={() => { setShowHistory(true); setShowMoreMenu(false); }}>Page History</button>
                      <button onClick={deletePage}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="card content-view" onMouseUp={captureSelection}>
              {!selectedPage && <p>Wähle eine Seite aus dem Baum oder erstelle eine neue Seite.</p>}
              {selectedPage && !isEditing && (
                <>
                  <small className="muted">Updated: {new Date(selectedPage.updatedAt).toLocaleString()}</small>
                  <div className="rendered-content" dangerouslySetInnerHTML={{ __html: selectedPage.content }} />
                </>
              )}
              {selectedPage && isEditing && (
                <>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <RichEditor initialValue={editContent} onChange={setEditContent} />
                  <div className="modal-actions">
                    <button className="ghost" onClick={() => setIsEditing(false)}>Abbrechen</button>
                    <button onClick={saveEdit}>Speichern</button>
                  </div>
                </>
              )}
              <div className="page-meta">
                <span>{selectedPage && favorites[selectedPage.id] ? "⭐ Favorit" : "☆ Kein Favorit"}</span>
                <span>{selectedPage && watching[selectedPage.id] ? "Watching: on" : "Watching: off"}</span>
                <span>Versionen: {selectedPage ? (versionHistory[selectedPage.id]?.length ?? 0) : 0}</span>
              </div>
            </section>

            {selectedPage && (
              <section className="card">
                <h3>Kommentare</h3>
                {selectedText && <p className="muted">Inline-Kommentar auf: "{selectedText}"</p>}
                {replyTarget && <p className="muted">Antwort auf Kommentar: {replyTarget}</p>}
                <form onSubmit={addComment} className="create-form">
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Kommentar schreiben..." required />
                  {mentions.length > 0 && (
                    <div className="mention-box">
                      {mentions.map((m) => <button type="button" className="ghost" key={m} onClick={() => applyMention(m)}>@{m}</button>)}
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
            )}
          </>
        )}
      </main>

      {showRightSidebar && (
        <aside className="hwiki-rightbar">
          <section>
            <h4>Table of Contents</h4>
            <ul>{toc.length ? toc.map((h, i) => <li key={`${h.text}-${i}`} className={`toc-l${h.level}`}>{h.text}</li>) : <li>Keine Überschriften</li>}</ul>
          </section>
          <section>
            <h4>Page Info</h4>
            <p>Space: {selectedSpace.name}</p>
            <p>Role: {role}</p>
            <p>Last update: {selectedPage ? new Date(selectedPage.updatedAt).toLocaleString() : "-"}</p>
          </section>
          <section>
            <h4>Attachments</h4>
            <p>Bilder aus dem Editor werden direkt in der Seite angezeigt.</p>
          </section>
          <section>
            <h4>Properties</h4>
            <p>Favorit: {selectedPage && favorites[selectedPage.id] ? "Ja" : "Nein"}</p>
            <p>Watching: {selectedPage && watching[selectedPage.id] ? "Ja" : "Nein"}</p>
          </section>
        </aside>
      )}

      {showHistory && selectedPage && (
        <div className="modal-overlay">
          <div className="modal-card large">
            <div className="modal-title-row"><h3>Version History</h3><button type="button" className="ghost" onClick={() => setShowHistory(false)}>Schließen</button></div>
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
                <h4>Diff</h4>
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
        <div className="modal-overlay">
          <div className="modal-card large">
            <div className="modal-title-row"><h3>{createType === "space" ? "Create Space" : createType === "blog" ? "Create Blog" : "Create Page"}</h3><button type="button" className="ghost" onClick={() => setShowCreateModal(false)}>Schließen</button></div>
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
                <button type="submit" disabled={isCreating}>{isCreating ? "Erstelle..." : "Erstellen"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
