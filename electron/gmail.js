// electron/gmail.js
import { google } from "googleapis";

export async function listEmails(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const query = `after:${yesterday}`;

  const res = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 10,
  });

  if (!res.data.messages) return [];

  const emails = [];

  for (const msg of res.data.messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
    });

    const headers = detail.data.payload.headers;
    const subject =
      headers.find((h) => h.name === "Subject")?.value || "(no subject)";
    const from = headers.find((h) => h.name === "From")?.value || "(unknown)";
    emails.push({ from, subject });
  }

  return emails;
}
