import { Client } from "tmi.js";
import { getTimers } from "./prisma";

const intervalsForChannel: { [channel: string]: NodeJS.Timeout[] } = {};

const waitingForMessages: { [channel: string]: number[] } = {};
const numberOfMessagesSinceLast: { [channel: string]: { timer: number, number: number }[] } = {};

const init = async (client: Client, channelId: string, channel: string) => {
  const intervals = intervalsForChannel[channel];
  if (intervals) {
    intervals.forEach(i => clearInterval(i));
  }

  numberOfMessagesSinceLast[channel] = [];
  waitingForMessages[channel] = [];

  const dbTimers = await getTimers(channelId);

  intervalsForChannel[channel] = dbTimers.map(timer => {
    numberOfMessagesSinceLast[channel].push({ timer: timer.id, number: 0 })
    const interval = setInterval(() => {
      if (!timer.nbMessage || numberOfMessagesSinceLast[channel].find(t => t.timer == timer.id)!.number > timer.nbMessage) {
        client.say(channel, timer.message)
      } else {
        waitingForMessages[channel].push(timer.id)
      }
    }, timer.repeatTime);
    return interval;
  })
}

const processMessage = async (channel: string, channelId: string) => {
  numberOfMessagesSinceLast[channel].forEach(t => t.number += 1);
  const waitings = waitingForMessages[channel];
  if (waitings) {

  }
}

// use structure like: waiting[channel][command]
// so Object.values(waiting[channel])