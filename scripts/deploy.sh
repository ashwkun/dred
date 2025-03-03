#!/bin/bash
message="${*:-minor fixes}"

# Check if the first argument is "clean"
if [ "$1" = "clean" ]; then
  # Skip git operations, just build and deploy
  npm run build && \
  firebase deploy
else
  # Original behavior
  git add . && \
  git commit -m "$message" && \
  git push -f origin main && \
  npm run build && \
  firebase deploy 
fi 