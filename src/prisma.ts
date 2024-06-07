import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addCommand = async (commandName: string, message: string) => {
  if (await prisma.command.findFirst({
    where: {
      commandName,
    }
  })) {
    throw new Error("Command already exist")
  }
  await prisma.command.create({
    data: {
      commandName,
      message
    }
  })
}

const delCommand = async (commandName: string) => {
  if (!await prisma.command.findFirst({
    where: {
      commandName,
    }
  })) {
    throw new Error("Command doesn't exist")
  }
  await prisma.command.delete({
    where: {
      commandName
    }
  })
}

const listCommand = async (isMod: boolean) => {
  const dbCommands = await prisma.command.findMany();
  return isMod ? [...dbCommands.map(c => c.commandName), "add-com", "del-com", "list-com"] : dbCommands.map(c => c.commandName);
}

const getCommand = async (commandName: string) => {
  return await prisma.command.findFirst({ where: { commandName } });
}

export { addCommand, listCommand, getCommand, delCommand }