import { prisma } from "./index.js";

const getWarns = async (userId: string, channelId: string) => {
  return await prisma.warning.findMany({
    where: {
      userId,
      channelId,
      date: {
        gte: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      },
    },
  });
};

const addWarn = async (
  channelId: string,
  userName: string,
  userId: string,
  reason: string
) => {
  await prisma.user.upsert({
    where: {
      id: userId,
    },
    create: {
      id: userId,
      name: userName,
    },
    update: {
      name: userName,
    },
  });

  await prisma.warning.create({
    data: {
      channelId,
      userId: userId,
      reason,
    },
  });
};

export { getWarns, addWarn }