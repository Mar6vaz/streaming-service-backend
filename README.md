# Playback Service

Microservicio encargado de gestionar la reproduccion de trailers dentro de la plataforma CineStream. Registra el inicio de reproduccion, actualiza el progreso del usuario y mantiene un historial de visualizaciones. Cuando el usuario completa un trailer, publica un evento `trailer.watched` a RabbitMQ para que otros servicios puedan reaccionar.

---

## Requisitos

- Docker y Docker Compose

---

## Variables de entorno

Crea un archivo `.env` en la raiz del proyecto basandote en `.env.example`:

| Variable | Descripcion |
|---|---|
| `PORT` | Puerto en el que corre el servicio (default: 8003) |
| `MONGODB_URI` | URI de conexion a MongoDB Atlas |
| `JWT_SECRET` | Clave secreta para verificar tokens JWT |
| `RABBITMQ_URL` | URL de conexion a RabbitMQ |

Ejemplo:
```
PORT=8003
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/streaming_service
JWT_SECRET=tu_clave_secreta
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
```

---

## Como correr el proyecto

```bash
# Levantar todos los servicios (playback_service + rabbitmq)
docker-compose up --build

# Correr en segundo plano
docker-compose up --build -d

# Detener los servicios
docker-compose down
```

La interfaz de administracion de RabbitMQ queda disponible en `http://localhost:15672` con usuario `guest` y contrasena `guest`.

---

## Endpoints

Todos los endpoints requieren un JWT valido en el header:
```
Authorization: Bearer <token>
```

### Registrar inicio de reproduccion

```
POST /api/v1/trailers/:movieId/watch
```

Body:
```json
{
  "trailer_id": "string",
  "device": "web | mobile | tv"
}
```

Respuesta `201`:
```json
{
  "watch_id": "string",
  "started_at": "string"
}
```

---

### Actualizar progreso de reproduccion

```
PATCH /api/v1/trailers/watch/:watchId
```

Body:
```json
{
  "progress_sec": 120,
  "completed": false
}
```

Respuesta `200`:
```json
{
  "watch_id": "string",
  "progress_sec": 120,
  "completed": false
}
```

Cuando `completed` es `true`, se publica automaticamente el evento `trailer.watched` a RabbitMQ.

---

### Ver historial de reproduccion

```
GET /api/v1/trailers/history?page=1&limit=20&completed=true
```

Parametros opcionales:

| Param | Tipo | Descripcion |
|---|---|---|
| `page` | number | Numero de pagina (default: 1) |
| `limit` | number | Resultados por pagina (default: 20) |
| `completed` | boolean | Filtrar por trailers completados |

Respuesta `200`:
```json
{
  "history": [...],
  "total": 42
}
```

---

### Limpiar historial de reproduccion

```
DELETE /api/v1/trailers/history
```

Respuesta `200`:
```json
{
  "message": "Historial eliminado",
  "deleted_count": 5
}
```

---

## Eventos RabbitMQ

| Exchange | Routing Key | Queue | Cuando se publica |
|---|---|---|---|
| `cinestream.events` | `trailer.watched` | `trailer.watched.queue` | Cuando `completed: true` en el PATCH de progreso |

Estructura del evento:
```json
{
  "event": "trailer.watched",
  "timestamp": "2026-03-16T00:15:57.017Z",
  "payload": {
    "user_id": "string",
    "movie_id": "string",
    "trailer_id": "string",
    "watch_id": "string",
    "completed_at": "string",
    "device": "string"
  }
}
```