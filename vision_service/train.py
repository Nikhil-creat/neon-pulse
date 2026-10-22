"""Train the gesture CNN.  python train.py [dataset.json | dataset/]  ->  weights/gesture.pt
dataset.json comes from docs/collect.html: {"idle":[dataURL,...],"tap":[...],"fist":[...]}   (or folders dataset/{idle,tap,fist}/*.jpg)"""
import base64, glob, json, os, sys
import cv2, numpy as np, torch, torch.nn as nn
from app.cnn_models.gesture import GestureCNN, LABELS

def load(src):
    X, y = [], []
    if src.endswith(".json"):
        d = json.load(open(src))
        for i, l in enumerate(LABELS):
            for u in d.get(l, []):
                im = cv2.imdecode(np.frombuffer(base64.b64decode(u.split(",")[1]), np.uint8), cv2.IMREAD_GRAYSCALE)
                if im is not None: X.append(cv2.resize(im, (64, 64)) / 255.0); y.append(i)
    else:
        for i, l in enumerate(LABELS):
            for f in glob.glob(os.path.join(src, l, "*.jpg")) + glob.glob(os.path.join(src, l, "*.png")):
                im = cv2.imread(f, 0)
                if im is not None: X.append(cv2.resize(im, (64, 64)) / 255.0); y.append(i)
    assert len(X) >= 60, "need at least ~20 images per class"
    return torch.tensor(np.array(X), dtype=torch.float32)[:, None], torch.tensor(y)

def augment(b):  # brightness jitter, small shifts, noise
    b = b * (0.8 + 0.4 * torch.rand(len(b), 1, 1, 1)); dx, dy = np.random.randint(-4, 5, 2)
    return (torch.roll(b, (int(dy), int(dx)), (2, 3)) + 0.02 * torch.randn_like(b)).clamp(0, 1)

if __name__ == "__main__":
    X, y = load(sys.argv[1] if len(sys.argv) > 1 else "dataset.json" if os.path.exists("dataset.json") else "dataset")
    p = torch.randperm(len(X)); cut = int(len(X) * .8); tr, va = p[:cut], p[cut:]
    m = GestureCNN(); opt = torch.optim.Adam(m.parameters(), 1e-3); lf = nn.CrossEntropyLoss()
    for ep in range(30):
        m.train(); tr = tr[torch.randperm(len(tr))]
        for i in range(0, len(tr), 32):
            idx = tr[i:i + 32]; opt.zero_grad(); lf(m(augment(X[idx])), y[idx]).backward(); opt.step()
        m.eval()
        with torch.no_grad(): acc = (m(X[va]).argmax(1) == y[va]).float().mean().item()
        print(f"epoch {ep + 1}/30 val_acc {acc:.2%}")
    os.makedirs("weights", exist_ok=True); torch.save(m.state_dict(), "weights/gesture.pt"); print("saved weights/gesture.pt")
