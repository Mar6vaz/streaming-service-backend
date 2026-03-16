import amqp, { Channel } from 'amqplib';
import { ITrailerWatchedPayload } from '../types';

const EXCHANGE = 'cinestream.events';
const DLQ = 'cinestream.dlq';

let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL ?? 'amqp://localhost');
    channel = await conn.createChannel();

    // Exchange principal durable
    await channel.assertExchange(EXCHANGE, 'direct', { durable: true });

    // Dead Letter Queue
    await channel.assertQueue(DLQ, { durable: true });

    // Cola trailer.watched.recommendation
    await channel.assertQueue('trailer.watched.recommendation', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': DLQ,
        'x-message-ttl': 60000,
      },
    });
    await channel.bindQueue('trailer.watched.recommendation', EXCHANGE, 'trailer.watched');

    // Cola trailer.watched.notification
    await channel.assertQueue('trailer.watched.notification', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': DLQ,
        'x-message-ttl': 60000,
      },
    });
    await channel.bindQueue('trailer.watched.notification', EXCHANGE, 'trailer.watched');

    console.log('✅ RabbitMQ conectado');

    (conn as any).on('error', (err: Error) => {
      console.error('❌ RabbitMQ error:', err.message);
      channel = null;
    });

    (conn as any).on('close', () => {
      console.warn('⚠️  RabbitMQ conexión cerrada, reconectando en 5s...');
      channel = null;
      setTimeout(connectRabbitMQ, 5000);
    });
  } catch (error) {
    console.error('❌ Error conectando a RabbitMQ:', (error as Error).message);
    console.warn('⚠️  Reintentando en 5s...');
    setTimeout(connectRabbitMQ, 5000);
  }
};

export const publishTrailerWatched = (payload: ITrailerWatchedPayload): boolean => {
  if (!channel) {
    console.error('❌ No hay canal RabbitMQ disponible para publicar evento');
    return false;
  }

  const message = {
    event: 'trailer.watched',
    timestamp: new Date().toISOString(),
    payload,
  };

  try {
    channel.publish(
      EXCHANGE,
      'trailer.watched',
      Buffer.from(JSON.stringify(message)),
      { persistent: true, contentType: 'application/json' }
    );
    console.log(`📤 Evento trailer.watched publicado para user_id: ${payload.user_id}`);
    return true;
  } catch (error) {
    console.error('❌ Error publicando evento:', (error as Error).message);
    return false;
  }
};
