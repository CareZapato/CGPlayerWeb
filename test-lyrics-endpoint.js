const { default: fetch } = require('node-fetch');

async function testLyricsEndpoint() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWYyMGV3NWEwMDA2ZG8xd3N0ZDdocHg3IiwiZW1haWwiOiJhZG1pbkBjZ3BsYXllci5jb20iLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3NTY3ODUxMTUsImV4cCI6MTc1NzM4OTkxNX0.n3owtPZ-fRo9vpJNJUTjtNtr9fwTVJMe_F4-mS3k_20';
    const songId = 'cmf21d0ay0003p931s6kabifc';
    
    console.log('Testing lyrics endpoint...');
    console.log('Song ID:', songId);
    
    const response = await fetch(`http://localhost:3001/api/lyrics/${songId}/sync`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLyricsEndpoint();
