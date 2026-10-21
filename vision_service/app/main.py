"""Vision API: POST a webcam frame -> gesture (click trigger) + presence check."""
import cv2, numpy as np, torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from .cnn_models.gesture import LABELS, load
app = FastAPI(title="Neon-Pulse Vision"); model, TRAINED = load()
face = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def decode(b: bytes):
    img = cv2.imdecode(np.frombuffer(b, np.uint8), cv2.IMREAD_GRAYSCALE)
    if img is None: raise HTTPException(400, "not an image")
    return img

@app.get("/health")
async def health(): return {"ok": True, "weights_loaded": TRAINED}

@app.post("/gesture")
async def gesture(frame: UploadFile = File(...)):
    img = cv2.resize(decode(await frame.read()), (64, 64)).astype("float32") / 255
    with torch.no_grad(): p = torch.softmax(model(torch.from_numpy(img)[None, None]), 1)[0]
    i = int(p.argmax()); return {"gesture": LABELS[i], "confidence": float(p[i]), "click": LABELS[i] in ("tap", "fist") and TRAINED}

@app.post("/presence")
async def presence(frame: UploadFile = File(...)):
    faces = face.detectMultiScale(decode(await frame.read()), 1.2, 5)
    return {"human_present": len(faces) == 1, "faces": len(faces)}
