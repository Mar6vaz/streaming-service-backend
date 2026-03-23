const { getChannel } = require('../config/rabbitmq');
const Progress = require('../models/Progress');
const PlayEvent = require('../models/PlayEvent');


const consumeUserDeleted = async () => {
  const channel = getChannel();
  if (!channel) {
    console.warn('[Consumer] No channel available. user.deleted consumer not started.');
    return;
  }

  channel.consume('user.deleted', async (msg) => {
    if (!msg) return;

    try {
      const { user_id } = JSON.parse(msg.content.toString());
      console.log(`[Consumer] user.deleted received for user_id: ${user_id}`);

      await Promise.all([
        Progress.deleteMany({ user_id }),
        PlayEvent.deleteMany({ user_id }),
      ]);

      console.log(`[Consumer] Deleted all streaming data for user_id: ${user_id}`);
      channel.ack(msg);
    } catch (error) {
      console.error('[Consumer] Error processing user.deleted:', error.message);
      channel.nack(msg, false, true); 
    }
  });

  console.log('[Consumer] Listening on queue: user.deleted');
};

module.exports = { consumeUserDeleted };
