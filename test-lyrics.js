// Test script para verificar el endpoint de letras
const testLyricsEndpoint = async () => {
  // ID de Don't Cry (variación soprano) basado en los logs
  const songId = 'cmf1hztqo0003fc15ofzan8vq';
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3001/api/lyrics/${songId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response for Don\'t Cry lyrics:', data);
    console.log('LyricsFiles:', data.song?.lyricsFiles);
    console.log('ParentSongId:', data.song?.parentSongId);
  } catch (error) {
    console.error('Error:', error);
  }
};

// También probar con la canción padre de Don't Cry
const testParentSong = async () => {
  // ID de la canción padre (sin voiceType)
  const parentSongId = 'cmf1hztqf0001fc15ciueocww';
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3001/api/lyrics/${parentSongId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response for Don\'t Cry parent song:', data);
    console.log('Parent LyricsFiles:', data.song?.lyricsFiles);
  } catch (error) {
    console.error('Error:', error);
  }
};

console.log('Testing lyrics endpoints...');
testLyricsEndpoint();
testParentSong();
