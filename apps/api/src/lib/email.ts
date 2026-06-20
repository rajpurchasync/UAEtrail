/**
 * Transactional email — logs in dev; wire SMTP/SendGrid in production via env.
 */
export type EmailTemplate =
  | 'request_approved'
  | 'request_rejected'
  | 'event_cancelled';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

const templateSubjects: Record<EmailTemplate, string> = {
  request_approved: 'Your trip request was approved',
  request_rejected: 'Update on your trip request',
  event_cancelled: 'A trip you joined was cancelled'
};

export const sendTransactionalEmail = async (
  template: EmailTemplate,
  to: string,
  vars: Record<string, string>
): Promise<void> => {
  const subject = templateSubjects[template];
  const body = Object.entries(vars).reduce(
    (text, [key, val]) => text.replace(new RegExp(`{{${key}}}`, 'g'), val),
    getTemplateBody(template)
  );

  const payload: EmailPayload = { to, subject, body };

  if (process.env.SMTP_URL || process.env.SENDGRID_API_KEY) {
    // Production: integrate provider here
    console.info('[email] queued', { template, to, subject });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[email:dev]', payload);
  }
};

function getTemplateBody(template: EmailTemplate): string {
  switch (template) {
    case 'request_approved':
      return 'Hi {{name}}, your request to join {{eventTitle}} on {{eventDate}} was approved. See you on the trail!';
    case 'request_rejected':
      return 'Hi {{name}}, your request to join {{eventTitle}} was not approved. {{note}}';
    case 'event_cancelled':
      return 'Hi {{name}}, {{eventTitle}} on {{eventDate}} has been cancelled by the organizer.';
    default:
      return '';
  }
}

export const notifyRequestDecision = async (opts: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: string;
  approved: boolean;
  note?: string;
}) => {
  await sendTransactionalEmail(
    opts.approved ? 'request_approved' : 'request_rejected',
    opts.to,
    {
      name: opts.userName,
      eventTitle: opts.eventTitle,
      eventDate: opts.eventDate,
      note: opts.note ?? ''
    }
  );
};

export const notifyEventCancelled = async (opts: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: string;
}) => {
  await sendTransactionalEmail('event_cancelled', opts.to, {
    name: opts.userName,
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate
  });
};
