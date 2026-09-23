import { prisma, rid, runAndRollback } from './test-utils';

/**
 * Escenarios 8-13 de la sección 50: campaña de donación, registrar donación,
 * dividir entre varios destinos, impedir allocations superiores al total,
 * registrar transacción de pago, registrar auditoría.
 *
 * Las pruebas que tocan `finance.donation` / `finance.payment_transaction`
 * corren dentro de `runAndRollback` porque esas tablas NUNCA permiten DELETE
 * físico (ver migración financial_integrity_and_audit) — así se verifica el
 * comportamiento real de los triggers de BD sin dejar residuo permanente.
 */
describe('Donation domain (integridad financiera)', () => {
  const suffix = rid();
  let campaignId: string;
  let paymentProviderId: string;

  beforeAll(async () => {
    const manual = await prisma.paymentProvider.findUniqueOrThrow({
      where: { code: 'MANUAL' },
    });
    paymentProviderId = manual.id;
  });

  afterAll(async () => {
    await prisma.donationCampaign.deleteMany({ where: { id: campaignId } });
    await prisma.$disconnect();
  });

  it('8) crea una campaña de donación', async () => {
    const campaign = await prisma.donationCampaign.create({
      data: {
        name: `Campaña de Prueba ${suffix}`,
        slug: `campana-prueba-${suffix}`,
        status: 'ACTIVE',
      },
    });
    campaignId = campaign.id;
    expect(campaign.status).toBe('ACTIVE');
  });

  it('9) registra una donación asociada a la campaña', async () => {
    await runAndRollback(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          campaignId,
          amount: 100000,
          status: 'CONFIRMED',
          updatedAt: new Date(),
        },
      });
      expect(donation.amount.toString()).toBe('100000');
      expect(donation.status).toBe('CONFIRMED');
    });
  });

  it('10) divide una donación entre varios destinos (60/40) sin exceder el total', async () => {
    await runAndRollback(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          campaignId,
          amount: 100000,
          status: 'CONFIRMED',
          updatedAt: new Date(),
        },
      });

      await tx.donationAllocation.createMany({
        data: [
          {
            donationId: donation.id,
            beneficiaryType: 'JUNTA',
            amount: 60000,
            percentage: 60,
          },
          {
            donationId: donation.id,
            beneficiaryType: 'JUNTA',
            amount: 40000,
            percentage: 40,
          },
        ],
      });

      const allocations = await tx.donationAllocation.findMany({
        where: { donationId: donation.id },
      });
      const total = allocations.reduce((sum, a) => sum + Number(a.amount), 0);
      expect(total).toBe(100000);
    });
  });

  it('11) impide que la suma de allocations supere el total de la donación', async () => {
    await expect(
      runAndRollback(async (tx) => {
        const donation = await tx.donation.create({
          data: {
            campaignId,
            amount: 100000,
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
        });
        await tx.donationAllocation.createMany({
          data: [
            {
              donationId: donation.id,
              beneficiaryType: 'JUNTA',
              amount: 60000,
            },
            {
              donationId: donation.id,
              beneficiaryType: 'JUNTA',
              amount: 50000,
            }, // 110.000 > 100.000
          ],
        });
      }),
    ).rejects.toThrow(/supera donation\.amount/);
  });

  it('12) registra una transacción de pago idempotente por externalTransactionId', async () => {
    await runAndRollback(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          campaignId,
          amount: 50000,
          status: 'PENDING',
          updatedAt: new Date(),
        },
      });
      const externalTransactionId = `test-${suffix}`;

      await tx.paymentTransaction.create({
        data: {
          donationId: donation.id,
          providerId: paymentProviderId,
          externalTransactionId,
          amount: 50000,
          status: 'SUCCEEDED',
        },
      });

      // Reintento del mismo webhook con el mismo externalTransactionId debe
      // rechazarse por la restricción UNIQUE(providerId, externalTransactionId).
      await expect(
        tx.paymentTransaction.create({
          data: {
            donationId: donation.id,
            providerId: paymentProviderId,
            externalTransactionId,
            amount: 50000,
            status: 'SUCCEEDED',
          },
        }),
      ).rejects.toThrow();
    });
  });

  it('13) toda mutación en finance.donation queda registrada automáticamente en audit.audit_log', async () => {
    await runAndRollback(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          campaignId,
          amount: 25000,
          status: 'CONFIRMED',
          updatedAt: new Date(),
        },
      });

      const logs: Array<{ action: string; entity_type: string }> =
        await tx.$queryRawUnsafe(
          `SELECT action, entity_type FROM audit.audit_log WHERE entity_type = 'finance.donation' AND entity_id = $1::uuid`,
          donation.id,
        );
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('CREATE');
    });
  });

  it('rechaza DELETE físico de una donación (append-only / status history en su lugar)', async () => {
    await expect(
      runAndRollback(async (tx) => {
        const donation = await tx.donation.create({
          data: {
            campaignId,
            amount: 10000,
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
        });
        await tx.donation.delete({ where: { id: donation.id } });
      }),
    ).rejects.toThrow(/no permite DELETE/);
  });
});
