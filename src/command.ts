import { existsSync, writeFileSync, readFileSync } from "fs";
import { parse, stringify } from "smol-toml";

const fileExists = (path: string) => {
  return existsSync(path);
};

type Command = {
  respond: boolean;
  value: string;
};

export const getCommand = async (command: string) => {
  const path = `./commands.toml`;
  if (!fileExists(path)) {
    console.log(`Creating commands.toml`);
    const data: { [key: string]: Command } = {
      "example": {
        value: "This is an example command",
        respond: false
      }
    };
    writeFileSync(path, stringify(data));
    return null;
  }

  const input = readFileSync(path, "utf-8");
  const data = parse(input);
  const cmd = data[command];
  return cmd as Command;
};

export const commandList = async () => {
  const path = `./commands.toml`;
  if (!fileExists(path)) {
    console.log(`Creating commands.toml`);
    const data: { [key: string]: Command } = {
      "example": {
        value: "This is an example command",
        respond: false
      }
    };
    writeFileSync(path, stringify(data));
    return null;
  }

  const input = readFileSync(path, "utf-8");
  const data = parse(input);
  return Object.keys(data);
}
