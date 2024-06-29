import { Client } from "tmi.js";
import { getTimer, getTimers } from "./prisma.js";
import { Timer } from "@prisma/client";

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
    return createInterval(client, timer, channel);
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
      if (waitings[key] === 0) {
        const timer = await getTimer(channelId, key);
        if (timer) {
          client.say(channel, timer.message);
          intervalsForChannel[channel].push(createInterval(client, timer, channel));
        }
      }
    }
  }
};

const createInterval = (client: Client, timer: Timer, channel: string) => {
  const interval = setTimeout(() => {
    if (
      !timer.nbMessage ||
      numberOfMessagesSinceLast[channel][timer.id] > timer.nbMessage
    ) {
      client.say(channel, timer.message);
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

export {
  init,
  processMessage
}