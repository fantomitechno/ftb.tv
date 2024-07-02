const getUserId = async (login?: string) => {
  const req = await fetch(
    "https://api.twitch.tv/helix/users" + (login ? "?login=" + login : ""),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_TOKEN}`,
        "Client-Id": process.env.TWITCH_ID!,
        "Content-Type": "application/json",
      },
    }
  );

  const data = (await req.json()).data[0];
  return data?.id;
};

export { getUserId };
