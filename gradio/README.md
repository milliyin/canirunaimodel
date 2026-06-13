---
title: canirunaimodel
emoji: 🤖
colorFrom: yellow
colorTo: indigo
sdk: gradio
sdk_version: "5.34.0"
python_version: "3.10"
app_file: app.py
pinned: false
---

# Gradio wrapper

This folder contains a small Gradio app that embeds the live site:

- `https://canirunaimodel.vercel.app/`

## Run

```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
python app.py
```

If your browser blocks the embed, use the button inside the app to open the live site directly.
