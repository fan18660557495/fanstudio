#!/bin/sh
set -e

echo "Starting FanStudio..."

wait_for_db() {
    echo "Waiting for database to be ready..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if npx prisma db pull --schema=/app/prisma/schema.prisma > /dev/null 2>&1; then
            echo "Database is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "Attempt $attempt/$max_attempts: Database not ready yet, waiting..."
        sleep 2
    done
    
    echo "Error: Database connection failed after $max_attempts attempts"
    return 1
}

run_migrations() {
    echo "Running database migrations..."
    npx prisma migrate deploy --schema=/app/prisma/schema.prisma
    echo "Migrations completed!"
}

main() {
    wait_for_db
    run_migrations
    
    echo "Starting application..."
    exec "$@"
}

main "$@"
