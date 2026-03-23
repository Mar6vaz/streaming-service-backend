# streaming-service

Microservicio de reproducción de trailers. Puerto interno: **8003**

## Tech Stack

- Node.js + Express
- MongoDB Atlas (Mongoose)
- AWS S3 (URLs firmadas)
- RabbitMQ (eventos asincrónicos)
- JWT (autenticación inline)

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/streaming/play/:movieId` | JWT (inline) | Obtener URL de streaming |
| POST | `/streaming/progress/:movieId` | JWT (middleware) | Guardar progreso |
| GET | `/streaming/continue-watching` | JWT (middleware) | Películas en progreso |
| GET | `/streaming/stats` | Público | Top 10 más vistas |
| GET | `/health` | Público | Health check |

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
```

Variables necesarias:

```env
PORT=8003
DATABASE_URL=          # MongoDB Atlas connection string
JWT_SECRET=            # Debe ser el mismo que usa auth-service
CATALOG_SERVICE_URL=   # http://localhost:8002 (o la URL del catalog-service)
AWS_ACCESS_KEY_ID=     # Ya configurado
AWS_SECRET_ACCESS_KEY= # Ya configurado
AWS_REGION=            # Ya configurado
AWS_BUCKET=            # Ya configurado
RABBITMQ_URL=          # amqps://user:pass@host/vhost (de CloudAMQP u otro)
```

> **Nota:** El servicio arranca sin RabbitMQ si la URL no está configurada.
> Funcionará sin eventos, solo MongoDB y S3.

### 3. Crear cuenta de RabbitMQ (CloudAMQP)

1. Ve a [https://www.cloudamqp.com](https://www.cloudamqp.com)
2. Crea una cuenta gratuita (plan **Little Lemur**)
3. Crea una nueva instancia
4. Copia la **AMQP URL** y ponla en `RABBITMQ_URL` del `.env`

### 4. Ejecutar

```bash
# Producción
npm start

# Desarrollo (con auto-reload)
npm run dev
```

## Eventos RabbitMQ

### Publica

| Cola | Cuándo | Payload |
|------|--------|---------|
| `trailer.watched` | Usuario inicia reproducción | `{ user_id, movie_id, genre_id, genre_name, title }` |

### Consume

| Cola | Acción |
|------|--------|
| `user.deleted` | `Progress.deleteMany({ user_id })` + `PlayEvent.deleteMany({ user_id })` |

## Base de datos (MongoDB)

### Colección: `Progress`
- Un documento por usuario+película (upsert)
- Índice único: `{ user_id: 1, movie_id: 1 }`

### Colección: `PlayEvent`
- Un documento por reproducción iniciada
- Índices: `{ movie_id, started_at }` y `{ user_id, started_at }`
