FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
RUN npm install tsx
COPY --from=builder /app/dist ./dist
COPY server.ts ./
COPY src/types.ts ./src/types.ts
COPY firebase-applet-config.json ./
COPY public ./public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npx", "tsx", "server.ts"]
