up: ; cp -n .env.example .env || true; docker compose up --build
prod: ; docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
test: ; cd backend_api && python -m pytest -q && cd ../ai_engine && python -m pytest -q
migrate: ; docker compose exec backend_api alembic upgrade head
