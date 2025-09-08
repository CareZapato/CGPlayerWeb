const fetch = require('node-fetch');

async function testLocationEndpoint() {
  try {
    // Test del endpoint de locations
    console.log('Testing /api/locations endpoint...');
    const response = await fetch('http://192.168.1.10:3001/api/locations');
    
    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n✅ Locations loaded successfully!');
      console.log(`Found ${data.length} locations:`);
      data.forEach((loc, index) => {
        console.log(`${index + 1}. ID: ${loc.id} - Name: ${loc.name} - City: ${loc.city}`);
      });
    } else {
      console.log('❌ No locations found or invalid format');
    }
    
  } catch (error) {
    console.error('Error testing endpoint:', error.message);
  }
}

testLocationEndpoint();
