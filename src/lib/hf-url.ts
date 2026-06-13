export interface ParsedHuggingFaceUrl {
  input: string;
  canonicalUrl: string;
  repoId: string;
  revision: string | null;
  filePath: string | null;
}

const HF_HOSTS = new Set(["huggingface.co", "www.huggingface.co", "hf.co", "www.hf.co"]);

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

export function parseHuggingFaceUrl(input: string): ParsedHuggingFaceUrl | null {
  const raw = input.trim();
  if (!raw) return null;

  let normalized = raw;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }

  if (!HF_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const parts = trimSlashes(url.pathname).split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const name = parts[1];
  if (!owner || !name) return null;

  let revision: string | null = null;
  let filePath: string | null = null;

  if (parts[2] === "tree" || parts[2] === "blob" || parts[2] === "resolve" || parts[2] === "raw") {
    revision = parts[3] || null;
    filePath = parts.slice(4).join("/") || null;
  }

  const repoId = `${owner}/${name}`;
  return {
    input: raw,
    canonicalUrl: `https://huggingface.co/${repoId}`,
    repoId,
    revision,
    filePath,
  };
}
