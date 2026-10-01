export function readPage() {
  const title = document.title;
  const text = document.body?.innerText?.slice(0, 22000) ?? "";

  const tables = [...document.querySelectorAll("table")].slice(0, 10).map(
    (table, index) => {
      const rows = [...table.querySelectorAll("tr")].slice(0, 100).map(
        row => [...row.querySelectorAll("th, td")].map(
          cell => cell.innerText.trim()
        ).join(" | ")
      );
      return `Table ${index + 1}:\n${rows.join("\n")}`;
    }
  );

  return {
    url: location.href,
    content: `Title: ${title}\n\n${text}\n\n${tables.join("\n\n")}`.slice(0, 30000)
  };
}
