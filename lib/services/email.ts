import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Lazy initialization of Resend - only create instance when needed
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Email functionality will be disabled.");
    return null;
  }
  
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  
  return resendInstance;
}

const FROM_EMAIL = process.env.RESEND_FROM || "noreply@zyronstudio.de";

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(appointmentId: string) {
  if (!prisma) {
    throw new Error("Database not available");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      customer: true,
      barber: {
        include: {
          user: true,
        },
      },
      appointmentServices: {
        include: {
          service: {
            include: {
              translations: true,
            },
          },
        },
      },
    },
  });

  if (!appointment || !appointment.customer.email) {
    throw new Error("Appointment or customer email not found");
  }

  const formattedDate = new Date(appointment.startTime).toLocaleString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const servicesList = appointment.appointmentServices
    .map((as) => as.service.slug)
    .join(", ");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #0a0a0a;
            color: #fafafa;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #171717;
            padding: 30px;
            border-radius: 8px;
          }
          .header {
            color: #fbbf24;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .content {
            line-height: 1.6;
          }
          .appointment-details {
            background-color: #262626;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #fbbf24;
            color: #0a0a0a;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Zyron Barber Studio</div>
          <div class="content">
            <p>Hallo ${appointment.customer.name},</p>
            <p>Ihr Termin wurde erfolgreich gebucht!</p>
            <div class="appointment-details">
              <p><strong>Datum & Uhrzeit:</strong> ${formattedDate}</p>
              <p><strong>Friseur:</strong> ${appointment.barber.displayName}</p>
              <p><strong>Leistungen:</strong> ${servicesList}</p>
              <p><strong>Preis:</strong> €${appointment.totalPrice}</p>
            </div>
            <p>Wir freuen uns auf Ihren Besuch!</p>
            <a href="${process.env.NEXTAUTH_URL}/account" class="button">Mein Konto ansehen</a>
          </div>
        </div>
      </body>
    </html>
  `;

  const resend = getResend();
  if (!resend) {
    console.warn("Cannot send booking confirmation email: RESEND_API_KEY is not configured");
    return; // Silently fail if email is not configured
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: appointment.customer.email,
      subject: "Terminbestätigung - Zyron Barber Studio",
      html,
    });
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #0a0a0a;
            color: #fafafa;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #171717;
            padding: 30px;
            border-radius: 8px;
          }
          .header {
            color: #fbbf24;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #fbbf24;
            color: #0a0a0a;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Zyron Barber Studio</div>
          <p>Sie haben eine Passwort-Zurücksetzung angefordert.</p>
          <p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
          <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
          <p>Dieser Link ist 1 Stunde gültig.</p>
          <p>Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
        </div>
      </body>
    </html>
  `;

  const resend = getResend();
  if (!resend) {
    console.warn("Cannot send password reset email: RESEND_API_KEY is not configured");
    return; // Silently fail if email is not configured
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Passwort zurücksetzen - Zyron Barber Studio",
      html,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

