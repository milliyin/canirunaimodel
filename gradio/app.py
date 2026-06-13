from __future__ import annotations

import html

import gradio as gr


SITE_URL = "https://canirunaimodel.vercel.app/"


def make_embed(url: str) -> str:
    safe_url = html.escape(url, quote=True)
    return f"""
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
        <a href="{safe_url}" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:999px;text-decoration:none;background:#111827;color:#fff;font-weight:600;">
          Open canirunaimodel
        </a>
        <span style="color:#4b5563;font-size:14px;">If the embed is blocked by your browser, use the button above.</span>
      </div>
      <iframe
        src="{safe_url}"
        title="canirunaimodel"
        style="width:100%;height:78vh;border:1px solid #d1d5db;border-radius:18px;background:#fff;"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
    """


with gr.Blocks(title="canirunaimodel", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
        # canirunaimodel
        Run the live Hugging Face compatibility site inside a small Gradio wrapper.

        This app points to:
        `https://canirunaimodel.vercel.app/`
        """
    )

    with gr.Row():
        url = gr.Textbox(
            label="Site URL",
            value=SITE_URL,
            interactive=False,
        )
        open_button = gr.Button("Reload embed", variant="primary")

    viewer = gr.HTML(value=make_embed(SITE_URL))

    open_button.click(fn=make_embed, inputs=url, outputs=viewer)


if __name__ == "__main__":
    demo.launch()
