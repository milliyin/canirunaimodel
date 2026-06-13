import { describe, expect, it } from "vitest";
import {
  estimateMemoryFromFileSize,
  estimateMemoryFromParams,
  inferArchitectureKind,
  inferParamsFromText,
  inferTensorTypeFromFilename,
  normalizeTensorType,
  pickPrimaryProfile,
} from "../src/lib/hf-estimation";

describe("hf estimation helpers", () => {
  it("normalizes tensor types", () => {
    expect(normalizeTensorType("bfloat16")).toBe("bf16");
    expect(normalizeTensorType("float16")).toBe("f16");
    expect(normalizeTensorType("Q4_K_M")).toBe("q4");
  });

  it("infers params from common repo names", () => {
    expect(inferParamsFromText("Qwen2.5-7B-Instruct")).toBe(7);
    expect(inferParamsFromText("Mixtral-8x7B-Instruct")).toBe(56);
    expect(inferParamsFromText("TinyLlama-1100M")).toBe(1.1);
  });

  it("infers tensor type from filenames", () => {
    expect(inferTensorTypeFromFilename("model-q4_k_m.gguf")).toBe("q4");
    expect(inferTensorTypeFromFilename("weights-bf16.safetensors")).toBe("bf16");
  });

  it("estimates memory from params", () => {
    const result = estimateMemoryFromParams(8, "bf16");
    expect(result).not.toBeNull();
    expect(result!.estimatedVRAMGB).toBeGreaterThan(15);
    expect(result!.estimatedRAMGB).toBeGreaterThan(result!.estimatedVRAMGB);
  });

  it("estimates memory from file size", () => {
    const result = estimateMemoryFromFileSize("model-q4.gguf", "q4", 4 * 1024 ** 3);
    expect(result).not.toBeNull();
    expect(result!.estimatedVRAMGB).toBeGreaterThan(4);
  });

  it("detects moe architecture names", () => {
    expect(inferArchitectureKind("Qwen2MoeForCausalLM")).toBe("moe");
    expect(inferArchitectureKind("LlamaForCausalLM")).toBe("dense");
  });

  it("prefers q4 as primary profile", () => {
    const primary = pickPrimaryProfile([
      { label: "Native BF16", tensorType: "bf16", source: "config", estimatedVRAMGB: 16, estimatedRAMGB: 20, diskGB: 14 },
      { label: "model-q4.gguf", tensorType: "q4", source: "filesize", estimatedVRAMGB: 5, estimatedRAMGB: 7, diskGB: 4.5 },
    ]);
    expect(primary?.tensorType).toBe("q4");
  });

  it("supports fallback native estimate when dtype unknown", () => {
    const native = estimateMemoryFromParams(8, "bf16");
    const q4 = estimateMemoryFromParams(8, "q4");
    expect(native?.estimatedVRAMGB).toBeGreaterThan(q4?.estimatedVRAMGB || 0);
  });
});
