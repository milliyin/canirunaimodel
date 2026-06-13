<div align="center">

<img src="public/favicon.svg" alt="canirunaimodel" width="80" height="80" />

# canirunaimodel

**Check whether your hardware can run Hugging Face models locally in seconds.**

Paste a Hugging Face model URL, estimate VRAM and RAM needs, compare devices, and get a practical local-run verdict without installing the model first.

[Live site](https://canirunaimodel.vercel.app/) · [GitHub repo](https://github.com/milliyin/canirunaimodel)
</div>

---

## Overview

`canirunaimodel` is a Hugging Face focused compatibility checker built from the idea behind `canirun.ai`, but reshaped around modern model repos, adapters, and browser-based hardware detection.

The goal is simple:

- paste a Hugging Face repo URL
- detect the current device in the browser
- estimate the model footprint
- decide whether the model should run well, barely fit, or be too heavy

## What it does

- Accepts public Hugging Face model URLs and repo ids
- Fetches repo metadata and model hints from Hugging Face
- Detects browser-visible hardware such as GPU and RAM
- Estimates VRAM and RAM needs from parameter counts, tensor type, and file sizes
- Handles incomplete metadata with fallback estimation from checkpoint sizes
- Recognizes adapter and LoRA-style repos better than a simple raw file-size check
- Compares two devices against the same Hugging Face model on one page
- Includes a built-in model library for quick browsing and comparison

## Why this exists

Running models locally is great for privacy, control, offline use, and avoiding API costs, but most people still get blocked by one question:

**Will this model actually run on my machine?**

This project tries to answer that before download time.

Useful questions it helps with:

- Can my laptop run this Hugging Face model?
- Is this repo a small adapter or a much larger full model?
- Which of two devices is the better fit for the same model?
- Is the fit comfortable, tight, or unrealistic?

## How it works

```text
Hugging Face URL
  -> repo metadata
  -> parameter + tensor + file-size estimation
  -> browser hardware detection
  -> memory + speed scoring
  -> verdict
```

High-level flow:

1. The app accepts a Hugging Face repo URL or repo id.
2. It reads model metadata such as architecture hints, safetensors stats, config values, tags, and file sizes.
3. In the browser, it detects device capabilities using WebGL, WebGPU, and memory hints.
4. It estimates required VRAM and RAM.
5. It returns a verdict such as `Runs great`, `Tight fit`, or `Too heavy`.

## Main features

- `Check` page for any Hugging Face repo
- `Compare` page for Device A vs Device B on the same model
- Built-in library browsing when you do not want to paste a URL
- Fallback heuristics for repos with partial metadata
- Live deployment ready for SEO, Open Graph, sitemap, and canonical URLs

## Tech stack

- [Astro](https://astro.build/)
- TypeScript
- Browser hardware detection via Web APIs
- Hugging Face model metadata lookup
- Vercel for deployment

## Local development

Prerequisites:

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)

Run locally:

```bash
git clone https://github.com/milliyin/canirunaimodel.git
cd canirunaimodel
pnpm install
pnpm dev
```

Then open:

- `http://localhost:4321`

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the Astro dev server |
| `pnpm build` | Build the production site |
| `pnpm preview` | Preview the production build locally |
| `pnpm scrape` | Refresh scraped model metadata |
| `pnpm fetch:readmes` | Refresh imported README content |

## Gradio wrappers

This repo currently has two Gradio-related setups:

### `gradio/`

A tracked Python Gradio wrapper intended for sharing or publishing. It points at the live deployment:

- `https://canirunaimodel.vercel.app/`

Run it with:

```bash
cd gradio
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
python app.py
```

### `gradio-fullscreen/`

A local-only fullscreen wrapper for:

- `https://canirunaimodel.vercel.app/check`

It is intentionally gitignored and keeps the UI minimal:

- a small clickable header link
- the `/check` page embedded fullscreen

## Project structure

```text
src/        Astro pages, components, layouts, and core app logic
public/     Static assets such as favicon and images
packages/   Internal packages used by the project
scripts/    Data and utility scripts
tests/      Test files and related fixtures
gradio/     Tracked Gradio wrapper for the live site
```

## Deployment and SEO

The live site is currently deployed at:

- `https://canirunaimodel.vercel.app/`

For production, set:

```bash
PUBLIC_SITE_URL=https://canirunaimodel.vercel.app
```

If you later move to a custom domain, update `PUBLIC_SITE_URL` so canonical URLs, sitemap generation, Open Graph URLs, and structured data all stay aligned with the real public domain.

## Credits

Originally inspired by [midudev/canirun.ai](https://github.com/midudev/canirun.ai), then expanded here around Hugging Face model compatibility checks and device-vs-device comparisons.

Made by [milliyin](https://milliyin.dev/).

## License

MIT
