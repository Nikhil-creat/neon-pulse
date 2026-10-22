up: ; cp -n .env.example .env || true; docker compose up --build
prod: ; docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
test: ; cd backend_api && python -m pytest -q && cd ../ai_engine && python -m pytest -q
migrate: ; docker compose exec backend_api alembic upgrade head
avatar: ; docker compose --profile avatar up --build -d avatar_service
next: ; docker compose --profile next up --build -d web
cluster: ; docker compose -f docker-compose.yml -f docker-compose.cluster.yml up --build
obs: ; docker compose --profile obs up -d prometheus grafana
load: ; k6 run -e API=http://localhost:8000 loadtest/k6.js
e2e: ; cd docs && (python3 -m http.server 8000 &) ; sleep 2 ; BASE=http://localhost:8000 python3 ../e2e/smoke.py ; pkill -f "http.server 8000"
