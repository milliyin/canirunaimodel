export type HFTensorType =
  | "f32"
  | "f16"
  | "bf16"
  | "fp8"
  | "int8"
  | "q8"
  | "q6"
  | "q5"
  | "q4"
  | "q3"
  | "q2"
  | "unknown";

export type HFArchitectureKind = "dense" | "moe" | "unknown";
export type HFConfidence = "exact" | "high" | "medium" | "low";

export interface HFEstimateProfile {
  label: string;
  tensorType: HFTensorType;
  source: "config" | "filename" | "filesize";
  estimatedVRAMGB: number;
  estimatedRAMGB: number;
  diskGB: number | null;
}

export interface HFNormalizedModel {
  repoId: string;
  canonicalUrl: string;
  displayName: string;
  architecture: HFArchitectureKind;
  rawArchitecture: string | null;
  paramsBillions: number | null;
  tensorType: HFTensorType;
  contextLength: number | null;
  license: string | null;
  confidence: HFConfidence;
  notes: string[];
  profiles: HFEstimateProfile[];
}

type HFSafetensorsParameterMap = Partial<Record<string, number>>;

const BYTES_PER_PARAM: Record<HFTensorType, number | null> = {
  f32: 4,
  f16: 2,
  bf16: 2,
  fp8: 1,
  int8: 1,
  q8: 1,
  q6: 0.75,
  q5: 0.625,
  q4: 0.5,
  q3: 0.4375,
  q2: 0.3125,
  unknown: null,
};

const RUNTIME_OVERHEAD_GB = 0.5;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function normalizeTensorType(input: string | null | undefined): HFTensorType {
  const value = (input || "").toLowerCase();
  if (!value) return "unknown";
  if (value.includes("float32") || value === "f32" || value === "fp32") return "f32";
  if (value.includes("bfloat16") || value === "bf16") return "bf16";
  if (value.includes("float16") || value === "f16" || value === "fp16" || value === "half") return "f16";
  if (value.includes("fp8") || value.includes("float8")) return "fp8";
  if (value.includes("int8") || value === "8bit") return "int8";
  if (value.includes("q8")) return "q8";
  if (value.includes("q6")) return "q6";
  if (value.includes("q5")) return "q5";
  if (value.includes("q4")) return "q4";
  if (value.includes("q3")) return "q3";
  if (value.includes("q2")) return "q2";
  return "unknown";
}

export function inferParamsFromBytes(
  totalBytes: number,
  tensorType: HFTensorType,
): number | null {
  const bytesPerParam = BYTES_PER_PARAM[tensorType];
  if (!bytesPerParam || !Number.isFinite(totalBytes) || totalBytes <= 0) return null;
  return round1(totalBytes / bytesPerParam / 1_000_000_000);
}

export function inferParamsFromSafetensors(
  parameters: HFSafetensorsParameterMap | null | undefined,
): { paramsBillions: number | null; tensorType: HFTensorType } {
  if (!parameters || typeof parameters !== "object") {
    return { paramsBillions: null, tensorType: "unknown" };
  }

  let totalParams = 0;
  let dominantTensorType: HFTensorType = "unknown";
  let dominantParams = 0;

  for (const [rawTensorType, rawCount] of Object.entries(parameters)) {
    if (!Number.isFinite(rawCount) || rawCount <= 0) continue;
    totalParams += rawCount;
    const tensorType = normalizeTensorType(rawTensorType);
    if (rawCount > dominantParams && tensorType !== "unknown") {
      dominantParams = rawCount;
      dominantTensorType = tensorType;
    }
  }

  if (totalParams <= 0) {
    return { paramsBillions: null, tensorType: dominantTensorType };
  }

  return {
    paramsBillions: round1(totalParams / 1_000_000_000),
    tensorType: dominantTensorType,
  };
}

