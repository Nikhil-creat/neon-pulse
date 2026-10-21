from pydantic import BaseModel, Field
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase): pass
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    pw: Mapped[str] = mapped_column(String(200))

class Cred(BaseModel):
    name: str = Field(min_length=3, max_length=32, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)

class Score(BaseModel):
    score: int = Field(ge=0, le=1_000_000)
    intervals: list[float] = Field(max_length=500)  # click gaps in ms
    hits: int = Field(ge=0); shots: int = Field(ge=0)

class Chat(BaseModel):
    message: str = Field(min_length=1, max_length=1000)

class Ghost(BaseModel):
    score: int = Field(ge=0, le=1_000_000)
    hits: list[list[float]] = Field(max_length=500)  # [t_seconds, x_norm, y_norm]

class Contact(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=120)
    message: str = Field(min_length=5, max_length=1000)
