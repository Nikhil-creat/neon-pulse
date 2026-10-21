import asyncio, os
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.db import Base

def _run(conn):
    context.configure(connection=conn, target_metadata=Base.metadata)
    with context.begin_transaction(): context.run_migrations()

async def _main():
    eng = create_async_engine(os.environ["DATABASE_URL"])
    async with eng.connect() as c: await c.run_sync(_run)
    await eng.dispose()

if context.is_offline_mode(): raise SystemExit("offline mode unsupported")
asyncio.run(_main())
