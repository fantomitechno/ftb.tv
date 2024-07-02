import { prisma } from "./index.js";

const addCommand = async (
  channelId: string,
  commandName: string,
  message: string
) => {
  if (
    await prisma.command.findFirst({
      where: {
        commandName,
        channelId,
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
    !(await prisma.command.findFirst({
      where: {
        commandName,
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

const listCommand = async (channelId: string, isMod: boolean) => {
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
  return isMod
    ? [
      ...dbCommands.map((c) => c.commandName),
      "add-com",
      "del-com",
      "list-com",
      "title",
      "so",
      "followmode",
      "emotemode",
      "submode",
      "slowmode",
      "timer-reload"
    ].sort()
    : dbCommands.map((c) => c.commandName);
};

const getCommand = async (channelId: string, commandName: string) => {
  return await prisma.command.findFirst({ where: { commandName, channelId } });
};


export {
  addCommand,
  delCommand,
  listCommand,
  getCommand
}