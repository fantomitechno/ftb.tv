import { ChatUserstate, Client } from "tmi.js";
import { config } from "dotenv";
config();

import { executeCommand } from "./command.js";
import { executeAutomod } from "./automod.js";

const channels = process.env.CHANNELS?.split(",") ?? [];

const client = new Client({
  identity: {
    username: process.env.CLIENT,
    password: process.env.CLIENT_TOKEN,
  },
  channels,
});

client
  .connect()
  .then(() => console.log(`Connected to ${channels.length} channels!`))
  .catch(console.error);

const isMod = (channel: string, state: ChatUserstate) =>
  client.isMod(channel, state.username!) || Boolean(state.badges?.broadcaster);
const isBypass = (channel: string, state: ChatUserstate) =>
  isMod(channel, state) || Boolean(state.badges?.vip);

client.on("message", async (channel, state, message, self) => {
  if (self) return;

  if (message.startsWith(process.env.PREFIX ?? "!")) {
    const [command, ...args] = message.slice(1).split(" ");

    executeCommand(command, args, channel, state, client, isMod(channel, state));
  }

  if (!isBypass(channel, state)) {
    executeAutomod(message, state, channel, client);
  }
});
