import { describe, expect, it } from "vitest";
import { parseHuggingFaceUrl } from "../src/lib/hf-url";

describe("parseHuggingFaceUrl", () => {
  it("parses canonical hugging face repo url", () => {
    const result = parseHuggingFaceUrl("https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct");
    expect(result?.repoId).toBe("meta-llama/Llama-3.1-8B-Instruct");
    expect(result?.revision).toBeNull();
    expect(result?.filePath).toBeNull();
  });

  it("parses short hf.co url without protocol", () => {
    const result = parseHuggingFaceUrl("hf.co/Qwen/Qwen2.5-7B-Instruct");
    expect(result?.repoId).toBe("Qwen/Qwen2.5-7B-Instruct");
  });

  it("parses tree url with revision and file", () => {
    const result = parseHuggingFaceUrl("https://huggingface.co/google/gemma-2-2b-it/tree/main/subdir/file.gguf");
    expect(result?.repoId).toBe("google/gemma-2-2b-it");
    expect(result?.revision).toBe("main");
    expect(result?.filePath).toBe("subdir/file.gguf");
  });

  it("rejects non hugging face hosts", () => {
    expect(parseHuggingFaceUrl("https://example.com/model")).toBeNull();
  });
});
