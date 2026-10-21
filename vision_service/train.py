"""Train: dataset/{idle,tap,fist}/*.jpg  ->  weights/gesture.pt   (python train.py)"""
import glob, os, cv2, numpy as np, torch, torch.nn as nn
from app.cnn_models.gesture import GestureCNN, LABELS
X, y = [], []
for i, l in enumerate(LABELS):
    for f in glob.glob(f"dataset/{l}/*.jpg"):
        im = cv2.imread(f, 0)
        if im is not None: X.append(cv2.resize(im, (64, 64)) / 255.0); y.append(i)
assert X, "put images in dataset/idle|tap|fist"
X = torch.tensor(np.array(X), dtype=torch.float32)[:, None]; y = torch.tensor(y)
m = GestureCNN(); opt = torch.optim.Adam(m.parameters(), 1e-3); lf = nn.CrossEntropyLoss()
for ep in range(25):
    m.train(); p = torch.randperm(len(X))
    for b in range(0, len(X), 32):
        idx = p[b:b + 32]; opt.zero_grad(); lf(m(X[idx]), y[idx]).backward(); opt.step()
    print("epoch", ep)
os.makedirs("weights", exist_ok=True); torch.save(m.state_dict(), "weights/gesture.pt")
