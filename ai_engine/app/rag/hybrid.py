"""Hybrid RAG: BM25 (sparse) + BGE dense (Qdrant) fused with Reciprocal Rank Fusion."""
import glob, os, re
from rank_bm25 import BM25Okapi
chunks: list[str] = []; bm = None; emb = None; qc = None; COL = "knowledge"

def _tok(s): return re.findall(r"[a-z0-9]+", s.lower())

def ingest(folder="knowledge"):
    global bm, emb, qc
    for f in glob.glob(os.path.join(folder, "*.md")):
        chunks.extend(c.strip() for c in re.split(r"\n(?=# )", open(f, encoding="utf-8").read()) if c.strip())
    bm = BM25Okapi([_tok(c) for c in chunks])
    try:  # dense side is optional: degrade to BM25-only if Qdrant/model unavailable
        from fastembed import TextEmbedding
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, PointStruct, VectorParams
        emb = TextEmbedding("BAAI/bge-small-en-v1.5"); qc = QdrantClient(url=os.environ.get("QDRANT_URL", "http://qdrant:6333"))
        vecs = [list(map(float, v)) for v in emb.embed(chunks)]
        qc.recreate_collection(COL, vectors_config=VectorParams(size=len(vecs[0]), distance=Distance.COSINE))
        qc.upsert(COL, [PointStruct(id=i, vector=v, payload={"i": i}) for i, v in enumerate(vecs)])
    except Exception as e: print("dense disabled:", e); emb = qc = None

_rr = None
def _reranker():
    """Cross-encoder re-ranker (lazy, optional)."""
    global _rr
    if _rr is None:
        try:
            from fastembed.rerank.cross_encoder import TextCrossEncoder
            _rr = TextCrossEncoder("Xenova/ms-marco-MiniLM-L-6-v2")
        except Exception as e: print("rerank disabled:", e); _rr = False
    return _rr

def search(q: str, k=3, hyde: str | None = None) -> list[str]:
    """BM25 + dense (query expanded with an optional HyDE passage) -> RRF -> cross-encoder re-rank."""
    text = f"{q} {hyde}" if hyde else q
    bs = bm.get_scores(_tok(text)); scores: dict[int, float] = {}
    for r, i in enumerate(sorted(range(len(chunks)), key=lambda i: -bs[i])[:10]): scores[i] = scores.get(i, 0) + 1 / (60 + r)
    if emb and qc:
        try:
            v = list(map(float, next(iter(emb.embed([text])))))
            for r, h in enumerate(qc.search(COL, query_vector=v, limit=10)): scores[h.id] = scores.get(h.id, 0) + 1 / (60 + r)
        except Exception: pass
    cand = sorted(scores, key=scores.get, reverse=True)[:8]
    rr = _reranker()
    if rr and len(cand) > 1:
        try: cand = [c for _, c in sorted(zip(rr.rerank(q, [chunks[i] for i in cand]), cand), key=lambda t: -t[0])]
        except Exception: pass
    return [chunks[i] for i in cand[:k]]
