import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { PageList, type Page } from "../components/PageList";

type Props = { token: string };

export function HomePage({ token }: Props) {
  const [pages, setPages] = useState<Page[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function loadPages() {
    const data = await apiFetch<Page[]>("/pages", {}, token);
    setPages(data);
  }

  useEffect(() => {
    loadPages().catch(console.error);
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
    await loadPages();
  }

  return (
    <div>
      <h2>Seiten</h2>
      <form onSubmit={createPage} style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        <input placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Inhalt (Markdown)" value={content} onChange={(e) => setContent(e.target.value)} required />
        <button type="submit">Seite erstellen</button>
      </form>
      <PageList pages={pages} />
    </div>
  );
}
