import { prisma } from "./index.js";

const getSettings = async (channelId: string) => {
  return prisma.settings.findUnique({ where: { channelId }, include: { linkFilters: true, banwords: true } });
};

export { getSettings };
