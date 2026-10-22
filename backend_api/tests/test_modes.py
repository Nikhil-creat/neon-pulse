import pydantic, pytest
from app.models.db import Score

def test_score_modes():
    Score(score=1, intervals=[], hits=1, shots=1, mode="rush")
    with pytest.raises(pydantic.ValidationError): Score(score=1, intervals=[], hits=1, shots=1, mode="hax")
