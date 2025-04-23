#!/bin/bash
message="${*:-minor fixes}"

# Default to production environment
environment="production"

# Check if dev flag is set
if [ "$1" == "--dev" ]; then
  environment="dev"
  # Remove the --dev flag from the message arguments
  shift
  message="${*:-minor fixes}"
fi

git add . && \
git commit -m "$message" && \
git push -f origin main && \
npm run build

# Deploy to the appropriate environment
if [ "$environment" == "dev" ]; then
  echo "Deploying to development environment..."
  firebase deploy --only hosting:dev
else
  echo "Deploying to production environment..."
  firebase deploy --only hosting:production
fi 