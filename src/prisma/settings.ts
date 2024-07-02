import { prisma } from "./index.js";

const getSettings = async (channelId: string) => {
  return prisma.settings.findFirst({ where: { channelId } });
};

export { getSettings }