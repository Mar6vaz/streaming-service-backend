const amqplib = require('amqplib');

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Cola durable para eventos que publica este servicio
    await channel.assertQueue('trailer.watched', { durable: true });

    // Cola durable para eventos que consume este servicio
    await channel.assertQueue('user.deleted', { durable: true });

    console.log('[RabbitMQ] Connected successfully');
    return channel;
  } catch (error) {
    console.error('[RabbitMQ] Connection error:', error.message);
    console.warn('[RabbitMQ] Service will run without event bus');
    return null;
  }
};

const getChannel = () => channel;

const publishEvent = async (queue, payload) => {
  try {
    if (!channel) {
      console.warn(`[RabbitMQ] No channel available. Event ${queue} not published.`);
      return;
    }
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
    console.log(`[RabbitMQ] Event published to ${queue}:`, payload);
  } catch (error) {
    console.error(`[RabbitMQ] Error publishing to ${queue}:`, error.message);
  }
};

module.exports = { connectRabbitMQ, getChannel, publishEvent };
