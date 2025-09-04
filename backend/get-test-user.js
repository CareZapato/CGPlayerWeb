#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function getTestUser() {
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.findFirst();
    console.log('First user ID:', user?.id);
    console.log('User name:', user?.firstName, user?.lastName);
    
    if (user) {
      console.log('\nTest command:');
      console.log(`curl -X POST http://localhost:3001/test-event -H "Content-Type: application/json" -d '{"title":"Evento de Prueba Sistema Mejorado","description":"Prueba del nuevo sistema de eventos con asistentes","date":"2025-01-15T19:00:00Z","createdBy":"${user.id}"}'`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getTestUser();
