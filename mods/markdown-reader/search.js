export const isMarkdown = path => /\.(md|markdown|mdown|mkd|mdx)$/i.test(path);
export const clean = value => String(value || "").trim().replace(/^(["'])(.*)\1$/, "$2").replaceAll("\\", "/");

export function resolvePath(value, base, userHome) {
  let path = clean(value);
  if (/^~(?:\/|$)/.test(path) && userHome) path = userHome + path.slice(1);
  if (!/^(?:[A-Za-z]:\/|\/|~)/.test(path)) path = base.replace(/[\\/]$/, "") + "/" + path;
  const root = path.startsWith("//") ? "//" : path.startsWith("/") ? "/" : /^[A-Za-z]:\//.test(path) ? path.slice(0, 3) : "";
  const parts = [];
  for (const part of path.slice(root.length).split("/")) {
    if (!part || part === ".") continue;
    if (part === ".." && parts.length && parts[parts.length - 1] !== "..") parts.pop();
    else if (part !== ".." || !root) parts.push(part);
  }
  return root + parts.join("/");
}

export const isFolderQuery = query => clean(query).endsWith("/");

export function searchMatches(files, entries, query, prefix = "", limit = 50) {
  const candidates = new Map(files.map(entry => [entry.path, entry]));
  for (const entry of entries) {
    const path = prefix + entry.path;
    candidates.set(path, { ...entry, path });
  }
  return rankFiles([...candidates.values()], query, limit);
}

export function rankFiles(files, query, limit = 8) {
  const q = clean(query).toLowerCase().replace(/^\.\//, "");
  const scored = [];
  for (const entry of files) {
    const path = clean(entry.path), lower = path.toLowerCase();
    const name = lower.split("/").pop();
    let score = q ? -1 : (name === "readme.md" ? 200 : 0);
    if (q) {
      if (name === q) score = 1000;
      else if (name.startsWith(q)) score = 800 - name.length;
      else if (name.includes(q)) score = 600 - name.indexOf(q);
      else if (lower.includes(q)) score = 400 - lower.indexOf(q);
      else {
        let pos = -1, gaps = 0, matched = true;
        for (const ch of q) {
          const next = lower.indexOf(ch, pos + 1);
          if (next < 0) { matched = false; break; }
          gaps += next - pos - 1; pos = next;
        }
        if (matched) score = 200 - gaps;
      }
    }
    if (score >= 0) scored.push({ entry, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.entry.path.length - b.entry.path.length || a.entry.path.localeCompare(b.entry.path))
    .slice(0, limit).map(item => item.entry);
}
