.PHONY: db-up db-down backend frontend

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

backend:
	set -a; [ -f .env ] && . ./.env; set +a; cd backend && ./mvnw spring-boot:run

frontend:
	cd frontend && npm run dev
