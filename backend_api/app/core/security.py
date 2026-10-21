import hashlib, hmac, os, time, jwt
from .config import JWT_SECRET, SIGN_SECRET

def hash_pw(pw: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    return salt.hex() + "$" + hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 200_000).hex()

def verify_pw(pw: str, stored: str) -> bool:
    s, h = stored.split("$")
    return hmac.compare_digest(hash_pw(pw, bytes.fromhex(s)).split("$")[1], h)

def make_token(sub: str, minutes: int, kind: str) -> str:
    return jwt.encode({"sub": sub, "typ": kind, "exp": int(time.time()) + minutes * 60}, JWT_SECRET, "HS256")

def read_token(tok: str, kind: str) -> str:
    p = jwt.decode(tok, JWT_SECRET, ["HS256"])
    if p.get("typ") != kind: raise jwt.InvalidTokenError("wrong token type")
    return p["sub"]

def sign_key(user_id: str) -> str:
    """Per-user HMAC key returned at login; client signs score payloads with it."""
    return hmac.new(SIGN_SECRET.encode(), user_id.encode(), hashlib.sha256).hexdigest()

def valid_signature(user_id: str, body: bytes, sig: str) -> bool:
    mac = hmac.new(sign_key(user_id).encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, sig or "")
