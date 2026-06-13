<div align="center">

<img src="public/favicon.svg" alt="canirunaimodel" width="80" height="80" />

# canirunaimodel

**Check whether your hardware can run AI models locally in seconds.**

Your browser detects your CPU, RAM, and GPU automatically.\
No installs, no benchmarks, no guesswork.

[**Source Project**](https://github.com/midudev/canirun.ai)

</div>

---

## Why

Cloud AI APIs are expensive, rate-limited, and send your data to third parties. Running models locally gives you privacy, speed, and zero cost per token, but only if your hardware is up to the job.

`canirunaimodel` answers that question instantly. Open the site, let it detect your hardware, and see a personalized compatibility report for open-weight models with simple verdicts and quantization-aware estimates.

## How It Works

```text
Browser APIs -> Hardware Detection -> Model Matching -> Personalized Grades
```

1. Hardware detection runs entirely client-side using WebGL, WebGPU, `navigator.deviceMemory`, and a lightweight CPU micro-benchmark.
2. Each model's VRAM requirements are calculated across multiple quantization levels from parameter count.
3. A scoring algorithm combines run status, estimated tokens/second, memory headroom, and model size into a letter grade.
4. Results are displayed instantly.

## Features

- Zero-install hardware detection for CPU, RAM, GPU, VRAM, and memory bandwidth
- Large built-in model catalog with quantization-aware estimates
- Letter-grade verdicts from strong fit to too heavy
- Tokens/second estimates based on memory bandwidth
- Filters for task, provider, and architecture
- Model detail pages with install links and quant tables
- Astro-based static site with generated metadata and OG images

## Getting Started

**Prerequisites:** [Node.js](https://nodejs.org) 18+ and [pnpm](https://pnpm.io)

```bash
git clone https://github.com/<your-account>/canirunaimodel.git
cd canirunaimodel
pnpm install
pnpm dev
```

Open [localhost:4321](http://localhost:4321) to see the site.

## Commands

| Command | Action |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build the production site |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run the test suite |

## Project Structure

```text
src/
packages/
public/
scripts/
tests/
```

## Credits

Based on [midudev/canirun.ai](https://github.com/midudev/canirun.ai).

## License

MIT
