import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SubmissionNotificationParams {
  clientName: string;
  clientEmail: string;
  companyName: string;
  month: string;
  year: number;
  statements: { institutionName: string; accountLast4: string; institutionType: string; fileName: string }[];
}

export async function sendSubmissionNotification({
  clientName,
  clientEmail,
  companyName,
  month,
  year,
  statements,
}: SubmissionNotificationParams) {
  const statementRows = statements
    .map(
      (s) =>
        `<tr><td style="padding:8px;border:1px solid #e5e7eb">${s.institutionName}</td><td style="padding:8px;border:1px solid #e5e7eb">••••${s.accountLast4}</td><td style="padding:8px;border:1px solid #e5e7eb">${s.institutionType}</td><td style="padding:8px;border:1px solid #e5e7eb">${s.fileName}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#991b1b">New Monthly Statements Submitted</h2>
      <p><strong>Client:</strong> ${clientName} (${clientEmail})</p>
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Period:</strong> ${month} ${year}</p>
      <p><strong>Statements (${statements.length}):</strong></p>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Institution</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Acct #</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Type</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">File</th>
          </tr>
        </thead>
        <tbody>${statementRows}</tbody>
      </table>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">Log in to your dashboard to begin categorization.</p>
    </div>
  `;

  await resend.emails.send({
    from: "MyBookkeepers.com <noreply@mybookkeepers.com>",
    to: process.env.NOTIFICATION_EMAIL!,
    subject: `${companyName} — ${month} ${year} Statements Ready`,
    html,
  });
}

interface CompletionNotificationParams {
  clientName: string;
  clientEmail: string;
  companyName: string;
  month: string;
  year: number;
}

export async function sendCompletionNotification({
  clientName,
  clientEmail,
  companyName,
  month,
  year,
}: CompletionNotificationParams) {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#991b1b">Your Bookkeeping is Complete!</h2>
      <p>Hi ${clientName || "there"},</p>
      <p>Great news! Your bookkeeping for <strong>${month} ${year}</strong> has been completed by the MyBookkeepers.com team.</p>
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Period:</strong> ${month} ${year}</p>
      <p>If you have any questions, please don't hesitate to reach out.</p>
      <p style="margin-top:24px">Thank you for choosing MyBookkeepers.com!</p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">— The MyBookkeepers.com Team</p>
    </div>
  `;

  await resend.emails.send({
    from: "MyBookkeepers.com <noreply@mybookkeepers.com>",
    to: clientEmail,
    subject: `Your bookkeeping for ${month} ${year} is complete — ${companyName}`,
    html,
  });
}
