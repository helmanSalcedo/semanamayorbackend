import { prisma, rid } from './test-utils';

/**
 * Escenarios 1-4 de la sección 50 del spec: festividad, edición, paso
 * procesional, imagen religiosa. Requiere TEST_DATABASE_URL migrada y
 * seedeada (ver npm run db:test:migrate / db:test:seed).
 */
describe('Heritage domain', () => {
  const suffix = rid();
  let municipalityId: string;
  let festivalId: string;
  let processionalStepId: string;

  beforeAll(async () => {
    const timbio = await prisma.municipality.findFirstOrThrow({
      where: { name: 'Timbío' },
    });
    municipalityId = timbio.id;
  });

  afterAll(async () => {
    // Orden de borrado respeta las FK (Restrict) declaradas en el schema.
    await prisma.religiousImage.deleteMany({
      where: { processionalStep: { festivalId } },
    });
    await prisma.processionalStep.deleteMany({ where: { festivalId } });
    await prisma.festivalEdition.deleteMany({ where: { festivalId } });
    await prisma.festival.deleteMany({ where: { id: festivalId } });
    await prisma.$disconnect();
  });

  it('1) crea una festividad genérica ligada a un municipio', async () => {
    const festival = await prisma.festival.create({
      data: {
        municipalityId,
        name: `Semana Santa de Prueba ${suffix}`,
        slug: `semana-santa-prueba-${suffix}`,
        status: 'DRAFT',
      },
    });
    festivalId = festival.id;
    expect(festival.id).toBeDefined();
    expect(festival.municipalityId).toBe(municipalityId);
  });

  it('2) crea una edición anual, única por (festivalId, year)', async () => {
    const edition = await prisma.festivalEdition.create({
      data: {
        festivalId,
        year: 2027,
        name: `Semana Santa ${suffix} 2027`,
        status: 'PLANNED',
      },
    });
    expect(edition.year).toBe(2027);

    await expect(
      prisma.festivalEdition.create({
        data: { festivalId, year: 2027, name: 'Duplicada' },
      }),
    ).rejects.toThrow();
  });

  it('3) crea un paso procesional perteneciente a la festividad', async () => {
    const step = await prisma.processionalStep.create({
      data: {
        festivalId,
        name: `Paso de Prueba ${suffix}`,
        slug: `paso-prueba-${suffix}`,
        status: 'DRAFT',
      },
    });
    processionalStepId = step.id;
    expect(step.festivalId).toBe(festivalId);
  });

  it('4) asocia una imagen religiosa a un paso (1:N)', async () => {
    const image = await prisma.religiousImage.create({
      data: {
        processionalStepId,
        name: `Imagen de Prueba ${suffix}`,
        conservationStatus: 'GOOD',
      },
    });
    expect(image.processionalStepId).toBe(processionalStepId);

    const stepWithImages = await prisma.processionalStep.findUniqueOrThrow({
      where: { id: processionalStepId },
      include: { religiousImages: true },
    });
    expect(stepWithImages.religiousImages).toHaveLength(1);
  });

  it('respeta festivalEditionId ausente: festival_edition no puede referenciar una festividad inexistente', async () => {
    await expect(
      prisma.festivalEdition.create({
        data: {
          festivalId: '01977000-0000-7000-8000-0000000000ff',
          year: 2099,
          name: 'Fantasma',
        },
      }),
    ).rejects.toThrow();
  });
});
