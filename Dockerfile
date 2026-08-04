# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm install

# Copy application code
COPY . .

# Generate Prisma Client and Build the Next.js app
ENV NODE_ENV=production
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy package info and prisma schema
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev

# Copy Next.js build output and public folder
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./

# Expose port 3000
EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start Next.js
CMD ["npm", "start"]
