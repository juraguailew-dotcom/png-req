import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn('Resend API key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export const emailTemplates = {
  requisitionApproved: (requisitionId, total) => ({
    subject: 'Requisition Approved',
    html: `
      <h2>Your request has been approved</h2>
      <p>Request ID: ${requisitionId}</p>
      <p>Total Amount: K${total}</p>
      <p>You can now proceed with the request.</p>
    `,
  }),

  requisitionRejected: (requisitionId, reason) => ({
    subject: 'Request Rejected',
    html: `
      <h2>Your request has been rejected</h2>
      <p>Request ID: ${requisitionId}</p>
      <p>Reason: ${reason}</p>
    `,
  }),

  lowStockAlert: (productName, stock) => ({
    subject: 'Low Stock Alert',
    html: `
      <h2>Low Stock Alert</h2>
      <p>Product "${productName}" is running low on stock.</p>
      <p>Current stock: ${stock} units</p>
      <p>Please restock soon.</p>
    `,
  }),

  newMessage: (senderName, preview) => ({
    subject: `New message from ${senderName}`,
    html: `
      <h2>You have a new message</h2>
      <p>From: ${senderName}</p>
      <p>${preview}</p>
      <p>Login to view the full message.</p>
    `,
  }),
};
