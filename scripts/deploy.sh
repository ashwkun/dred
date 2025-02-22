#!/bin/bash
message="${*:-minor fixes}"
git add . && \
git commit -m "$message" && \
git push -f origin main && \
npm run build && \
firebase deploy 