# Étape 1 : build de l'app
FROM node:18 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Utiliser les variables d'environnement de production
COPY .env.production .env
# Forcer NODE_ENV pour la compilation
ENV NODE_ENV=production

RUN npm run build

# Étape 2 : image finale légère
FROM node:18-slim

WORKDIR /app

# Copie les fichiers de build
COPY --from=builder /app ./

# Port Next.js
ENV PORT 8080
ENV NODE_ENV production

EXPOSE 8080

CMD ["npm", "start"]