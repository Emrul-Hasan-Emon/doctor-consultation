import 'dotenv/config';
import { DataSource, EntityManager } from 'typeorm';
import { buildDataSourceOptions } from '../orm-config';
import {
  AdminUser,
  District,
  Division,
  Speciality,
  UserAccount,
} from '../entities';
import { AdminRole, PrescriptionType, UserType } from '../enums';
import { hashPassword } from '../../common/utils/password';
import { normalizeMobile } from '../../common/utils/mobile';
import { GEO, SPECIALITIES } from './geo.data';

/** Idempotent. Safe to run on every deploy. */
async function seedGeo(m: EntityManager) {
  for (const d of GEO) {
    let division = await m.findOne(Division, { where: { name: d.name } });
    division ??= await m.save(
      m.create(Division, { name: d.name, nameBN: d.nameBN }),
    );
    for (const [name, nameBN] of d.districts) {
      const exists = await m.findOne(District, {
        where: { name, divisionId: division.id },
      });
      if (!exists)
        await m.save(
          m.create(District, { name, nameBN, divisionId: division.id }),
        );
    }
  }
}

async function seedSpecialities(m: EntityManager) {
  for (const [value, name, nameBN, prescriptionType] of SPECIALITIES) {
    const exists = await m.findOne(Speciality, { where: { value } });
    if (!exists) {
      await m.save(
        m.create(Speciality, {
          value,
          name,
          nameBN,
          prescriptionType: prescriptionType as PrescriptionType,
        }),
      );
    }
  }
}

async function seedAdmin(m: EntityManager) {
  const mobile = normalizeMobile(
    process.env.SEED_ADMIN_MOBILE ?? '01700000000',
  );
  const email = (
    process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com'
  ).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.log('SEED_ADMIN_PASSWORD missing or short: skipping admin seed');
    return;
  }
  const exists = await m.findOne(UserAccount, {
    where: { type: UserType.ADMIN, mobile },
  });
  if (exists) return;
  const account = await m.save(
    m.create(UserAccount, {
      type: UserType.ADMIN,
      mobile,
      email,
      passwordHash: await hashPassword(password),
      isMobileVerified: true,
    }),
  );
  await m.save(
    m.create(AdminUser, {
      accountId: account.id,
      firstName: 'Super',
      lastName: 'Admin',
      role: AdminRole.SUPER_ADMIN,
    }),
  );
  console.log(`Seeded super admin ${mobile}`);
}

async function main() {
  const ds = new DataSource(
    buildDataSourceOptions({ get: (k) => process.env[k] }),
  );
  await ds.initialize();
  await ds.transaction(async (m) => {
    await seedGeo(m);
    await seedSpecialities(m);
    await seedAdmin(m);
  });
  await ds.destroy();
  console.log('Seed done');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
