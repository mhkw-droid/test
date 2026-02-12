export type Page = { id: string; title: string; content: string; updatedAt: string };

export function PageList({ pages }: { pages: Page[] }) {
  return (
    <ul>
      {pages.map((p) => (
        <li key={p.id} style={{ marginBottom: 16 }}>
          <h3>{p.title}</h3>
          <small>{new Date(p.updatedAt).toLocaleString()}</small>
          <pre style={{ whiteSpace: "pre-wrap" }}>{p.content}</pre>
        </li>
      ))}
    </ul>
  );
}
