import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/** Sufijo aleatorio corto para evitar colisiones de slugs/unique entre corridas. */
export function rid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Corre `fn` dentro de una transacción, fuerza la evaluación inmediata de
 * los constraint triggers DEFERRABLE (equivalente a lo que pasaría en COMMIT)
 * y SIEMPRE hace rollback al final — así los tests de integridad financiera
 * (que no pueden hacer DELETE físico por diseño, ver migración
 * financial_integrity_and_audit) no dejan residuo en la base de datos.
 *
 * Si `fn` lanza (por ejemplo porque el trigger rechazó la operación), el
 * error se re-lanza después del rollback para que el test pueda asserted-lo.
 */
export async function runAndRollback<T>(
  fn: (
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) => Promise<T>,
): Promise<T> {
  const ROLLBACK_MARKER = new Error('rollback');
  let result: T | undefined;
  let caught: unknown;

  try {
    await prisma.$transaction(async (tx) => {
      try {
        result = await fn(tx);
      } catch (err) {
        caught = err;
      }
      // Fuerza la evaluación de los constraint triggers DEFERRED ya, dentro
      // de la transacción, en vez de esperar a un COMMIT que nunca ocurrirá.
      // Si un error PREVIO (dentro de fn, incluso si fue capturado ahí con
      // expect().rejects) ya dejó la transacción de Postgres en estado
      // "aborted" (SQLSTATE 25P02), este SET fallará por esa misma razón sin
      // aportar información nueva, así que se ignora puntualmente ese código;
      // cualquier otro error aquí (ej. nuestro trigger de suma de
      // allocations) sí es información real y se preserva.
      try {
        await tx.$executeRawUnsafe('SET CONSTRAINTS ALL IMMEDIATE');
      } catch (err) {
        const isAbortedTransactionNoise =
          err instanceof Error && err.message.includes('25P02');
        if (!isAbortedTransactionNoise) caught = err;
      }
      // Aborta siempre: nunca queremos persistir datos de prueba.
      throw ROLLBACK_MARKER;
    });
  } catch (err) {
    if (err !== ROLLBACK_MARKER) {
      caught = err;
    }
  }

  if (caught) {
    throw caught instanceof Error ? caught : new Error(JSON.stringify(caught));
  }
  return result as T;
}
