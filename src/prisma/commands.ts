import { prisma } from "./index.js";

const addCommand = async (
  channelId: string,
  commandName: string,
  message: string
) => {
  if (
    await prisma.command.findUnique({
      where: {
        channelCommand: {
          channelId,
          commandName
        }
      },
    })
  ) {
    return false;
  }
  await prisma.command.create({
    data: {
      commandName,
      message,
      channelId,
    },
  });
  return true;
};

const delCommand = async (channelId: string, commandName: string) => {
  if (
    !(await prisma.command.findUnique({
      where: {
        channelCommand: {
          channelId,
          commandName
        }
      },
    }))
  ) {
    return false;
  }
  await prisma.command.delete({
    where: {
      channelCommand: {
        channelId,
        commandName,
      },
    },
  });
  return true;
};

const listCommand = async (channelId: string, toAdd: string[], isMod: boolean) => {
  const dbCommands = await prisma.command.findMany({
    where: {
      channelId,
      OR: [
        {
          isMod: isMod,
        },
        {
          isMod: false,
        },
      ],
    },
  });
  return [
    ...dbCommands.map((c) => c.commandName),
    ...toAdd
  ].sort()
};

const getCommand = async (channelId: string, commandName: string) => {
  return await prisma.command.findUnique({ where: { channelCommand: { channelId, commandName } } });
};

export { addCommand, delCommand, listCommand, getCommand };
