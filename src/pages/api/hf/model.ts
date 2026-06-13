import type { APIRoute } from "astro";
import { fetchAndNormalizeHfModel } from "@/lib/hf-metadata";
import { pickPrimaryProfile } from "@/lib/hf-estimation";
import { parseHuggingFaceUrl } from "@/lib/hf-url";

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const input = url.searchParams.get("url") || url.searchParams.get("repo") || "";
  const parsed = parseHuggingFaceUrl(input);
  if (!parsed) {
    return json({ error: "invalid_huggingface_url" }, 400);
  }

  const model = await fetchAndNormalizeHfModel(input);
  if (!model) {
    return json({ error: "hf_metadata_unavailable" }, 502);
  }

  return json({
    model,
    primaryProfile: pickPrimaryProfile(model.profiles),
  });
};
