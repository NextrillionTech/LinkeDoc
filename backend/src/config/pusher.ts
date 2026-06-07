import Pusher from 'pusher';
import dotenv from 'dotenv';

dotenv.config();

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'dummy_id',
  key: process.env.PUSHER_KEY || 'dummy_key',
  secret: process.env.PUSHER_SECRET || 'dummy_secret',
  cluster: process.env.PUSHER_CLUSTER || 'dummy_cluster',
  useTLS: true,
});
