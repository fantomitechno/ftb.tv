import { ChatUserstate, Client } from "tmi.js";
import { config } from "dotenv";
config();

import { executeCommand, loadCommands } from "./command.js";
import { executeAutomod } from "./automod.js";
import { init, processMessageForTimers } from "./timer.js";
import { getUserId } from "./helix/index.js";

const channels = process.env.CHANNELS!.split(",");

const client = new Client({
  identity: {
    username: process.env.CLIENT,
    password: "oauth:" + process.env.CLIENT_TOKEN,
  },
  channels: Array.from(channels),
});

loadCommands()

client
  .connect()
  .then(async () => {
    console.log(`Connected to ${channels.length} channels!`);
    for (const channel of channels) {
      const channelId = await getUserId(channel);
      await init(client, channelId, "#" + channel);
    }
  })
  .catch(console.error);

const isMod = (channel: string, state: ChatUserstate) =>
  client.isMod(channel, state.username!) || Boolean(state.badges?.broadcaster);
const isBypass = (channel: string, state: ChatUserstate) =>
  isMod(channel, state) || Boolean(state.badges?.vip);

const chatUserCache: { [username: string]: NodeJS.Timeout } = {}

client.on("message", async (channel, state, message, self) => {
  if (self) return;

  if (message.startsWith(process.env.PREFIX ?? "!")) {
    const [command, ...args] = message.slice((process.env.PREFIX ?? "!").length).split(" ");
    console.log(command)

    executeCommand(
      command,
      args,
      channel,
      state,
      client,
      isMod(channel, state)
    );
  }

  if (!isBypass(channel, state)) {
    executeAutomod(message, state, channel, client, Object.keys(chatUserCache));
  }

  processMessageForTimers(client, channel, state["room-id"]!);

  if (chatUserCache[state["display-name"]!]) clearTimeout(chatUserCache[state["display-name"]!])
  chatUserCache[state["display-name"]!] = setTimeout(() => {
    delete chatUserCache[state["display-name"]!]
  }, 1000 * 60 * 60);
});