import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple seeding...');

  try {
    // 0. Limpiar datos existentes
    console.log('🧹 Cleaning existing data...');
    await prisma.user.deleteMany({});
    await prisma.location.deleteMany({});
    console.log('✅ Data cleaned');

    // 1. Crear ubicaciones
    console.log('📍 Creating locations...');
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          name: 'ChileGospel Antofagasta',
          type: 'ANTOFAGASTA',
          address: 'Av. Presidente Balmaceda 2355, Antofagasta',
          city: 'Antofagasta',
          region: 'Antofagasta',
          isActive: true
        }
      }),
      prisma.location.create({
        data: {
          name: 'ChileGospel Santiago',
          type: 'SANTIAGO',
          address: 'Av. Providencia 1234, Santiago',
          city: 'Santiago',
          region: 'Metropolitana',
          isActive: true
        }
      })
    ]);
    console.log(`✅ Created ${locations.length} locations`);

    // 2. Crear usuarios
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@chilegospel.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'ChileGospel',
        role: 'ADMIN',
        locationId: locations[0].id
      }
    });

    const director = await prisma.user.create({
      data: {
        email: 'director@chilegospel.com',
        username: 'director',
        password: await bcrypt.hash('director123', 10),
        firstName: 'Director',
        lastName: 'Musical',
        role: 'DIRECTOR',
        locationId: locations[0].id
      }
    });

    console.log('✅ Created admin and director users');

    // 3. Crear algunos cantantes
    const singers = [];
    for (let i = 1; i <= 3; i++) {
      const singer = await prisma.user.create({
        data: {
          email: `singer${i}@chilegospel.com`,
          username: `singer${i}`,
          password: await bcrypt.hash('singer123', 10),
          firstName: `Singer`,
          lastName: `${i}`,
          role: 'SINGER',
          locationId: locations[0].id
        }
      });
      singers.push(singer);
    }

    console.log(`✅ Created ${singers.length} singers`);

    console.log('✅ Simple seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Locations: ${locations.length}`);
    console.log(`   - Admin: 1`);
    console.log(`   - Director: 1`);
    console.log(`   - Singers: ${singers.length}`);
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@chilegospel.com / admin123');
    console.log('   Director: director@chilegospel.com / director123');
    console.log('   Singer1: singer1@chilegospel.com / singer123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
