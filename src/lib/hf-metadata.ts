import {
  estimateMemoryFromFileSize,
  estimateMemoryFromParams,
  inferArchitectureKind,
  inferParamsFromBytes,
  inferParamsFromSafetensors,
  inferParamsFromText,
  inferTensorTypeFromFilename,
  normalizeTensorType,
  pickPrimaryProfile,
  type HFConfidence,
  type HFEstimateProfile,
  type HFNormalizedModel,
  type HFTensorType,
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
  safetensors?: {
    total?: number;
    parameters?: Record<string, number>;
  };
  usedStorage?: number;
}

interface HFRepoContext {
  repoId: string;
  canonicalUrl: string;
  repoInfo: HFModelInfo;
  config: Record<string, unknown> | null;
}

interface DerivedEstimate {
  repoId: string;
  canonicalUrl: string;
  displayName: string;
  architecture: HFNormalizedModel["architecture"];
  rawArchitecture: string | null;
  paramsBillions: number | null;
  tensorType: HFTensorType;
  contextLength: number | null;
  license: string | null;
  confidence: HFConfidence;
  notes: string[];
  profiles: HFEstimateProfile[];
  usedStorageGB: number | null;
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

function getStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
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

function bytesToGB(sizeBytes: number | null | undefined): number | null {
  if (!Number.isFinite(sizeBytes) || !sizeBytes || sizeBytes <= 0) return null;
  return Math.round((sizeBytes / (1024 ** 3)) * 10) / 10;
}

function normalizeBaseModelId(value: unknown): string | null {
  if (typeof value === "string" && value.includes("/")) {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = normalizeBaseModelId(item);
      if (resolved) return resolved;
    }
  }

  return null;
}

