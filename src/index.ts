import { config } from 'dotenv';
config();

import { Client } from 'tmi.js';
import { getCommand } from './firestore';
import axios from 'axios';

const channels = process.env.CHANNELS?.split(',') ?? [];

/**
 * Get a Twitch Token
 */
const getToken = async () => {
  const res = await axios.post(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`
  );
  const json = res.data;
  return json.access_token;
};

const getChannelID = async (token: string, name: string) => {
  const res = await axios.get(
    'https://api.twitch.tv/helix/users?login=' + name,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': process.env.CLIENT_ID ?? '',
        Accept: 'application/vnd.twitchtv.v5+json'
      }
    }
  );
  const json = res.data;
  const data = json.data[0];
  return data.id;
};

const client = new Client({
  identity: {
    username: process.env.CLIENT,
    password: process.env.CLIENT_TOKEN
  },
  channels
});

client
  .connect()
  .then((_) => console.log('Connected!'))
  .catch(console.error);

client.on('message', async (channel, tags, message, self) => {
  if (self) return;
  if (message.startsWith(process.env.PREFIX ?? '!')) {
    const [command, ...args] = message.slice(1).split(' ');
    const cmd = await getCommand(command);
    if (cmd) {
      const value = cmd.value.replace('%u', tags.username ?? '');
      if (cmd.respond) {
        client.raw(
          `@reply-parent-msg-id=${tags.id} PRIVMSG ${channel} :${value}`
        );
      } else {
        client.say(channel, value);
      }
    } else if (
      client.isMod(channel, process.env.CLIENT ?? '') &&
      (client.isMod(channel, tags.username ?? '') || tags.badges?.broadcaster)
    ) {
      const token = await getToken();
      const self_id = await getChannelID(token, process.env.CLIENT ?? '');
      console.log(token);
      console.log(tags['room-id']);
      switch (command) {
        case 'title':
          axios
            .patch(
              `https://api.twitch.tv/helix/channels?broadcaster_id=${tags['room-id']}&moderator_id=${self_id}`,
              {
                title: args.join(' ')
              },
              {
                headers: {
                  'Client-ID': process.env.CLIENT_ID ?? '',
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            .then((res) => {
              console.log(res.data);
            })
            .catch((err) => {
              console.log(err);
            });
          break;
      }
    }
  }
});
