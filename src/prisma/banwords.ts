import { prisma } from "./index.js";

const getGlobalBanWords = () => {
  return prisma.banWords.findFirst({ where: { channelId: "global" } });
};

export { getGlobalBanWords };
