<div align="center">

<img src="public/favicon.svg" alt="canirunaimodel" width="80" height="80" />

# canirunaimodel

**Check whether your hardware can run Hugging Face models locally in seconds.**

Paste a Hugging Face model URL or compare known models against your machine.\
No installs, no benchmarks, no guesswork.

[**GitHub Repo**](https://github.com/milliyin/canirunaimodel)
</div>

---

## What it does

`canirunaimodel` is a Hugging Face focused compatibility checker for local AI runs.

It can:

- detect your GPU, RAM, and browser-exposed hardware capabilities
- estimate whether a Hugging Face model repo will fit locally
- infer model size from repo metadata, dtype hints, and checkpoint sizes
- compare two devices side by side against the built-in model library
- explain the reasoning behind each verdict with memory and speed estimates

## Why

Running models locally gives you privacy, control, and no per-token API bill, but hardware limits are still the main blocker.

This project helps answer practical questions like:

- Can my laptop run this Hugging Face repo?
- Is this LoRA tiny or does it depend on a much bigger base model?
- Which of these two devices handles a model better?
- Is this a comfortable fit or a borderline one?

## How it works

```text
Hugging Face URL -> Repo metadata -> Footprint estimate -> Browser hardware detection -> Verdict
```

1. The app accepts a public Hugging Face model URL or repo id.
2. It reads repo metadata such as architecture hints, safetensors stats, file sizes, tags, and adapter clues.
3. In the browser, it detects your device using WebGL, WebGPU, and navigator memory hints.
4. It estimates VRAM and RAM needs, then returns a verdict like `Runs great`, `Tight fit`, or `Too heavy`.

## Features

- Hugging Face URL based model checks
- Browser-side hardware detection
- VRAM and RAM estimation from model metadata
- Fallback parameter estimation from checkpoint size when metadata is incomplete
- Better handling for adapters and LoRA-style repos
- Side-by-side device comparison page
- Gradio companion app for the live deployment
- SEO-ready Astro site with canonical tags, sitemap support, and social metadata

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org) 18+ and [pnpm](https://pnpm.io)

```bash
git clone https://github.com/milliyin/canirunaimodel.git
cd canirunaimodel
pnpm install
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321).

## Gradio app

A small Python Gradio wrapper lives in [`gradio/`](./gradio). It points at the live deployment:

- `https://canirunaimodel.vercel.app/`

Run it with:

```bash
cd gradio
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
python app.py
```

Then open the local Gradio URL shown in your terminal.

## Commands

| Command | Action |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build the production site |
| `pnpm preview` | Preview the production build locally |
| `pnpm scrape` | Refresh scraped model metadata |
| `pnpm fetch:readmes` | Refresh imported readme content |

## Project structure

```text
src/
packages/
public/
scripts/
tests/
gradio/
```

## SEO notes

The site now targets this project instead of the old upstream domain. For production SEO, set:

```bash
PUBLIC_SITE_URL=https://your-real-domain.example
```

That keeps canonical URLs, sitemap generation, Open Graph URLs, and structured data aligned with the deployed site.

## Credits

Originally inspired by [midudev/canirun.ai](https://github.com/midudev/canirun.ai), then reshaped here around Hugging Face model compatibility checks.

Made by [milliyin](https://milliyin.dev/).

## License

MIT