export function inferArchitectureKind(rawArchitecture: string | null | undefined): HFArchitectureKind {
  const value = (rawArchitecture || "").toLowerCase();
  if (!value) return "unknown";
  if (value.includes("moe") || value.includes("mixtral") || value.includes("dbrx") || value.includes("jamba")) {
    return "moe";
  }
  return "dense";
}

export function estimateMemoryFromParams(
  paramsBillions: number,
  tensorType: HFTensorType,
): HFEstimateProfile | null {
  const bytesPerParam = BYTES_PER_PARAM[tensorType];
  if (!bytesPerParam || paramsBillions <= 0) return null;

  const totalParams = paramsBillions * 1_000_000_000;
  const rawGB = (totalParams * bytesPerParam) / (1024 ** 3);
  const estimatedVRAMGB = round1(Math.max(rawGB * 1.1 + RUNTIME_OVERHEAD_GB, 0.5));
  const estimatedRAMGB = round1(Math.max(estimatedVRAMGB * 1.25, estimatedVRAMGB + 1));

  return {
    label: tensorType.toUpperCase(),
    tensorType,
    source: "config",
    estimatedVRAMGB,
    estimatedRAMGB,
    diskGB: round1(Math.max(rawGB, 0.1)),
  };
}

export function estimateMemoryFromFileSize(
  label: string,
  tensorType: HFTensorType,
  sizeBytes: number,
): HFEstimateProfile | null {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return null;
  const diskGB = sizeBytes / (1024 ** 3);
  const estimatedVRAMGB = round1(Math.max(diskGB * 1.08 + RUNTIME_OVERHEAD_GB, 0.5));
  const estimatedRAMGB = round1(Math.max(estimatedVRAMGB * 1.2, estimatedVRAMGB + 1));
  return {
    label,
    tensorType,
    source: "filesize",
    estimatedVRAMGB,
    estimatedRAMGB,
    diskGB: round1(diskGB),
  };
}

export function inferTensorTypeFromFilename(name: string): HFTensorType {
  const value = name.toLowerCase();
  if (value.includes("q8")) return "q8";
  if (value.includes("q6")) return "q6";
  if (value.includes("q5")) return "q5";
  if (value.includes("q4")) return "q4";
  if (value.includes("q3")) return "q3";
  if (value.includes("q2")) return "q2";
  if (value.includes("bf16")) return "bf16";
  if (value.includes("f16") || value.includes("fp16")) return "f16";
  if (value.includes("fp8")) return "fp8";
  if (value.includes("int8")) return "int8";
  if (value.includes("f32") || value.includes("fp32")) return "f32";
  return "unknown";
}

export function inferParamsFromText(text: string | null | undefined): number | null {
  const value = text || "";
  if (!value) return null;

  const moeMatch = value.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)b/i);
  if (moeMatch) {
    const experts = Number(moeMatch[1]);
    const perExpert = Number(moeMatch[2]);
    if (Number.isFinite(experts) && Number.isFinite(perExpert)) {
      return round1(experts * perExpert);
    }
  }

  const bMatch = value.match(/(\d+(?:\.\d+)?)\s*b\b/i);
  if (bMatch) {
    const params = Number(bMatch[1]);
    if (Number.isFinite(params)) return round1(params);
  }

  const mMatch = value.match(/(\d+(?:\.\d+)?)\s*m\b/i);
  if (mMatch) {
    const params = Number(mMatch[1]) / 1000;
    if (Number.isFinite(params)) return round1(params);
  }

  return null;
}

export function pickPrimaryProfile(profiles: HFEstimateProfile[]): HFEstimateProfile | null {
  if (profiles.length === 0) return null;
  const q4 = profiles.find((profile) => profile.tensorType === "q4");
  if (q4) return q4;
  const native = profiles.find((profile) => profile.source === "config");
  if (native) return native;
  return [...profiles].sort((a, b) => a.estimatedVRAMGB - b.estimatedVRAMGB)[0] || null;
}
