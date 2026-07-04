#!/usr/bin/env bash
# =============================================================================
# Construction DB Setup Script
# Run this once to create the PostgreSQL database and user.
# Usage: bash scripts/db-setup.sh
# =============================================================================

set -e

export PATH="/Library/PostgreSQL/18/bin:$PATH"

PG_HOST="127.0.0.1"
PG_PORT="5432"
PG_SUPERUSER="postgres"

DB_NAME="construction_db"
DB_USER="construction_user"
DB_PASS="construction_pass"

echo ""
echo "==========================================="
echo " Construction DB Setup"
echo "==========================================="
echo ""
echo "Enter the PostgreSQL superuser (postgres) password:"

PGPASSWORD_INPUT=$(read -s -p "" pw && echo "$pw")
export PGPASSWORD="$PGPASSWORD_INPUT"

echo ""
echo "→ Creating database user '$DB_USER'..."
psql -U "$PG_SUPERUSER" -h "$PG_HOST" -p "$PG_PORT" -c \
  "DO \$\$ BEGIN
     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
       CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
     END IF;
   END \$\$;" postgres

echo "→ Creating database '$DB_NAME'..."
psql -U "$PG_SUPERUSER" -h "$PG_HOST" -p "$PG_PORT" -c \
  "SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
   WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='$DB_NAME')\gexec" postgres

echo "→ Granting privileges..."
psql -U "$PG_SUPERUSER" -h "$PG_HOST" -p "$PG_PORT" -c \
  "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" postgres

psql -U "$PG_SUPERUSER" -h "$PG_HOST" -p "$PG_PORT" -d "$DB_NAME" -c \
  "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true

unset PGPASSWORD

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps — run in your terminal:"
echo "  npm run db:migrate   # Create tables (provide a name like 'init')"
echo "  npm run db:seed      # Seed with sample data"
echo ""
