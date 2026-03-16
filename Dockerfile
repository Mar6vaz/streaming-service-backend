FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar TypeScript
RUN npm run build

EXPOSE 8003

CMD ["node", "dist/index.js"]