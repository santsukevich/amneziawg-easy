#/bin/bash
# Set variables from .env file
export $(grep -v '^#' .env | xargs -d '\n')

# Start containers
docker compose up -d ./docker-compose.traefik.yml
