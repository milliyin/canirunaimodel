import {
  estimateMemoryFromFileSize,
  estimateMemoryFromParams,
  inferArchitectureKind,
  inferParamsFromText,
  inferTensorTypeFromFilename,
  normalizeTensorType,
  pickPrimaryProfile,
  type HFConfidence,
  type HFNormalizedModel,
} from "@/lib/hf-estimation";
import { parseHuggingFaceUrl } from "@/lib/hf-url";

interface HFSibling {
  rfilename?: string;
  size?: number;
}

interface HFModelInfo {
  id?: string;
  pipeline_tag?: string;
  tags?: string[];
  siblings?: HFSibling[];
  config?: Record<string, unknown>;
  cardData?: Record<string, unknown>;
}

function preferKnownString<T extends string>(...values: T[]): T {
  for (const value of values) {
    if (value !== "unknown") return value;
  }
  return values[0];
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function displayNameFromRepoId(repoId: string): string {
  return repoId.split("/")[1]?.replace(/[-_]+/g, " ") || repoId;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function uniqueProfiles<T extends { label: string }>(profiles: T[]): T[] {
  const seen = new Set<string>();
  return profiles.filter((profile) => {
    const key = profile.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchAndNormalizeHfModel(input: string): Promise<HFNormalizedModel | null> {
  const parsed = parseHuggingFaceUrl(input);
  if (!parsed) return null;

  const repoInfo = await fetchJson<HFModelInfo>(
    `https://huggingface.co/api/models/${parsed.repoId}`,
  );
  if (!repoInfo) return null;

  const revision = parsed.revision || "main";
  const config = await fetchJson<Record<string, unknown>>(
    `https://huggingface.co/${parsed.repoId}/raw/${revision}/config.json`,
  );

  const rawArchitecture =
    getString(config?.architectures instanceof Array ? config.architectures[0] : null) ||
    getString(config?.model_type) ||
    getString(repoInfo.config?.architectures instanceof Array ? repoInfo.config.architectures[0] : null) ||
    getString(repoInfo.config?.model_type);

  const contextLength =
    getNumber(config?.max_position_embeddings) ||
    getNumber(config?.n_positions) ||
    getNumber(config?.seq_length) ||
    getNumber(config?.model_max_length);

  const repoText = [
    parsed.repoId,
    rawArchitecture,
    ...(repoInfo.tags || []),
    getString(repoInfo.cardData?.base_model),
    getString(repoInfo.cardData?.model_name),
  ]
    .filter(Boolean)
    .join(" ");

  const paramsBillions = inferParamsFromText(repoText);

  const configTensor = preferKnownString(
    normalizeTensorType(getString(config?.torch_dtype)),
    normalizeTensorType(getString(repoInfo.config?.torch_dtype)),
  );

  const profiles = uniqueProfiles(
    (repoInfo.siblings || [])
      .map((sibling) => {
        const filename = sibling.rfilename || "";
        const tensorType = inferTensorTypeFromFilename(filename);
        const label = filename.split("/").pop() || filename;
        if (tensorType === "unknown") {
          const lower = filename.toLowerCase();
          if ((lower.endsWith(".safetensors") || lower.endsWith(".bin")) && sibling.size) {
            return estimateMemoryFromFileSize(label, "bf16", sibling.size);
          }
          return null;
        }
        if (sibling.size) {
          return estimateMemoryFromFileSize(label, tensorType, sibling.size);
        }
        if (paramsBillions) {
          const fallback = estimateMemoryFromParams(paramsBillions, tensorType);
          return fallback ? { ...fallback, label, source: "filename" as const, diskGB: null } : null;
        }
        return null;
      })
      .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile)),
  );

  const nativeProfile =
    paramsBillions && configTensor !== "unknown"
      ? estimateMemoryFromParams(paramsBillions, configTensor)
      : null;
  if (nativeProfile) profiles.unshift({ ...nativeProfile, label: `Native ${configTensor.toUpperCase()}` });

  if (paramsBillions && profiles.length === 0) {
    const fallbackNative = estimateMemoryFromParams(paramsBillions, configTensor === "unknown" ? "bf16" : configTensor);
    const fallbackQ4 = estimateMemoryFromParams(paramsBillions, "q4");
    if (fallbackNative) {
      profiles.push({
        ...fallbackNative,
        label: configTensor === "unknown" ? "Fallback BF16" : `Native ${configTensor.toUpperCase()}`,
        source: "config",
      });
    }
    if (fallbackQ4) {
      profiles.push({
        ...fallbackQ4,
        label: "Estimated Q4",
        source: "config",
      });
    }
  }

  const notes: string[] = [];
  let confidence: HFConfidence = "low";

  if (paramsBillions) {
    confidence = "medium";
  } else {
    notes.push("Could not determine parameter count exactly. Estimates may be unavailable.");
  }

  if (rawArchitecture) {
    confidence = confidence === "low" ? "medium" : confidence;
  } else {
    notes.push("Architecture inferred weakly from tags or repo naming.");
  }

  if (nativeProfile || profiles.some((profile) => profile.source === "filesize")) {
    confidence = nativeProfile && profiles.some((profile) => profile.source === "filesize") ? "high" : confidence;
  }

  if (profiles.some((profile) => profile.source === "filesize")) {
    notes.push("At least one estimate comes from actual file size metadata.");
  } else if (paramsBillions && configTensor !== "unknown") {
    notes.push("Estimate derived from config parameter count and tensor dtype.");
  } else if (paramsBillions && profiles.length > 0) {
    notes.push("Estimate derived from parameter count with fallback assumptions for missing tensor metadata.");
  }

  const primary = pickPrimaryProfile(profiles);
  if (!primary && paramsBillions) {
    notes.push("Metadata found, but tensor type was unclear.");
  }

  return {
    repoId: parsed.repoId,
    canonicalUrl: parsed.canonicalUrl,
    displayName: displayNameFromRepoId(parsed.repoId),
    architecture: inferArchitectureKind(rawArchitecture),
    rawArchitecture,
    paramsBillions,
    tensorType: configTensor,
    contextLength,
    license: getString(repoInfo.cardData?.license) || getString(repoInfo.config?.license),
    confidence,
    notes,
    profiles,
  };
}
