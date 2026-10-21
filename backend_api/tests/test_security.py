import hashlib, hmac, jwt, pytest
from app.core import security as S

def test_password_roundtrip():
    h = S.hash_pw("secret123"); assert S.verify_pw("secret123", h) and not S.verify_pw("wrongpass", h)

def test_signature_detects_tampering():
    body = b'{"score":10}'; sig = hmac.new(S.sign_key("bob").encode(), body, hashlib.sha256).hexdigest()
    assert S.valid_signature("bob", body, sig) and not S.valid_signature("bob", body + b" ", sig) and not S.valid_signature("eve", body, sig)

def test_token_types_not_interchangeable():
    t = S.make_token("bob", 5, "access"); assert S.read_token(t, "access") == "bob"
    with pytest.raises(jwt.InvalidTokenError): S.read_token(t, "refresh")

def test_contact_email_validation():
    from app.models.db import Contact
    import pydantic
    Contact(name="a", email="a@b.co", message="hello there")
    with pytest.raises(pydantic.ValidationError): Contact(name="a", email="nope", message="hello there")
