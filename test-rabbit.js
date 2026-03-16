const amqp = require('amqplib');

async function consume() {
  const conn = await amqp.connect('amqp://guest:guest@localhost:5672');
  const ch = await conn.createChannel();
  
  await ch.assertExchange('cinestream.events', 'direct', { durable: true });
  await ch.assertQueue('trailer.events.queue', { durable: true });
  await ch.bindQueue('trailer.events.queue', 'cinestream.events', 'trailer.watched');
  
  console.log('👂 Esperando mensajes en trailer.events.queue...');
  
  ch.consume('trailer.events.queue', (msg) => {
    if (msg) {
      console.log('📨 Mensaje recibido:');
      console.log(JSON.parse(msg.content.toString()));
      ch.ack(msg);
    }
  });
}

consume().catch(console.error);