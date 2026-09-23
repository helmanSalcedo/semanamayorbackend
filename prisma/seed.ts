/**
 * Seed técnico — SOLO catálogos administrables y datos geográficos/legales
 * verificables (país, departamento, municipio). NUNCA datos históricos
 * inventados (nombres de pasos, fechas de fundación, personas, familias):
 * esos solo se cargan cuando existe una fuente documental real (sección 45
 * del spec). Idempotente: seguro de correr varias veces (upsert por código).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGeo() {
  const colombia = await prisma.country.upsert({
    where: { isoCode2: 'CO' },
    update: {},
    create: { isoCode2: 'CO', isoCode3: 'COL', name: 'Colombia' },
  });

  const cauca = await prisma.department.upsert({
    where: { countryId_name: { countryId: colombia.id, name: 'Cauca' } },
    update: {},
    create: { countryId: colombia.id, name: 'Cauca', daneCode: '19' },
  });

  const timbio = await prisma.municipality.upsert({
    where: { departmentId_name: { departmentId: cauca.id, name: 'Timbío' } },
    update: {},
    create: {
      departmentId: cauca.id,
      name: 'Timbío',
      daneCode: '19824',
      latitude: 2.353,
      longitude: -76.681,
    },
  });

  return { colombia, cauca, timbio };
}

async function seedRbac() {
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Super administrador', isSystem: true },
    {
      code: 'ADMIN_FESTIVAL',
      name: 'Administrador de festividad',
      isSystem: true,
    },
    { code: 'EDITOR', name: 'Editor de contenido', isSystem: true },
    { code: 'HISTORIAN', name: 'Historiador', isSystem: true },
    { code: 'FINANCE_MANAGER', name: 'Gestor financiero', isSystem: true },
    { code: 'EVENT_MANAGER', name: 'Gestor de eventos', isSystem: true },
    { code: 'MODERATOR', name: 'Moderador', isSystem: true },
    {
      code: 'BUSINESS_MANAGER',
      name: 'Gestor de directorio comercial',
      isSystem: true,
    },
    { code: 'SPONSOR_MANAGER', name: 'Gestor de patrocinios', isSystem: true },
    { code: 'VIEWER', name: 'Visualizador', isSystem: true },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, isSystem: role.isSystem },
      create: role,
    });
  }

  const permissions = [
    'donation.create',
    'donation.read',
    'donation.allocate',
    'donation.refund',
    'article.create',
    'article.publish',
    'article.unpublish',
    'processional_step.manage',
    'religious_image.manage',
    'event.manage',
    'procession.manage',
    'media_asset.manage',
    'festival.manage',
    'religious_site.manage',
    'source.manage',
    'person.manage',
    'donation_campaign.manage',
    'historical_content.manage',
    'sponsorship.manage',
    'business.manage',
    'business.approve',
    'user.manage',
    'role.manage',
    'financial_report.publish',
    'financial_category.manage',
    'financial_transaction.manage',
    'audit_log.read',
  ];

  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: `Permiso: ${code}` },
    });
  }

  // SUPER_ADMIN obtiene todos los permisos; el resto se asigna manualmente
  // desde el panel administrativo cuando exista.
  const superAdmin = await prisma.role.findUniqueOrThrow({
    where: { code: 'SUPER_ADMIN' },
  });
  const allPermissions = await prisma.permission.findMany();
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({
      roleId: superAdmin.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });
}

async function seedRoleTypes() {
  const roleTypes = [
    { code: 'SINDICO', name: 'Síndico' },
    { code: 'CARGUERO', name: 'Carguero' },
    { code: 'SAHUMADORA', name: 'Sahumadora' },
    { code: 'MUSICO', name: 'Músico' },
    { code: 'RESTAURADOR', name: 'Restaurador' },
    { code: 'HISTORIADOR', name: 'Historiador' },
    { code: 'SACERDOTE', name: 'Sacerdote' },
    { code: 'ORGANIZADOR', name: 'Organizador' },
    { code: 'BENEFACTOR', name: 'Benefactor' },
    { code: 'AUTOR', name: 'Autor' },
    { code: 'FOTOGRAFO', name: 'Fotógrafo' },
  ];
  for (const rt of roleTypes) {
    await prisma.roleType.upsert({
      where: { code: rt.code },
      update: { name: rt.name },
      create: rt,
    });
  }
}

async function seedFinancialCategories() {
  const categories: Array<{ name: string; type: 'INCOME' | 'EXPENSE' }> = [
    { name: 'Donaciones', type: 'INCOME' },
    { name: 'Patrocinios', type: 'INCOME' },
    { name: 'Restauración', type: 'EXPENSE' },
    { name: 'Mantenimiento', type: 'EXPENSE' },
    { name: 'Eventos', type: 'EXPENSE' },
    { name: 'Administración', type: 'EXPENSE' },
  ];
  for (const c of categories) {
    const existing = await prisma.financialCategory.findFirst({
      where: { name: c.name },
    });
    if (!existing) {
      await prisma.financialCategory.create({ data: c });
    }
  }
}

async function seedPaymentProviders() {
  const providers = [
    { code: 'MANUAL', name: 'Registro manual (efectivo/consignación)' },
    { code: 'WOMPI', name: 'Wompi' },
    { code: 'PAYU', name: 'PayU' },
    { code: 'EPAYCO', name: 'ePayco' },
  ];
  for (const p of providers) {
    await prisma.paymentProvider.upsert({
      where: { code: p.code },
      update: { name: p.name },
      create: p,
    });
  }
}

async function seedBusinessCategories() {
  const categories = [
    { name: 'Restaurante', slug: 'restaurante' },
    { name: 'Hotel', slug: 'hotel' },
    { name: 'Transporte', slug: 'transporte' },
    { name: 'Comercio', slug: 'comercio' },
    { name: 'Cafetería', slug: 'cafeteria' },
    { name: 'Turismo', slug: 'turismo' },
    { name: 'Artesanías', slug: 'artesanias' },
    { name: 'Servicios', slug: 'servicios' },
    { name: 'Otros', slug: 'otros' },
  ];
  for (const c of categories) {
    await prisma.businessCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }
}

async function seedOrganizationTypes() {
  const types = [
    { code: 'COMPANY', name: 'Empresa' },
    { code: 'INSTITUTION', name: 'Institución' },
    { code: 'MEDIA', name: 'Medio de comunicación' },
    { code: 'INDIVIDUAL', name: 'Persona natural' },
  ];
  for (const t of types) {
    await prisma.organizationType.upsert({
      where: { code: t.code },
      update: { name: t.name },
      create: t,
    });
  }
}

async function main() {
  console.log('Seeding geo...');
  await seedGeo();
  console.log('Seeding RBAC (roles/permissions)...');
  await seedRbac();
  console.log('Seeding role types (roles culturales)...');
  await seedRoleTypes();
  console.log('Seeding financial categories...');
  await seedFinancialCategories();
  console.log('Seeding payment providers...');
  await seedPaymentProviders();
  console.log('Seeding business categories...');
  await seedBusinessCategories();
  console.log('Seeding organization types...');
  await seedOrganizationTypes();
  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
