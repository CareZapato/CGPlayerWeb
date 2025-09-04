#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testEventSystem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Event System...\n');
    
    // Test 1: Verificar que los modelos existen
    console.log('1. Checking available models:');
    const models = Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'));
    console.log('Available models:', models);
    
    const requiredModels = ['event', 'eventAttendee', 'eventJoinRequest', 'eventAttendance', 'eventPlaylist'];
    const missingModels = requiredModels.filter(model => !models.includes(model));
    
    if (missingModels.length > 0) {
      console.log('❌ Missing models:', missingModels);
      return;
    } else {
      console.log('✅ All required models found\n');
    }
    
    // Test 2: Verificar estructura de campo Event
    console.log('2. Event model fields:');
    const eventFields = Object.keys(require('@prisma/client').Prisma.EventScalarFieldEnum);
    console.log('Event fields:', eventFields);
    
    const requiredEventFields = ['createdBy', 'isPublic', 'allowExternalJoin', 'eventCity', 'eventAddress', 'country'];
    const missingEventFields = requiredEventFields.filter(field => !eventFields.includes(field));
    
    if (missingEventFields.length > 0) {
      console.log('❌ Missing Event fields:', missingEventFields);
    } else {
      console.log('✅ All required Event fields found\n');
    }
    
    // Test 3: Verificar que podemos acceder a las tablas
    console.log('3. Testing database access:');
    
    try {
      const eventCount = await prisma.event.count();
      console.log('✅ Events table accessible, count:', eventCount);
      
      const attendeeCount = await prisma.eventAttendee.count();
      console.log('✅ EventAttendee table accessible, count:', attendeeCount);
      
      const joinRequestCount = await prisma.eventJoinRequest.count();
      console.log('✅ EventJoinRequest table accessible, count:', joinRequestCount);
      
      const attendanceCount = await prisma.eventAttendance.count();
      console.log('✅ EventAttendance table accessible, count:', attendanceCount);
      
      const playlistCount = await prisma.eventPlaylist.count();
      console.log('✅ EventPlaylist table accessible, count:', playlistCount);
      
    } catch (error) {
      console.log('❌ Database access error:', error.message);
    }
    
    console.log('\n🎉 Event System test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testEventSystem().catch(console.error);
