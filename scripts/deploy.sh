#!/bin/bash
set -e

# ============================================
# Cricket Betting Platform — Deployment Script
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

echo "=== Cricket Betting Platform Deployment ==="
echo "Project directory: $PROJECT_DIR"

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    exit 1
fi

# Check .env file
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

# Check SSL certs
if [ ! -f "$PROJECT_DIR/nginx/ssl/fullchain.pem" ]; then
    echo "WARNING: SSL certificates not found in nginx/ssl/"
    echo "For local testing, generating self-signed certificates..."
    mkdir -p "$PROJECT_DIR/nginx/ssl"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PROJECT_DIR/nginx/ssl/privkey.pem" \
        -out "$PROJECT_DIR/nginx/ssl/fullchain.pem" \
        -subj "/C=IN/ST=State/L=City/O=CBP/CN=localhost" 2>/dev/null
    echo "Self-signed certificates generated."
fi

cd "$PROJECT_DIR"

# Parse command
COMMAND=${1:-"up"}

case $COMMAND in
    up)
        echo "=== Starting all services ==="
        docker compose -f docker-compose.prod.yml --env-file .env up -d --build
        echo "=== Running database migrations ==="
        docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
        echo "=== Deployment complete ==="
        echo ""
        docker compose -f docker-compose.prod.yml ps
        ;;

    down)
        echo "=== Stopping all services ==="
        docker compose -f docker-compose.prod.yml down
        ;;

    restart)
        echo "=== Restarting services ==="
        docker compose -f docker-compose.prod.yml restart
        ;;

    logs)
        docker compose -f docker-compose.prod.yml logs -f ${2:-""}
        ;;

    status)
        echo "=== Service Status ==="
        docker compose -f docker-compose.prod.yml ps
        echo ""
        echo "=== Health Checks ==="
        echo -n "Backend: "
        curl -sf http://localhost:5000/health | head -c 100 || echo "UNREACHABLE"
        echo ""
        echo -n "Frontend: "
        curl -sf http://localhost:3000 > /dev/null && echo "OK" || echo "UNREACHABLE"
        ;;

    migrate)
        echo "=== Running database migrations ==="
        docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
        ;;

    seed)
        echo "=== Seeding database ==="
        docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
        ;;

    backup)
        echo "=== Creating database backup ==="
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        source "$ENV_FILE"
        docker compose -f docker-compose.prod.yml exec -T postgres \
            pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$PROJECT_DIR/backups/$BACKUP_FILE"
        echo "Backup saved to backups/$BACKUP_FILE"
        ;;

    rebuild)
        echo "=== Rebuilding and restarting ==="
        docker compose -f docker-compose.prod.yml down
        docker compose -f docker-compose.prod.yml --env-file .env up -d --build
        docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
        echo "=== Rebuild complete ==="
        ;;

    *)
        echo "Usage: $0 {up|down|restart|logs|status|migrate|seed|backup|rebuild}"
        echo ""
        echo "Commands:"
        echo "  up       - Start all services (build + migrate)"
        echo "  down     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View logs (optional: service name)"
        echo "  status   - Check service health"
        echo "  migrate  - Run database migrations"
        echo "  seed     - Seed the database"
        echo "  backup   - Create database backup"
        echo "  rebuild  - Full rebuild and restart"
        exit 1
        ;;
esac
