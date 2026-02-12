export type Page = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type Props = {
  pages: Page[];
};

export function PageList({ pages }: Props) {
  return (
    <ul>
      {pages.map((page) => (
        <li key={page.id} style={{ marginBottom: 16 }}>
          <h3>{page.title}</h3>
          <small>Updated: {new Date(page.updatedAt).toLocaleString()}</small>
          <pre style={{ whiteSpace: "pre-wrap" }}>{page.content}</pre>
        </li>
      ))}
    </ul>
  );
}
