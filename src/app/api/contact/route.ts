import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { contactFormRateLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = contactFormRateLimiter.check(`contact:${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Too many submissions from this connection. Please wait ${rateCheck.retryAfterSec} seconds before submitting again.`,
          retryAfter: rateCheck.retryAfterSec,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSec),
            "X-RateLimit-Limit": String(rateCheck.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateCheck.reset),
          },
        }
      );
    }

    const body = await req.json();
    const { name, email, phone, queryType, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Please fill in all required fields (Name, Email, Message)." },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || "sales@femmeflo.in";

    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';

    // Format Ultra-Premium Mobile-Responsive HTML Email Template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Femmeflo Inquiry</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .content-padding { padding: 18px 14px !important; }
      .mobile-stack { display: block !important; width: 100% !important; margin-bottom: 8px !important; }
      .action-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; margin-right: 0 !important; margin-bottom: 10px !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Card Container -->
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 35px rgba(0,0,0,0.07); border: 1px solid #e5e7eb; max-width: 600px; width: 100%;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #156035; padding: 28px 24px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; font-family: Georgia, serif;">Femmeflo</span>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px; color: #a7f3d0; margin-top: 4px; font-weight: 700;">Feel Fresh. Feel Free.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subheader / Status Badge Bar -->
          <tr>
            <td style="background-color: #FAF5F7; padding: 12px 24px; border-bottom: 1px solid #f3e8ff;" align="center">
              <span style="display: inline-block; background-color: #E61C5D; color: #ffffff; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                🌸 NEW WEBSITE CONTACT INQUIRY
              </span>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="content-padding" style="padding: 28px 24px;">
              <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #111827;">
                Inquiry Details
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                A visitor submitted a new inquiry via the Femmeflo Contact Form (<code style="background-color: #EBF6EF; padding: 2px 6px; border-radius: 4px; color: #156035; font-size: 12px;">/contact</code>).
              </p>

              <!-- Customer Details Card Table -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 20px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #4b5563; width: 36%;">
                    👤 Customer Name:
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: 700; color: #111827;">
                    ${name}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #4b5563;">
                    ✉️ Email Address:
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: 600;">
                    <a href="mailto:${email}" style="color: #E61C5D; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #4b5563;">
                    📞 Contact Phone:
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: 600; color: #111827;">
                    ${phone ? `<a href="tel:${cleanPhone}" style="color: #156035; text-decoration: none;">${phone}</a>` : '<span style="color: #9ca3af; font-style: italic;">Not Provided</span>'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; font-size: 13px; font-weight: 700; color: #4b5563;">
                    🏷️ Query Category:
                  </td>
                  <td style="padding: 14px 16px; font-size: 14px; font-weight: 700; color: #E61C5D;">
                    ${queryType || 'General Product Inquiry'}
                  </td>
                </tr>
              </table>

              <!-- Customer Message Box -->
              <div style="background-color: #FFF5F7; border-left: 4px solid #E61C5D; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #E61C5D; letter-spacing: 0.5px; margin-bottom: 6px;">
                  💬 CUSTOMER MESSAGE
                </span>
                <p style="margin: 0; font-size: 14px; color: #1f2937; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${message}</p>
              </div>

              <!-- Quick Action Call-To-Action Buttons -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${email}?subject=Re:%20Femmeflo%20Inquiry" class="action-btn" style="display: inline-block; background-color: #E61C5D; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 22px; border-radius: 8px; margin-right: 8px; margin-bottom: 8px;">
                      ✉️ Reply Directly to ${name}
                    </a>
                    ${phone ? `
                    <a href="https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}" class="action-btn" style="display: inline-block; background-color: #25D366; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 22px; border-radius: 8px; margin-bottom: 8px;">
                      💬 Chat on WhatsApp
                    </a>
                    ` : ''}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Notice -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; line-height: 1.5;">
              <strong style="color: #111827;">Masako Enterprises Private Limited</strong><br>
              Femmeflo Official Website Notification System<br>
              <span style="font-size: 11px; color: #9ca3af; margin-top: 4px; display: block;">This email was automatically generated from visitor submission on <a href="https://femmeflo.in" style="color: #156035; text-decoration: none;">femmeflo.in</a></span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Femmeflo Web Form" <${smtpUser}>`,
        to: receiverEmail,
        replyTo: email,
        subject: `[Femmeflo Query] New Inquiry from ${name}`,
        html: htmlContent,
      });

      return NextResponse.json({ success: true, message: "Email sent successfully via SMTP!" });
    } else {
      // Log for development / fallback mode when SMTP creds are pending
      console.log("=== NEW FEMMEFLO CONTACT ENQUIRY ===");
      console.log("Name:", name);
      console.log("Email:", email);
      console.log("Phone:", phone);
      console.log("Message:", message);
      console.log("=====================================");

      return NextResponse.json({
        success: true,
        message: "Enquiry received! (Dev mode: Configure SMTP in .env to send real emails)",
      });
    }
  } catch (err: unknown) {
    console.error("Error in contact API route:", err);
    const message = err instanceof Error ? err.message : "Failed to process enquiry";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
