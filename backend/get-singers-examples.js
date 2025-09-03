const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCantantesEjemplos() {
  console.log('🎤 EJEMPLOS DE CANTANTES POR TIPO DE VOZ:\n');
  
  // TENORES
  console.log('🎼 TENORES:');
  const tenores = await prisma.user.findMany({
    where: {
      roles: { some: { role: 'CANTANTE' } },
      voiceProfiles: { some: { voiceType: 'TENOR' } }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      location: { select: { name: true } },
      voiceProfiles: { select: { voiceType: true } }
    },
    take: 3
  });
  
  tenores.forEach(t => {
    const voces = t.voiceProfiles.map(v => v.voiceType).join(', ');
    console.log(`   📧 ${t.email} | 🔑 cantante123 | ${t.firstName} ${t.lastName} | 📍 ${t.location.name} | 🎵 ${voces}`);
  });

  // SOPRANOS
  console.log('\n🎵 SOPRANOS:');
  const sopranos = await prisma.user.findMany({
    where: {
      roles: { some: { role: 'CANTANTE' } },
      voiceProfiles: { some: { voiceType: 'SOPRANO' } }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      location: { select: { name: true } },
      voiceProfiles: { select: { voiceType: true } }
    },
    take: 3
  });
  
  sopranos.forEach(s => {
    const voces = s.voiceProfiles.map(v => v.voiceType).join(', ');
    console.log(`   📧 ${s.email} | 🔑 cantante123 | ${s.firstName} ${s.lastName} | 📍 ${s.location.name} | 🎵 ${voces}`);
  });

  // CONTRALTOS
  console.log('\n🎶 CONTRALTOS:');
  const contraltos = await prisma.user.findMany({
    where: {
      roles: { some: { role: 'CANTANTE' } },
      voiceProfiles: { some: { voiceType: 'CONTRALTO' } }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      location: { select: { name: true } },
      voiceProfiles: { select: { voiceType: true } }
    },
    take: 3
  });
  
  contraltos.forEach(c => {
    const voces = c.voiceProfiles.map(v => v.voiceType).join(', ');
    console.log(`   📧 ${c.email} | 🔑 cantante123 | ${c.firstName} ${c.lastName} | 📍 ${c.location.name} | 🎵 ${voces}`);
  });

  // BARÍTONOS
  console.log('\n🎸 BARÍTONOS:');
  const baritonos = await prisma.user.findMany({
    where: {
      roles: { some: { role: 'CANTANTE' } },
      voiceProfiles: { some: { voiceType: 'BARITONO' } }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      location: { select: { name: true } },
      voiceProfiles: { select: { voiceType: true } }
    },
    take: 3
  });
  
  baritonos.forEach(b => {
    const voces = b.voiceProfiles.map(v => v.voiceType).join(', ');
    console.log(`   📧 ${b.email} | 🔑 cantante123 | ${b.firstName} ${b.lastName} | 📍 ${b.location.name} | 🎵 ${voces}`);
  });

  // MESOSOPRANOS
  console.log('\n🎭 MESOSOPRANOS:');
  const mesosopranos = await prisma.user.findMany({
    where: {
      roles: { some: { role: 'CANTANTE' } },
      voiceProfiles: { some: { voiceType: 'MESOSOPRANO' } }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      location: { select: { name: true } },
      voiceProfiles: { select: { voiceType: true } }
    },
    take: 2
  });
  
  mesosopranos.forEach(m => {
    const voces = m.voiceProfiles.map(v => v.voiceType).join(', ');
    console.log(`   📧 ${m.email} | 🔑 cantante123 | ${m.firstName} ${m.lastName} | 📍 ${m.location.name} | 🎵 ${voces}`);
  });

  await prisma.$disconnect();
}

getCantantesEjemplos();
