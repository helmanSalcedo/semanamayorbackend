import { prisma, rid } from './test-utils';

/** Escenarios 17-18 de la sección 50: soft delete y permisos RBAC. */
describe('Platform domain (soft delete, RBAC)', () => {
  const suffix = rid();
  let municipalityId: string;
  let festivalId: string;
  let processionalStepId: string;
  let userId: string;
  let customRoleId: string;

  beforeAll(async () => {
    const timbio = await prisma.municipality.findFirstOrThrow({
      where: { name: 'Timbío' },
    });
    municipalityId = timbio.id;
  });

  afterAll(async () => {
    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.rolePermission.deleteMany({ where: { roleId: customRoleId } });
    await prisma.role.deleteMany({ where: { id: customRoleId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.processionalStep.deleteMany({
      where: { id: processionalStepId },
    });
    await prisma.festival.deleteMany({ where: { id: festivalId } });
    await prisma.$disconnect();
  });

  it('17) soft delete: un paso procesional marcado deletedAt no desaparece físicamente', async () => {
    const festival = await prisma.festival.create({
      data: {
        municipalityId,
        name: `Festividad SoftDelete ${suffix}`,
        slug: `festividad-soft-delete-${suffix}`,
      },
    });
    festivalId = festival.id;

    const step = await prisma.processionalStep.create({
      data: {
        festivalId,
        name: `Paso SoftDelete ${suffix}`,
        slug: `paso-soft-delete-${suffix}`,
      },
    });
    processionalStepId = step.id;

    const softDeleted = await prisma.processionalStep.update({
      where: { id: processionalStepId },
      data: { deletedAt: new Date() },
    });
    expect(softDeleted.deletedAt).not.toBeNull();

    // La fila sigue existiendo físicamente: un findUnique normal la encuentra.
    const stillThere = await prisma.processionalStep.findUnique({
      where: { id: processionalStepId },
    });
    expect(stillThere).not.toBeNull();

    // Las consultas "públicas" deben filtrar deletedAt: null explícitamente.
    const visiblePublicly = await prisma.processionalStep.findFirst({
      where: { id: processionalStepId, deletedAt: null },
    });
    expect(visiblePublicly).toBeNull();
  });

  it('18) RBAC: un usuario solo puede hacer lo que sus permisos asignados permiten', async () => {
    const user = await prisma.user.create({
      data: {
        email: `usuario.prueba.${suffix}@example.com`,
        passwordHash: 'hash-de-prueba-no-real',
        fullName: 'Usuario de Prueba',
      },
    });
    userId = user.id;

    const role = await prisma.role.create({
      data: {
        code: `EDITOR_LIMITADO_${suffix}`,
        name: 'Editor limitado de prueba',
      },
    });
    customRoleId = role.id;

    const publishPermission = await prisma.permission.findUniqueOrThrow({
      where: { code: 'article.publish' },
    });
    await prisma.rolePermission.create({
      data: { roleId: customRoleId, permissionId: publishPermission.id },
    });
    await prisma.userRole.create({ data: { userId, roleId: customRoleId } });

    const grantedPermissions = await prisma.rolePermission.findMany({
      where: { role: { users: { some: { userId } } } },
      include: { permission: true },
    });
    const codes = grantedPermissions.map((rp) => rp.permission.code);
    expect(codes).toContain('article.publish');
    expect(codes).not.toContain('donation.refund');
  });
});
