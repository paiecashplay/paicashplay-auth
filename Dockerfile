# Étape 1 : build de l'app
FROM node:18 AS builder

WORKDIR /app

# Copier les fichiers de dépendances et Prisma
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier tout le code
COPY . .

# Build de Next.js
ENV NODE_ENV=production

ARG DB_HOST
ENV DB_HOST=$DB_HOST

ARG DB_USER
ENV DB_USER=$DB_USER

ARG DB_PORT
ENV DB_PORT=$DB_PORT

ARG DB_PASSWORD
ENV DB_PASSWORD=$DB_PASSWORD

ARG DB_NAME
ENV DB_NAME=$DB_NAME

ARG DB_NAME
ENV NEXTAUTH_URL=$NEXTAUTH_URL

RUN npm run build

# Étape 2 : image de production
FROM node:18-slim

WORKDIR /app

# Installer les dépendances système nécessaires à Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copier les fichiers nécessaires
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/email-templates ./email-templates
COPY --from=builder /app/next.config.js ./next.config.js

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=8080

ARG DB_HOST
ENV DB_HOST=$DB_HOST

ARG DB_USER
ENV DB_USER=$DB_USER

ARG DB_PORT
ENV DB_PORT=$DB_PORT

ARG DB_PASSWORD
ENV DB_PASSWORD=$DB_PASSWORD

ARG DB_NAME
ENV DB_NAME=$DB_NAME

ARG DB_NAME
ENV NEXTAUTH_URL=$NEXTAUTH_URL

EXPOSE 8080

# Scripts de démarrage et seed
COPY start.sh ./
COPY seed-production.js ./
RUN chmod +x start.sh

CMD ["./start.sh"]
