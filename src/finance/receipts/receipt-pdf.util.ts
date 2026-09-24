import { BeneficiaryType } from '@prisma/client';
import PDFDocument from 'pdfkit';

export interface ReceiptIssuer {
  name: string;
  taxId?: string;
  address?: string;
}

export interface ReceiptPdfData {
  issuer: ReceiptIssuer;
  receiptNumber: string;
  issuedAt: Date;
  donorName: string;
  donorEmail?: string | null;
  taxId?: string | null;
  amount: string;
  currency: string;
  campaignName?: string | null;
  allocations: Array<{ beneficiaryType: BeneficiaryType; amount: string }>;
}

const BENEFICIARY_LABELS: Record<BeneficiaryType, string> = {
  JUNTA: 'Fondo general de la Junta',
  FESTIVAL: 'Festividad',
  FESTIVAL_EDITION: 'Edición de la festividad',
  PROCESSIONAL_STEP: 'Paso procesional',
  EVENT: 'Evento',
  PROJECT: 'Proyecto',
};

export function formatMoney(amount: string, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(date);
}

/** Renders the donor-facing receipt. Pure: same data → same content. */
export function renderReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 56,
      info: {
        Title: `Recibo de donación ${data.receiptNumber}`,
        Author: data.issuer.name,
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(18).text(data.issuer.name);
    doc.font('Helvetica').fontSize(10);
    if (data.issuer.taxId) doc.text(`NIT ${data.issuer.taxId}`);
    if (data.issuer.address) doc.text(data.issuer.address);
    doc.moveDown(0.5);
    doc.fontSize(12).text('Recibo de donación');
    doc.moveDown(1.5);

    const field = (label: string, value: string) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
      doc.font('Helvetica').text(value);
    };
    field('Número de recibo', data.receiptNumber);
    field('Fecha de emisión', formatDate(data.issuedAt));
    field('Donante', data.donorName);
    if (data.donorEmail) field('Correo', data.donorEmail);
    if (data.taxId) field('Documento del donante', data.taxId);
    if (data.campaignName) field('Campaña', data.campaignName);
    doc.moveDown();

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`Monto donado: ${formatMoney(data.amount, data.currency)}`);
    doc.moveDown();

    if (data.allocations.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('Destino de la donación');
      doc.font('Helvetica');
      for (const allocation of data.allocations) {
        doc.text(
          `• ${BENEFICIARY_LABELS[allocation.beneficiaryType]}: ${formatMoney(
            allocation.amount,
            data.currency,
          )}`,
        );
      }
      doc.moveDown();
    }

    doc
      .fontSize(10)
      .fillColor('#555555')
      .text(
        'Gracias por apoyar la preservación de la Semana Santa de Timbío. ' +
          'Este recibo certifica que la donación fue recibida y confirmada.',
      );

    doc.end();
  });
}
