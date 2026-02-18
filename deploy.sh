#!/bin/bash
set -e

echo "🚀 Deploying Stake111 to production..."

# Load env
export $(grep -v '^#' .env.production | xargs)

# Build and start containers
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run database migrations
echo "📦 Running database migrations..."
docker exec stake-backend npx prisma migrate deploy

echo "🌱 Seeding database..."
docker exec stake-backend npx prisma db seed 2>/dev/null || echo "Seed already exists or no seed configured"

echo ""
echo "✅ Deployment complete!"
echo "🔗 Backend health: http://localhost:5000/health"
echo "🔗 Frontend: http://localhost:3000"
docker compose -f docker-compose.prod.yml ps
