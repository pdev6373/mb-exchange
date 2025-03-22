import nodemailer from 'nodemailer';

type SendMail = {
  subject: string;
  text?: string;
  to: string;
  html?: string;
};

export const sendMail = async ({ subject, text, to, html }: SendMail) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};
