import amqp, { Channel, Connection } from 'amqplib';

const EXCHANGE_NAME = 'cinestream.events';
const EXCHANGE_TYPE = 'direct';
const QUEUE_NAME    = 'trailer.watched.queue';
const ROUTING_KEY   = 'trailer.watched';

let channel: Channel | null = null;
let conn:    Connection | null = null;

// Conexión + declaración de Exchange, Queue y Binding

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    const url = process.env.RABBITMQ_URL;
    if (!url) throw new Error('RABBITMQ_URL no está definida en .env');

    const connection = await amqp.connect(url);
    conn    = connection as unknown as Connection;
    channel = await (connection as any).createChannel() as Channel;

    console.log(' Conexión RabbitMQ establecida');
    console.log(' Canal RabbitMQ creado');

    // 1. Exchange
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
    console.log('Exchange declarado:', EXCHANGE_NAME);

    // 2. Queue
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Queue declarada:', QUEUE_NAME);

    // 3. Binding Exchange → Queue
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);
    console.log(`Binding: ${EXCHANGE_NAME} --[${ROUTING_KEY}]--> ${QUEUE_NAME}`);

    // 4. Consumer  referencia local para evitar error de null dentro del callback
    const ch = channel;
    channel.consume(QUEUE_NAME, (msg) => {
      if (!msg) return;
      const content = JSON.parse(msg.content.toString());
      console.log(' Evento recibido → trailer.watched:', content);
      ch.ack(msg);
    });
    console.log(' Consumer escuchando en:', QUEUE_NAME);

    // Manejo de errores de conexión
    (connection as any).on('error', (err: Error) => {
      console.error(' RabbitMQ error:', err.message);
    });
    (connection as any).on('close', () => {
      console.warn('  RabbitMQ conexión cerrada — intentando reconectar en 5s...');
      setTimeout(connectRabbitMQ, 5000);
    });

  } catch (error) {
    console.error(' Error al conectar RabbitMQ:', error);
    console.warn(' Reintentando en 5 segundos...');
    setTimeout(connectRabbitMQ, 5000);
  }
};

// Publicar evento

export const publishTrailerWatched = async (payload: {
  user_id:      string;
  movie_id:     string;
  trailer_id:   string;
  watch_id:     string;
  completed_at: string;
  device:       string;
}): Promise<void> => {
  if (!channel) {
    console.error('  Canal no disponible — el mensaje no se publicó');
    return;
  }

  const message = {
    event:     'trailer.watched',
    timestamp: new Date().toISOString(),
    payload,
  };

  const result = channel.publish(
    EXCHANGE_NAME,
    ROUTING_KEY,
    Buffer.from(JSON.stringify(message)),
    { persistent: true, contentType: 'application/json' }
  );

  if (result) {
    console.log(' Evento publicado → trailer.watched:', JSON.stringify(payload));
  } else {
    console.warn('  publish() retornó false — buffer de escritura lleno');
  }
};