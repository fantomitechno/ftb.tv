import {config} from "dotenv";
config();


import { Client } from "tmi.js";

const channels = process.env.CHANNELS?.split(",") ?? [];

const client = new Client({
  identity: {
		username: process.env.USER,
		password: process.env.TOKEN
	},
  channels
})

client.connect().then(_ => console.log("Connected!")).catch(console.error);

client.on("message", (channel, tags, message, self) => {
  if (self) return;
  if (message.startsWith("!")) {
    const [command, ...args] = message.slice(1).split(" ");
    switch (command) {
      case "hello":
        client.raw(`@reply-parent-msg-id=${tags.id} PRIVMSG ${channel} :Hello, ${tags.username}!`);
        break;
      case "discord":
        client.raw(`@reply-parent-msg-id=${tags.id} PRIVMSG ${channel} : /me Rejoins donc mon serveur Discord https://discord.gg/x9BMZ6z`);
        break;
      case "twitter":
        client.raw(`@reply-parent-msg-id=${tags.id} PRIVMSG ${channel} : /me Parfois je met des trucs en anglais sur Twitter https://twitter.com/fantomitechno");
        break;
      case "site":
        break;
    }
  }
});