function isAdapterRepo(repoInfo: HFModelInfo, parsedRepoId: string): boolean {
  const repoText = [
    parsedRepoId,
    repoInfo.pipeline_tag,
    ...getStringList(repoInfo.tags),
    getString(repoInfo.cardData?.base_model),
    getString(repoInfo.cardData?.model_name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return repoText.includes("lora") || repoText.includes("adapter");
}

function inferTensorTypeFromRepoInfo(repoInfo: HFModelInfo): HFTensorType {
  const text = [
    ...getStringList(repoInfo.tags),
    ...(repoInfo.siblings || []).map((sibling) => sibling.rfilename || ""),
  ]
    .join(" ")
    .toLowerCase();

  const explicit = normalizeTensorType(text);
  if (explicit !== "unknown") return explicit;

  if (text.includes(".pth") || text.includes(".pt")) {
    return "f32";
  }

  if (text.includes(".safetensors") || text.includes("safetensors")) {
    return "bf16";
  }

  return "unknown";
}

async function fetchRepoContext(repoId: string, revision: string | null): Promise<HFRepoContext | null> {
  const repoInfo = await fetchJson<HFModelInfo>(`https://huggingface.co/api/models/${repoId}`);
  if (!repoInfo) return null;

  const config = await fetchJson<Record<string, unknown>>(
    `https://huggingface.co/${repoId}/raw/${revision || "main"}/config.json`,
  );

  return {
    repoId,
    canonicalUrl: `https://huggingface.co/${repoId}`,
    repoInfo,
    config,
  };
}

function deriveEstimate(context: HFRepoContext): DerivedEstimate {
  const { repoId, canonicalUrl, repoInfo, config } = context;

  const rawArchitecture =
    getString(config?.architectures instanceof Array ? config.architectures[0] : null) ||
    getString(config?.model_type) ||
    getString(repoInfo.config?.architectures instanceof Array ? repoInfo.config.architectures[0] : null) ||
    getString(repoInfo.config?.model_type) ||
    getString(repoInfo.pipeline_tag);

  const contextLength =
    getNumber(config?.max_position_embeddings) ||
    getNumber(config?.n_positions) ||
    getNumber(config?.seq_length) ||
    getNumber(config?.model_max_length);

  const repoText = [
    repoId,
    rawArchitecture,
    ...getStringList(repoInfo.tags),
    normalizeBaseModelId(repoInfo.cardData?.base_model),
    getString(repoInfo.cardData?.model_name),
  ]
    .filter(Boolean)
    .join(" ");

  const textParamsBillions = inferParamsFromText(repoText);
  const safetensorsEstimate = inferParamsFromSafetensors(repoInfo.safetensors?.parameters);
  const repoTensor = inferTensorTypeFromRepoInfo(repoInfo);

  const configTensor = preferKnownString(
    safetensorsEstimate.tensorType,
    normalizeTensorType(getString(config?.torch_dtype)),
    normalizeTensorType(getString(repoInfo.config?.torch_dtype)),
    repoTensor,
  );

  const paramsBillions =
    safetensorsEstimate.paramsBillions ||
    textParamsBillions ||
    inferParamsFromBytes(repoInfo.usedStorage || 0, configTensor);
  const usedStorageFallback = !safetensorsEstimate.paramsBillions && !textParamsBillions && Boolean(paramsBillions);
  const tensorFallbackFromRepo = repoTensor !== "unknown" && !getString(config?.torch_dtype) && !getString(repoInfo.config?.torch_dtype);

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
          if ((lower.endsWith(".pth") || lower.endsWith(".pt")) && sibling.size) {
            return estimateMemoryFromFileSize(label, "f32", sibling.size);
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

  if (safetensorsEstimate.paramsBillions && configTensor !== "unknown") {
    confidence = profiles.some((profile) => profile.source === "filesize") ? "exact" : "high";
  } else if (usedStorageFallback) {
    confidence = confidence === "low" ? "medium" : confidence;
  }

  if (profiles.some((profile) => profile.source === "filesize")) {
    notes.push("At least one estimate comes from actual file size metadata.");
  } else if (usedStorageFallback && repoTensor === "f32") {
    notes.push("Estimate derived from PyTorch checkpoint size with an F32 fallback.");
  } else if (safetensorsEstimate.paramsBillions && configTensor !== "unknown") {
    notes.push("Estimate derived from Hugging Face safetensors metadata.");
  } else if (usedStorageFallback && tensorFallbackFromRepo) {
    notes.push("Estimate derived from repository storage size with a BF16-style safetensors fallback.");
  } else if (usedStorageFallback) {
    notes.push("Estimate derived from repository storage size with low-confidence assumptions.");
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
    repoId,
    canonicalUrl,
    displayName: displayNameFromRepoId(repoId),
    architecture: inferArchitectureKind(rawArchitecture),
    rawArchitecture,
    paramsBillions,
    tensorType: configTensor,
    contextLength,
    license: getString(repoInfo.cardData?.license) || getString(repoInfo.config?.license),
    confidence,
    notes,
    profiles,
    usedStorageGB: bytesToGB(repoInfo.usedStorage),
  };
}

export async function fetchAndNormalizeHfModel(input: string): Promise<HFNormalizedModel | null> {
  const parsed = parseHuggingFaceUrl(input);
  if (!parsed) return null;

  const repoContext = await fetchRepoContext(parsed.repoId, parsed.revision);
  if (!repoContext) return null;

  const ownEstimate = deriveEstimate(repoContext);
  const baseModelId = normalizeBaseModelId(repoContext.repoInfo.cardData?.base_model);

  if (!isAdapterRepo(repoContext.repoInfo, parsed.repoId) || !baseModelId || baseModelId === parsed.repoId) {
    return {
      ...ownEstimate,
      modelKind: "full",
      runtimeRepoId: null,
      runtimeDisplayName: null,
      adapterDiskGB: null,
    };
  }

  const baseContext = await fetchRepoContext(baseModelId, null);
  if (!baseContext) {
    return {
      ...ownEstimate,
      modelKind: "adapter",
      runtimeRepoId: baseModelId,
      runtimeDisplayName: displayNameFromRepoId(baseModelId),
      adapterDiskGB: ownEstimate.usedStorageGB,
      notes: [
        `Adapter repo detected. This artifact likely needs base model ${baseModelId} at runtime.`,
        ...(ownEstimate.usedStorageGB ? [`Adapter files are about ${ownEstimate.usedStorageGB} GB on disk.`] : []),
        ...ownEstimate.notes,
      ],
    };
  }

  const baseEstimate = deriveEstimate(baseContext);
  const mergedNotes = [
    `Adapter repo detected. Runtime estimate uses base model ${baseModelId}.`,
    ...(ownEstimate.usedStorageGB ? [`Adapter files are about ${ownEstimate.usedStorageGB} GB on disk.`] : []),
    ...baseEstimate.notes,
  ];

  return {
    repoId: ownEstimate.repoId,
    canonicalUrl: ownEstimate.canonicalUrl,
    displayName: ownEstimate.displayName,
    modelKind: "adapter",
    runtimeRepoId: baseEstimate.repoId,
    runtimeDisplayName: baseEstimate.displayName,
    architecture: baseEstimate.architecture,
    rawArchitecture: baseEstimate.rawArchitecture,
    paramsBillions: baseEstimate.paramsBillions,
    tensorType: baseEstimate.tensorType,
    contextLength: baseEstimate.contextLength,
    license: ownEstimate.license || baseEstimate.license,
    adapterDiskGB: ownEstimate.usedStorageGB,
    confidence: baseEstimate.confidence,
    notes: mergedNotes,
    profiles: baseEstimate.profiles.map((profile) => ({
      ...profile,
      label: `${profile.label} (${baseEstimate.displayName})`,
    })),
  };
}
