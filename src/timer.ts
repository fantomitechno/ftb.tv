import { Client } from "tmi.js";
import { Timer } from "@prisma/client";

import { getTimer, getTimers } from "./prisma.js";
import { checkIfStreaming } from "./helix.js";

type Timers = { [timerId: number]: { waitingFor: number, messageSinceLast: number } }
const intervalsForChannels: { [channel: string]: { timeouts: NodeJS.Timeout[], timers: Timers } } = {};


const init = async (client: Client, channelId: string, channel: string) => {
  const intervals = intervalsForChannels[channel];
  if (intervals) {
    intervals.timeouts.forEach((i) => clearInterval(i));
  }

  intervalsForChannels[channel] = { timeouts: [], timers: {} };

  const dbTimers = await getTimers(channelId);

  intervalsForChannels[channel].timeouts = dbTimers.map((timer) => {
    intervalsForChannels[channel].timers[timer.id] = {
      messageSinceLast: 0,
      waitingFor: -1
    };
    return createInterval(client, timer, channel, channelId);
  });

  console.log(intervalsForChannels)
};

const processMessage = async (
  client: Client,
  channel: string,
  channelId: string
) => {
  const timerForChannel = intervalsForChannels[channel].timers
  if (timerForChannel) {
    for (const key of Object.keys(
      timerForChannel
    ) as unknown as number[]) {
      timerForChannel[key].messageSinceLast += 1;
      timerForChannel[key].waitingFor -= 1;
      if (timerForChannel[key].waitingFor == 0) {
        const timer = await getTimer(channelId, Number(key));
        console.log(timer)
        if (timer) {
          timerForChannel[key].messageSinceLast = 0;
          sendMessage(client, channel, channelId, timer.message);
          intervalsForChannels[channel].timeouts.push(createInterval(client, timer, channel, channelId));
        }
      }
    }
  }
};

const createInterval = (client: Client, timer: Timer, channel: string, channelId: string) => {
  const interval = setInterval(() => {
    const timerForChannel = intervalsForChannels[channel].timers[timer.id]
    if (
      !timer.nbMessage ||
      timerForChannel.messageSinceLast >= timer.nbMessage
    ) {
      sendMessage(client, channel, channelId, timer.message);
      timerForChannel.messageSinceLast = 0;
    } else {
      timerForChannel.waitingFor = timer.nbMessage - timerForChannel.messageSinceLast;
      clearInterval(interval);
      const index = intervalsForChannels[channel].timeouts.indexOf(interval);
      if (index > -1) intervalsForChannels[channel].timeouts.splice(index, 1);
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