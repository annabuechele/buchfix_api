import * as nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

//types
import UserType from "../types/userType";

const mailSender: (
  email: string,
  reason: "Verifikation" | "Buch-Spende" | "Beobachtung",
  user: UserType
) => void = async (email, reason, user) => {
  const nodemailerconfig: SMTPTransport.Options = {
    service: "Gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  };

  let text: string;
  if (reason === "Verifikation")
    text = `Sehr geehrte/r Frau/Herr ${user.name.firstName} ${user.name.lastName}\n\nVielen Dank, dass Sie sich für uns entschieden haben! \nIhr Benutzer wurde mit dem Benutzernamen ${user.username} erstellt.\nSie können sich unter https://app.buchfix.at/login nun einloggen!\n\nViel Spaß beim lesen\nBuchfix `;
  if (reason === "Buch-Spende") text = "Buch-Spende";
  if (reason === "Beobachtung") text = "Beobachtung";

  const sender = await nodemailer.createTransport(nodemailerconfig);

  const mailoptions: Mail.Options = {
    from: "Buchfix",
    to: email,
    subject: "Buchfix Bücherei - " + reason,
    text: text,
  };

  const info = await sender.sendMail(mailoptions);

  console.log("Mail was sent to:", mailoptions.to);
  console.log("Mail reason:", reason);
};

export default mailSender;
