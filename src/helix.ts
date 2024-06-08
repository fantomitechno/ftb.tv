import { getTemplate, getToken } from "./prisma.js";

const modifyTitle = async (newTitle: string) => {
  const template = await getTemplate();
  const title = template ? template.title.replace("{}", newTitle) : newTitle;

  const req = await fetch(
    "https://api.twitch.tv/helix/channels?broadcaster_id=" +
      process.env.BROADCASTER_ID,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${await getToken()}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
      }),
    }
  );
  if (req.status != 204) {
    console.log(await req.json());
    return false;
  }
  return true;
};

const getTitle = async () => {
  const req = await fetch(
    "https://api.twitch.tv/helix/channels?broadcaster_id=" +
      process.env.BROADCASTER_ID,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getToken()}`,
        "Client-Id": process.env.TWITCH_ID!,
      },
    }
  );

  return (await req.json()).data[0].title;
};

export { modifyTitle, getTitle };
