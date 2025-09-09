// Test directo del endpoint
console.log('🧪 Testing backend endpoint...');

fetch('http://localhost:3001/api/events/cmfans4c0011rfcih49oyp9eb', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',  // Necesitaremos obtener un token real
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('📡 Response from backend:', data);
  if (data.success && data.data.attendees && data.data.attendees.length > 0) {
    const firstAttendee = data.data.attendees[0];
    console.log('👤 First attendee user keys:', Object.keys(firstAttendee.user));
    console.log('🎤 VoiceProfiles in response:', firstAttendee.user.voiceProfiles);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
