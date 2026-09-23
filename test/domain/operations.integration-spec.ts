import { prisma, rid } from './test-utils';

/** Escenarios 5-7 de la sección 50: procesión, pasos en procesión, evento. */
describe('Operations domain', () => {
  const suffix = rid();
  let municipalityId: string;
  let festivalId: string;
  let festivalEditionId: string;
  let stepAId: string;
  let stepBId: string;
  let processionId: string;
  const eventTypeCode: 'PROCESSION' = 'PROCESSION';

  beforeAll(async () => {
    const timbio = await prisma.municipality.findFirstOrThrow({
      where: { name: 'Timbío' },
    });
    municipalityId = timbio.id;

    const festival = await prisma.festival.create({
      data: {
        municipalityId,
        name: `Festividad Operaciones ${suffix}`,
        slug: `festividad-operaciones-${suffix}`,
      },
    });
    festivalId = festival.id;

    const edition = await prisma.festivalEdition.create({
      data: { festivalId, year: 2028, name: `Edición Operaciones ${suffix}` },
    });
    festivalEditionId = edition.id;

    const [a, b] = await Promise.all([
      prisma.processionalStep.create({
        data: {
          festivalId,
          name: `Paso A ${suffix}`,
          slug: `paso-a-${suffix}`,
        },
      }),
      prisma.processionalStep.create({
        data: {
          festivalId,
          name: `Paso B ${suffix}`,
          slug: `paso-b-${suffix}`,
        },
      }),
    ]);
    stepAId = a.id;
    stepBId = b.id;
  });

  afterAll(async () => {
    await prisma.eventStep.deleteMany({
      where: { event: { festivalEditionId } },
    });
    await prisma.event.deleteMany({ where: { festivalEditionId } });
    await prisma.processionStep.deleteMany({
      where: { procession: { festivalEditionId } },
    });
    await prisma.procession.deleteMany({ where: { festivalEditionId } });
    await prisma.processionalStep.deleteMany({ where: { festivalId } });
    await prisma.festivalEdition.deleteMany({ where: { festivalId } });
    await prisma.festival.deleteMany({ where: { id: festivalId } });
    await prisma.$disconnect();
  });

  it('5) crea una procesión perteneciente a una edición', async () => {
    const procession = await prisma.procession.create({
      data: {
        festivalEditionId,
        name: `Procesión de Prueba ${suffix}`,
        date: new Date('2028-03-29'),
        status: 'SCHEDULED',
      },
    });
    processionId = procession.id;
    expect(procession.festivalEditionId).toBe(festivalEditionId);
  });

  it('6) asocia pasos a la procesión con orden explícito (N:M)', async () => {
    await prisma.processionStep.createMany({
      data: [
        { processionId, processionalStepId: stepAId, order: 1 },
        { processionId, processionalStepId: stepBId, order: 2 },
      ],
    });

    const steps = await prisma.processionStep.findMany({
      where: { processionId },
      orderBy: { order: 'asc' },
    });
    expect(steps.map((s) => s.processionalStepId)).toEqual([stepAId, stepBId]);

    // El orden es único dentro de una procesión.
    await expect(
      prisma.processionStep.create({
        data: { processionId, processionalStepId: stepAId, order: 1 },
      }),
    ).rejects.toThrow();
  });

  it('7) crea un evento genérico de la programación anual', async () => {
    const event = await prisma.event.create({
      data: {
        festivalEditionId,
        title: `Vía Crucis de Prueba ${suffix}`,
        slug: `via-crucis-prueba-${suffix}`,
        eventType: eventTypeCode,
        startDatetime: new Date('2028-03-29T15:00:00-05:00'),
      },
    });
    expect(event.festivalEditionId).toBe(festivalEditionId);

    const programa = await prisma.event.findMany({
      where: {
        festivalEditionId,
        startDatetime: { gte: new Date('2028-01-01') },
      },
    });
    expect(programa.length).toBeGreaterThanOrEqual(1);
  });
});
