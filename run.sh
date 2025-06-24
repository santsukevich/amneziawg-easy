#/bin/bash
# Set variables from .env file
export $(grep -v '^#' .env | xargs -d '\n')

# Start containers
docker compose -f ./docker-compose.traefik.yml up -d
