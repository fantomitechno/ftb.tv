import { Client } from "tmi.js";
import { Timer } from "@prisma/client";

import { getTimer, getTimers } from "./prisma.js";
import { checkIfStreaming } from "./helix.js";

const intervalsForChannel: { [channel: string]: NodeJS.Timeout[] } = {};

const waitingForMessages: { [channel: string]: { [timerId: number]: number } } =
  {};
const numberOfMessagesSinceLast: {
  [channel: string]: { [timerId: number]: number };
} = {};

const init = async (client: Client, channelId: string, channel: string) => {
  const intervals = intervalsForChannel[channel];
  if (intervals) {
    intervals.forEach((i) => clearInterval(i));
  }

  numberOfMessagesSinceLast[channel] = [];
  waitingForMessages[channel] = {};

  const dbTimers = await getTimers(channelId);

  intervalsForChannel[channel] = dbTimers.map((timer) => {
    numberOfMessagesSinceLast[channel][timer.id] = 0;
    return createInterval(client, timer, channel, channelId);
  });
};

type t = Array<keyof (typeof waitingForMessages)["uwu"]>;

const processMessage = async (
  client: Client,
  channel: string,
  channelId: string
) => {
  if (numberOfMessagesSinceLast[channel]) {
    for (const key of Object.keys(
      numberOfMessagesSinceLast[channel]
    ) as unknown as number[]) {
      numberOfMessagesSinceLast[channel][key] += 1;
    }
  }
  const waitings = waitingForMessages[channel];
  if (waitings) {
    for (const key of Object.keys(waitings) as unknown as number[]) {
      waitings[key] -= 1;
      if (waitings[key] <= 0) {
        delete waitings[key];
        const timer = await getTimer(channelId, Number(key));
        console.log(timer)
        if (timer) {
          numberOfMessagesSinceLast[channel][key] = 0;
          sendMessage(client, channel, channelId, timer.message);
          intervalsForChannel[channel].push(createInterval(client, timer, channel, channelId));
        }
      }
    }
  }
};

const createInterval = (client: Client, timer: Timer, channel: string, channelId: string) => {
  const interval = setInterval(() => {
    if (
      !timer.nbMessage ||
      numberOfMessagesSinceLast[channel][timer.id] >= timer.nbMessage
    ) {
      sendMessage(client, channel, channelId, timer.message);
      numberOfMessagesSinceLast[channel][timer.id] = 0;
    } else {
      waitingForMessages[channel][timer.id] =
        timer.nbMessage - numberOfMessagesSinceLast[channel][timer.id];
      clearInterval(interval);
      const index = intervalsForChannel[channel].indexOf(interval);
      if (index > -1) intervalsForChannel[channel].splice(index, 1);
    }
  }, timer.repeatTime * 1000);
  return interval;
}

const sendMessage = async (client: Client, channel: string, channelId: string, message: string) => {
  if (await checkIfStreaming(channelId)) {
    client.say(channel, message);
  }
}

export {
  init,
  processMessage
}