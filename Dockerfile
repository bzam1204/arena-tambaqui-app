# syntax=docker/dockerfile:1
# Multi-stage build for Vite React app, ready for Google Cloud Run.

FROM node:20-alpine AS builder
# Build-time env vars (must be provided when building the image)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG VITE_SUPABASE_STORAGE_AVATARS_BUCKET
ARG VITE_AUTH_REDIRECT_URL
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}
ENV VITE_SUPABASE_STORAGE_AVATARS_BUCKET=${VITE_SUPABASE_STORAGE_AVATARS_BUCKET}
ENV VITE_AUTH_REDIRECT_URL=${VITE_AUTH_REDIRECT_URL}
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm run build

# Runtime image: static files served via `serve`
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/build ./build

ENV PORT=8080
EXPOSE 8080

CMD ["serve", "-s", "build", "-l", "8080"]
