import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER!,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER!,
    pass: process.env.EMAIL_SERVER_PASSWORD!,
  },
});
export const mailOptions = {
  from: `"Pfarre Emmaus am Wienerberg" <noreply@emmaus.wien>`, // sender address
};
