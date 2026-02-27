// src/lib/services/mail.service.ts
import Mailgun from "mailgun.js";
import formData from "form-data";

const mg = new Mailgun(formData);
const client = mg.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "",
});

export async function sendEmailBackend(to: string, subject: string, text: string) {
  return client.messages.create(process.env.MAILGUN_DOMAIN || "", {
    from: process.env.MAILGUN_SENDER || "",
    to,
    subject,
    text,
  });
}