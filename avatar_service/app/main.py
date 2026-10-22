"""Img2img avatar stylizer (SD-Turbo). Runs on CPU (slow, ~30-90 s) or CUDA. Model downloads on first request (~2 GB)."""
import io, os
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image

app = FastAPI(title="Neon-Pulse Avatar")
PROMPTS = {"neon": "cyberpunk neon portrait, red and black, glowing, pixel art style, high contrast",
           "pixel": "8-bit pixel art portrait, retro game character, limited palette",
           "synth": "synthwave 80s portrait, orange sunset glow, retro poster style"}
_pipe = None

def pipe():
    global _pipe
    if _pipe is None:
        from diffusers import AutoPipelineForImage2Image
        dev = "cuda" if torch.cuda.is_available() else "cpu"
        _pipe = AutoPipelineForImage2Image.from_pretrained(os.environ.get("AVATAR_MODEL", "stabilityai/sd-turbo"),
                                                          torch_dtype=torch.float16 if dev == "cuda" else torch.float32).to(dev)
    return _pipe

@app.get("/health")
def health(): return {"ok": True, "loaded": _pipe is not None}

@app.post("/stylize")
def stylize(style: str = "neon", image: UploadFile = File(...)):
    try: img = Image.open(io.BytesIO(image.file.read())).convert("RGB")
    except Exception: raise HTTPException(400, "not an image")
    w, h = img.size; s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((512, 512))
    out = pipe()(prompt=PROMPTS.get(style, PROMPTS["neon"]), image=img, num_inference_steps=2, strength=0.5, guidance_scale=0.0).images[0]
    buf = io.BytesIO(); out.save(buf, "PNG"); return Response(buf.getvalue(), media_type="image/png")
