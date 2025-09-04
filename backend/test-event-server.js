#!/usr/bin/env node

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Test endpoint para crear un evento con los nuevos campos
app.post('/test-event', async (req, res) => {
  try {
    console.log('Creating test event with body:', req.body);
    
    const { title, description, date, createdBy } = req.body;
    
    if (!title || !date || !createdBy) {
      return res.status(400).json({ 
        error: 'title, date, and createdBy are required' 
      });
    }
    
    // Crear evento con los nuevos campos
    const event = await prisma.event.create({
      data: {
        title,
        description: description || 'Test event description',
        date: new Date(date),
        createdBy,
        isPublic: true,
        allowExternalJoin: true,
        eventCity: 'Santiago',
        eventAddress: 'Test Address 123',
        country: 'Chile',
        imageUrl: '/test-image.jpg',
        mapLink: 'https://maps.google.com',
        time: '19:00'
      }
    });
    
    console.log('Event created successfully:', event);
    
    res.json({
      success: true,
      message: 'Test event created successfully',
      data: event
    });
    
  } catch (error) {
    console.error('Error creating test event:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Test endpoint para agregar asistentes
app.post('/test-event/:eventId/attendees', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }
    
    const attendees = [];
    for (const userId of userIds) {
      const attendee = await prisma.eventAttendee.create({
        data: {
          eventId,
          userId,
          status: 'CONFIRMED'
        }
      });
      attendees.push(attendee);
    }
    
    res.json({
      success: true,
      message: `${attendees.length} attendees added`,
      data: attendees
    });
    
  } catch (error) {
    console.error('Error adding attendees:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Test server running on port ${PORT}`);
  console.log(`\nTest endpoints:`);
  console.log(`POST http://localhost:${PORT}/test-event`);
  console.log(`POST http://localhost:${PORT}/test-event/:eventId/attendees`);
  console.log(`\nExample requests:`);
  console.log(`curl -X POST http://localhost:${PORT}/test-event -H "Content-Type: application/json" -d '{"title":"Test Event","date":"2025-01-01","createdBy":"user_id_here"}'`);
});

// Manejo de cierre
process.on('SIGINT', async () => {
  console.log('\n🔄 Closing test server...');
  await prisma.$disconnect();
  process.exit(0);
});
