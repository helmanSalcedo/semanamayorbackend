import { prisma, rid } from './test-utils';

/** Escenarios 14-16 de la sección 50: patrocinador, negocio, publicar contenido. */
describe('Business & CMS domain', () => {
  const suffix = rid();
  let organizationId: string;
  let organizationTypeId: string;
  let businessCategoryId: string;
  let businessId: string;
  let articleId: string;
  let festivalId: string;

  beforeAll(async () => {
    const companyType = await prisma.organizationType.findUniqueOrThrow({
      where: { code: 'COMPANY' },
    });
    organizationTypeId = companyType.id;
    const restaurant = await prisma.businessCategory.findUniqueOrThrow({
      where: { slug: 'restaurante' },
    });
    businessCategoryId = restaurant.id;
    const timbio = await prisma.municipality.findFirstOrThrow({
      where: { name: 'Timbío' },
    });
    const festival = await prisma.festival.create({
      data: {
        municipalityId: timbio.id,
        name: `Festividad Negocio ${suffix}`,
        slug: `festividad-negocio-${suffix}`,
      },
    });
    festivalId = festival.id;
  });

  afterAll(async () => {
    await prisma.articleVersion.deleteMany({ where: { articleId } });
    await prisma.article.deleteMany({ where: { id: articleId } });
    await prisma.business.deleteMany({ where: { id: businessId } });
    await prisma.sponsorship.deleteMany({ where: { organizationId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.festival.deleteMany({ where: { id: festivalId } });
    await prisma.$disconnect();
  });

  it('14) crea un patrocinador (organización) y un patrocinio hacia una festividad', async () => {
    const org = await prisma.organization.create({
      data: {
        typeId: organizationTypeId,
        name: `Patrocinador de Prueba ${suffix}`,
      },
    });
    organizationId = org.id;

    const sponsorship = await prisma.sponsorship.create({
      data: {
        organizationId,
        sponsorableType: 'FESTIVAL',
        sponsorableId: festivalId,
        amount: 500000,
        startDate: new Date('2028-01-01'),
        status: 'ACTIVE',
      },
    });
    expect(sponsorship.sponsorableType).toBe('FESTIVAL');
  });

  it('rechaza un patrocinio hacia una festividad inexistente (trigger de integridad)', async () => {
    await expect(
      prisma.sponsorship.create({
        data: {
          organizationId,
          sponsorableType: 'FESTIVAL',
          sponsorableId: '01977000-0000-7000-8000-0000000000ff',
          startDate: new Date('2028-01-01'),
        },
      }),
    ).rejects.toThrow();
  });

  it('15) crea un negocio en el directorio comercial', async () => {
    const business = await prisma.business.create({
      data: {
        categoryId: businessCategoryId,
        name: `Restaurante de Prueba ${suffix}`,
        slug: `restaurante-prueba-${suffix}`,
        status: 'PENDING_REVIEW',
      },
    });
    businessId = business.id;
    expect(business.status).toBe('PENDING_REVIEW');
  });

  it('16) publica contenido editorial (DRAFT -> PUBLISHED) y versiona el cambio', async () => {
    const article = await prisma.article.create({
      data: {
        title: `Noticia de Prueba ${suffix}`,
        slug: `noticia-prueba-${suffix}`,
        content: 'Contenido inicial de prueba.',
        status: 'DRAFT',
      },
    });
    articleId = article.id;

    await prisma.articleVersion.create({
      data: {
        articleId,
        versionNumber: 1,
        title: article.title,
        content: article.content,
        changeSummary: 'Versión inicial',
      },
    });

    const published = await prisma.article.update({
      where: { id: articleId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedAt).not.toBeNull();
  });
});
