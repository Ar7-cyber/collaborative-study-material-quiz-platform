#!/usr/bin/env bash
# ==============================================================================
# CSQP Smoke Test & Health Check
# Author: A Sheiman Joshi (PES2UG24CS003)
# ==============================================================================

PORT="${1:-3001}"
HOST="http://localhost:${PORT}"
RETRIES=10
COUNT=0

echo "--> Pinging ${HOST} for health check..."

until curl -s -f -o /dev/null "${HOST}" || [ $COUNT -eq $RETRIES ]; do
    echo "Waiting for CSQP server to start (attempt $((COUNT+1))/${RETRIES})..."
    sleep 1
    COUNT=$((COUNT+1))
done

if [ $COUNT -eq $RETRIES ]; then
    echo "❌ Health check failed after ${RETRIES} attempts!"
    exit 1
fi

echo "✅ Health check passed! Server is active on port ${PORT}."
exit 0

