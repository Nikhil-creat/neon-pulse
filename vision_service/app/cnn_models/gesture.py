"""Tiny CNN: 64x64 grayscale -> {idle, tap, fist}. Weights at weights/gesture.pt (see train.py)."""
import os, torch, torch.nn as nn
LABELS = ["idle", "tap", "fist"]

class GestureCNN(nn.Module):
    def __init__(self):
        super().__init__()
        blk = lambda i, o: nn.Sequential(nn.Conv2d(i, o, 3, padding=1), nn.BatchNorm2d(o), nn.ReLU(), nn.MaxPool2d(2))
        self.f = nn.Sequential(blk(1, 16), blk(16, 32), blk(32, 64)); self.h = nn.Sequential(nn.Flatten(), nn.Dropout(.3), nn.Linear(64 * 8 * 8, 3))
    def forward(self, x): return self.h(self.f(x))

def load(path="weights/gesture.pt"):
    m = GestureCNN().eval()
    ok = os.path.exists(path)
    if ok: m.load_state_dict(torch.load(path, map_location="cpu"))
    return m, ok
