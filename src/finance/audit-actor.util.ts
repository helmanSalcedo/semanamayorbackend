import { Prisma } from '@prisma/client';

/**
 * The DB's audit trigger (audit.log_financial_change, see migration
 * financial_integrity_and_audit) reads the Postgres session variable
 * `app.current_user_id` to attribute who made a financial change. Call this
 * as the first statement inside a $transaction that touches donation/
 * payment/ledger tables — skip it for actor-less flows (e.g. a public donor
 * submitting a donation with no account), which the trigger just logs with
 * a NULL user_id.
 */
export async function setAuditActor(
  tx: Prisma.TransactionClient,
  actorUserId: string | undefined,
): Promise<void> {
  if (!actorUserId) {
    return;
  }
  await tx.$executeRaw`SELECT set_config('app.current_user_id', ${actorUserId}, true)`;
}
