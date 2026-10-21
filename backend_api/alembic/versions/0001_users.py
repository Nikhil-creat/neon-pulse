"""create users (idempotent)"""
revision = "0001"; down_revision = None
from alembic import op
import sqlalchemy as sa

def upgrade():
    if "users" in sa.inspect(op.get_bind()).get_table_names(): return
    op.create_table("users", sa.Column("id", sa.Integer, primary_key=True), sa.Column("name", sa.String(32), nullable=False), sa.Column("pw", sa.String(200), nullable=False))
    op.create_index("ix_users_name", "users", ["name"], unique=True)

def downgrade(): op.drop_table("users")
