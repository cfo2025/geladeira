import "server-only";
import { Resend } from "resend";
import { formatCurrency } from "@/lib/format";

const FROM = process.env.RESEND_FROM_EMAIL ?? "Loja Honesta <onboarding@resend.dev>";

function getClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY não configurada — e-mail não enviado.");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendEmail(to: string, subject: string, html: string) {
  const resend = getClient();
  if (!resend) return;

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] Falha ao enviar e-mail:", err);
  }
}

function wrapper(title: string, body: string) {
  return `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #18181b;">
      <h2 style="margin-bottom: 16px;">${title}</h2>
      ${body}
      <p style="margin-top: 32px; font-size: 12px; color: #71717a;">Loja Honesta</p>
    </div>
  `;
}

export async function sendWelcomeEmail(to: string, fullName: string, tempPassword: string) {
  await sendEmail(
    to,
    "Bem-vindo(a) à Loja Honesta",
    wrapper(
      `Olá, ${fullName}!`,
      `<p>Sua conta na Loja Honesta foi criada.</p>
       <p>E-mail de acesso: <strong>${to}</strong><br/>Senha temporária: <strong>${tempPassword}</strong></p>
       <p>No primeiro acesso você será solicitado(a) a definir uma nova senha.</p>`
    )
  );
}

export async function sendPaymentDeclaredEmail(to: string, fullName: string, amount: number) {
  await sendEmail(
    to,
    "Recebemos sua declaração de pagamento",
    wrapper(
      `Olá, ${fullName}!`,
      `<p>Recebemos sua declaração de pagamento de <strong>${formatCurrency(amount)}</strong>.</p>
       <p>Um administrador vai conferir o valor recebido e você será notificado(a) do resultado.</p>`
    )
  );
}

export async function sendPaymentReviewedEmail(
  to: string,
  fullName: string,
  decision: "approved" | "rejected_divergent" | "rejected_unpaid",
  notes?: string | null
) {
  const messages: Record<typeof decision, { subject: string; body: string }> = {
    approved: {
      subject: "Pagamento aprovado",
      body: "<p>Seu pagamento foi conferido e aprovado. Obrigado!</p>",
    },
    rejected_divergent: {
      subject: "Divergência encontrada no seu pagamento",
      body: `<p>Encontramos uma divergência entre o valor declarado e o valor recebido.</p>${
        notes ? `<p>Observações: ${notes}</p>` : ""
      }<p>Acesse a Loja Honesta para ver os detalhes.</p>`,
    },
    rejected_unpaid: {
      subject: "Pagamento não identificado",
      body: `<p>Não conseguimos identificar o recebimento do seu pagamento.</p>${
        notes ? `<p>Observações: ${notes}</p>` : ""
      }<p>Acesse a Loja Honesta para ver os detalhes.</p>`,
    },
  };

  const { subject, body } = messages[decision];
  await sendEmail(to, subject, wrapper(`Olá, ${fullName}!`, body));
}

export async function sendCancellationDecisionEmail(
  to: string,
  fullName: string,
  approved: boolean,
  productName: string
) {
  await sendEmail(
    to,
    approved ? "Cancelamento aprovado" : "Cancelamento rejeitado",
    wrapper(
      `Olá, ${fullName}!`,
      approved
        ? `<p>Sua solicitação de cancelamento da retirada de "${productName}" foi aprovada.</p>`
        : `<p>Sua solicitação de cancelamento da retirada de "${productName}" foi rejeitada.</p>`
    )
  );
}
