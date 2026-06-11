import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { assertEnquiryConfig, getServerConfig } from "./config.server";

export type EnquiryPayload = {
  name: string;
  phone: string;
  budget: string;
  message: string;
};

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!transporter) {
    const config = getServerConfig();
    assertEnquiryConfig(config);
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }
  return transporter;
}

function buildEmailBodies(enquiry: EnquiryPayload) {
  const lines = [
    `Name: ${enquiry.name}`,
    `Phone: ${enquiry.phone}`,
    `Budget: ${enquiry.budget}`,
    `Message: ${enquiry.message || "(none)"}`,
  ];
  const text = lines.join("\n");
  const html = `
    <h2>New Vishnu Kuteer enquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(enquiry.phone)}</p>
    <p><strong>Budget:</strong> ${escapeHtml(enquiry.budget)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(enquiry.message || "(none)")}</p>
  `.trim();
  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendEnquiryEmail(enquiry: EnquiryPayload): Promise<void> {
  const config = getServerConfig();
  const { text, html } = buildEmailBodies(enquiry);
  await getTransporter().sendMail({
    from: config.smtpFrom,
    to: config.clientEmail,
    subject: `New Vishnu Kuteer enquiry from ${enquiry.name}`,
    text,
    html,
  });
}
