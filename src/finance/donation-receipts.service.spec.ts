import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BeneficiaryType, MediaType, Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DonationReceiptsService } from './donation-receipts.service';

function buildDonation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'd1',
    amount: new Prisma.Decimal(150000),
    currency: 'COP',
    donorEmail: 'ana@example.com',
    donorNameSnapshot: 'Ana <script>',
    donorPerson: null,
    campaign: { name: 'Restauración del Nazareno' },
    allocations: [
      {
        beneficiaryType: BeneficiaryType.JUNTA,
        amount: new Prisma.Decimal(150000),
      },
    ],
    receipt: {
      id: 'r1',
      receiptNumber: 'REC-2026-000001',
      issuedAt: new Date('2026-09-24T15:00:00Z'),
      pdfMediaAssetId: null,
      taxIdSnapshot: null,
    },
    ...overrides,
  };
}

describe('DonationReceiptsService', () => {
  let tx: {
    mediaAsset: { create: jest.Mock };
    donationReceipt: { update: jest.Mock };
  };
  let prisma: {
    donation: { findUnique: jest.Mock };
    mediaAsset: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let storage: {
    isConfigured: boolean;
    upload: jest.Mock;
    download: jest.Mock;
  };
  let mail: { send: jest.Mock };
  let service: DonationReceiptsService;

  beforeEach(() => {
    tx = {
      mediaAsset: { create: jest.fn().mockResolvedValue({ id: 'asset-1' }) },
      donationReceipt: { update: jest.fn().mockResolvedValue({}) },
    };
    prisma = {
      donation: { findUnique: jest.fn().mockResolvedValue(buildDonation()) },
      mediaAsset: { findUnique: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    storage = {
      isConfigured: true,
      upload: jest.fn().mockResolvedValue({
        url: 'gs://bucket/receipts/2026/REC-2026-000001.pdf',
        storageKey: 'receipts/2026/REC-2026-000001.pdf',
      }),
      download: jest.fn(),
    };
    mail = { send: jest.fn().mockResolvedValue(undefined) };
    const config = {
      get: () => ({
        receipts: {
          issuerName: 'Junta Pro Semana Santa de Timbío',
          issuerTaxId: '900123456-7',
        },
      }),
    } as unknown as ConfigService;
    service = new DonationReceiptsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      mail as unknown as MailService,
      config,
    );
  });

  describe('deliverAfterConfirm', () => {
    it('archives the PDF privately and links it to the receipt', async () => {
      await service.deliverAfterConfirm('d1');

      expect(storage.upload).toHaveBeenCalledWith(
        expect.any(Buffer),
        'receipts/2026/REC-2026-000001.pdf',
        'application/pdf',
        { public: false },
      );
      expect(tx.mediaAsset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: MediaType.DOCUMENT,
          mimeType: 'application/pdf',
          filename: 'recibo-REC-2026-000001.pdf',
        }),
      });
      expect(tx.donationReceipt.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { pdfMediaAssetId: 'asset-1' },
      });
    });

    it('emails the donor with a real PDF attached and escapes their name', async () => {
      await service.deliverAfterConfirm('d1');

      expect(mail.send).toHaveBeenCalledTimes(1);
      const sent = mail.send.mock.calls[0][0];
      expect(sent.to).toBe('ana@example.com');
      expect(sent.subject).toContain('REC-2026-000001');
      expect(sent.subject).toContain('Junta Pro Semana Santa de Timbío');
      expect(sent.html).toContain('— Junta Pro Semana Santa de Timbío');
      expect(sent.html).toContain('Ana &lt;script&gt;');
      expect(sent.html).not.toContain('<script>');
      const attachment = sent.attachments[0];
      expect(attachment.filename).toBe('recibo-REC-2026-000001.pdf');
      expect(attachment.content.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('does not re-upload when the receipt PDF is already archived', async () => {
      prisma.donation.findUnique.mockResolvedValue(
        buildDonation({
          receipt: { ...buildDonation().receipt, pdfMediaAssetId: 'asset-0' },
        }),
      );
      await service.deliverAfterConfirm('d1');
      expect(storage.upload).not.toHaveBeenCalled();
      expect(mail.send).toHaveBeenCalled();
    });

    it('still emails when storage is not configured', async () => {
      storage.isConfigured = false;
      await service.deliverAfterConfirm('d1');
      expect(storage.upload).not.toHaveBeenCalled();
      expect(mail.send).toHaveBeenCalled();
    });

    it('skips the email when the donor left no address', async () => {
      prisma.donation.findUnique.mockResolvedValue(
        buildDonation({ donorEmail: null }),
      );
      await service.deliverAfterConfirm('d1');
      expect(mail.send).not.toHaveBeenCalled();
      expect(storage.upload).toHaveBeenCalled();
    });

    it('never throws, even if SMTP fails', async () => {
      mail.send.mockRejectedValue(new Error('SMTP down'));
      await expect(service.deliverAfterConfirm('d1')).resolves.toBeUndefined();
    });
  });

  describe('resend', () => {
    it('rejects when the donation has no donor email', async () => {
      prisma.donation.findUnique.mockResolvedValue(
        buildDonation({ donorEmail: null }),
      );
      await expect(service.resend('d1')).rejects.toThrow(BadRequestException);
    });

    it('reports what was done', async () => {
      await expect(service.resend('d1')).resolves.toEqual({
        pdfStored: true,
        emailSent: true,
      });
    });

    it('surfaces SMTP errors to the admin', async () => {
      mail.send.mockRejectedValue(new Error('SMTP down'));
      await expect(service.resend('d1')).rejects.toThrow('SMTP down');
    });
  });

  describe('getPdf', () => {
    it('404s when the donation has no receipt yet', async () => {
      prisma.donation.findUnique.mockResolvedValue(
        buildDonation({ receipt: null }),
      );
      await expect(service.getPdf('d1')).rejects.toThrow(NotFoundException);
    });

    it('serves the archived copy when there is one', async () => {
      prisma.donation.findUnique.mockResolvedValue(
        buildDonation({
          receipt: { ...buildDonation().receipt, pdfMediaAssetId: 'asset-1' },
        }),
      );
      prisma.mediaAsset.findUnique.mockResolvedValue({
        storageKey: 'receipts/2026/REC-2026-000001.pdf',
        deletedAt: null,
      });
      storage.download.mockResolvedValue(Buffer.from('%PDF-archived'));

      const file = await service.getPdf('d1');

      expect(storage.download).toHaveBeenCalledWith(
        'receipts/2026/REC-2026-000001.pdf',
      );
      expect(file.content.toString()).toBe('%PDF-archived');
    });

    it('renders on the fly when nothing was archived', async () => {
      const file = await service.getPdf('d1');
      expect(storage.download).not.toHaveBeenCalled();
      expect(file.filename).toBe('recibo-REC-2026-000001.pdf');
      expect(file.content.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });
});
