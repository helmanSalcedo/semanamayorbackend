import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DonationReceipt, MediaType, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import type { AppConfig } from '../config/configuration';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  type ReceiptIssuer,
  formatMoney,
  renderReceiptPdf,
} from './receipts/receipt-pdf.util';

const STORAGE_PROVIDER = 'firebase';
const PDF_MIME = 'application/pdf';

const RECEIPT_CONTEXT_INCLUDE = {
  receipt: true,
  allocations: true,
  campaign: { select: { name: true } },
  donorPerson: { select: { displayName: true } },
} as const;

type ReceiptContext = Prisma.DonationGetPayload<{
  include: typeof RECEIPT_CONTEXT_INCLUDE;
}> & { receipt: DonationReceipt };

export interface ReceiptPdfFile {
  filename: string;
  content: Buffer;
}

export interface ReceiptDeliveryResult {
  pdfStored: boolean;
  emailSent: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Turns a DonationReceipt row into something the donor actually gets: a PDF
 * (archived privately in storage, since it carries donor PII) and an email
 * with that PDF attached.
 */
@Injectable()
export class DonationReceiptsService {
  private readonly logger = new Logger(DonationReceiptsService.name);
  private readonly issuer: ReceiptIssuer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
    configService: ConfigService,
  ) {
    const { receipts } = configService.get<AppConfig>('app')!;
    this.issuer = {
      name: receipts.issuerName,
      taxId: receipts.issuerTaxId,
      address: receipts.issuerAddress,
    };
  }

  /**
   * Called right after a donation is confirmed (outside its DB transaction).
   * Never throws: a down SMTP server or unconfigured storage must not undo
   * or fail a confirmation that a payment webhook already depends on — the
   * admin can retry later via resend().
   */
  async deliverAfterConfirm(donationId: string): Promise<void> {
    try {
      await this.deliver(donationId, false);
    } catch (error) {
      this.logger.error(
        `No se pudo entregar el recibo de la donación ${donationId}`,
        (error as Error).stack,
      );
    }
  }

  /** Admin retry: archives the PDF if missing and re-sends the email. */
  async resend(donationId: string): Promise<ReceiptDeliveryResult> {
    return this.deliver(donationId, true);
  }

  async getPdf(donationId: string): Promise<ReceiptPdfFile> {
    const ctx = await this.loadContext(donationId);
    const filename = this.filename(ctx);

    if (ctx.receipt.pdfMediaAssetId && this.storage.isConfigured) {
      const asset = await this.prisma.mediaAsset.findUnique({
        where: { id: ctx.receipt.pdfMediaAssetId },
      });
      if (asset && !asset.deletedAt) {
        return {
          filename,
          content: await this.storage.download(asset.storageKey),
        };
      }
    }

    return { filename, content: await this.render(ctx) };
  }

  private async deliver(
    donationId: string,
    strict: boolean,
  ): Promise<ReceiptDeliveryResult> {
    const ctx = await this.loadContext(donationId);
    if (strict && !ctx.donorEmail) {
      throw new BadRequestException(
        'La donación no tiene correo del donante: descargue el PDF y entréguelo manualmente',
      );
    }

    const pdf = await this.render(ctx);
    const pdfStored = await this.archive(ctx, pdf);

    if (!ctx.donorEmail) {
      return { pdfStored, emailSent: false };
    }
    await this.mail.send({
      to: ctx.donorEmail,
      subject: `Recibo de tu donación ${ctx.receipt.receiptNumber} — ${this.issuer.name}`,
      html: this.emailHtml(ctx),
      attachments: [
        { filename: this.filename(ctx), content: pdf, contentType: PDF_MIME },
      ],
    });
    return { pdfStored, emailSent: true };
  }

  /**
   * Stores the issued PDF once, privately, and links it via
   * receipt.pdfMediaAssetId. Skipped (not an error) when storage isn't
   * configured: getPdf() then re-renders it from the DB on demand.
   */
  private async archive(ctx: ReceiptContext, pdf: Buffer): Promise<boolean> {
    if (ctx.receipt.pdfMediaAssetId) {
      return true;
    }
    if (!this.storage.isConfigured) {
      return false;
    }

    const issuedYear = ctx.receipt.issuedAt.getUTCFullYear();
    const path = `receipts/${issuedYear}/${ctx.receipt.receiptNumber}.pdf`;
    const uploaded = await this.storage.upload(pdf, path, PDF_MIME, {
      public: false,
    });

    await this.prisma.$transaction(async (tx) => {
      const asset = await tx.mediaAsset.create({
        data: {
          type: MediaType.DOCUMENT,
          url: uploaded.url,
          storageProvider: STORAGE_PROVIDER,
          storageKey: uploaded.storageKey,
          filename: this.filename(ctx),
          mimeType: PDF_MIME,
          sizeBytes: BigInt(pdf.length),
          checksum: createHash('sha256').update(pdf).digest('hex'),
        },
      });
      await tx.donationReceipt.update({
        where: { id: ctx.receipt.id },
        data: { pdfMediaAssetId: asset.id },
      });
    });
    return true;
  }

  private render(ctx: ReceiptContext): Promise<Buffer> {
    return renderReceiptPdf({
      issuer: this.issuer,
      receiptNumber: ctx.receipt.receiptNumber,
      issuedAt: ctx.receipt.issuedAt,
      donorName: this.donorName(ctx),
      donorEmail: ctx.donorEmail,
      taxId: ctx.receipt.taxIdSnapshot,
      amount: ctx.amount.toString(),
      currency: ctx.currency,
      campaignName: ctx.campaign?.name,
      allocations: ctx.allocations.map((a) => ({
        beneficiaryType: a.beneficiaryType,
        amount: a.amount.toString(),
      })),
    });
  }

  private emailHtml(ctx: ReceiptContext): string {
    const name = escapeHtml(this.donorName(ctx));
    const amount = escapeHtml(formatMoney(ctx.amount.toString(), ctx.currency));
    const campaign = ctx.campaign
      ? ` para la campaña <strong>${escapeHtml(ctx.campaign.name)}</strong>`
      : '';
    return (
      `<p>Hola ${name},</p>` +
      `<p>Confirmamos tu donación de <strong>${amount}</strong>${campaign}. ¡Muchas gracias por tu apoyo!</p>` +
      `<p>Adjuntamos tu recibo número <strong>${escapeHtml(ctx.receipt.receiptNumber)}</strong> en PDF.</p>` +
      `<p>— ${escapeHtml(this.issuer.name)}</p>`
    );
  }

  private donorName(ctx: ReceiptContext): string {
    return (
      ctx.donorNameSnapshot?.trim() || ctx.donorPerson?.displayName || 'Donante'
    );
  }

  private filename(ctx: ReceiptContext): string {
    return `recibo-${ctx.receipt.receiptNumber}.pdf`;
  }

  private async loadContext(donationId: string): Promise<ReceiptContext> {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: RECEIPT_CONTEXT_INCLUDE,
    });
    if (!donation) {
      throw new NotFoundException('Donación no encontrada');
    }
    if (!donation.receipt) {
      throw new NotFoundException(
        'La donación todavía no tiene recibo (solo se emite al confirmarse)',
      );
    }
    return donation as ReceiptContext;
  }
}
