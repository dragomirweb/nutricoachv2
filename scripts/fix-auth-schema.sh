#!/bin/bash

# Ensure database is running
npm run docker:ensure

# Apply the verification table fix
echo "Fixing verification table schema..."
docker exec -i nutricoach-db psql -U postgres -d nutricoach < scripts/fix-verification-table.sql

echo "Schema fix applied successfully!"

# Now run the push command
echo "Running db:push..."
npm run db:push