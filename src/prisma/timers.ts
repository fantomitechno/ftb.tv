import { prisma } from "./index.js";

const getTimers = async (channelId: string) => {
  return prisma.timer.findMany({ where: { channelId } });
};

const getTimer = async (channelId: string, timerId: number) => {
  return prisma.timer.findFirst({ where: { channelId, id: timerId } });
};

export { getTimer, getTimers };
