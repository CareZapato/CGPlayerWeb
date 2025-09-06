// Script para probar si las playlists tienen canciones
const fetch = require('node-fetch');

async function testPlaylistSongs() {
    try {
        // Primero hacer login para obtener token
        const loginResponse = await fetch('http://192.168.1.10:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            console.error('❌ Error en login:', await loginResponse.text());
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login exitoso');
        
        // Obtener lista de playlists
        const playlistsResponse = await fetch('http://192.168.1.10:3001/api/playlists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!playlistsResponse.ok) {
            console.error('❌ Error obteniendo playlists:', await playlistsResponse.text());
            return;
        }
        
        const playlists = await playlistsResponse.json();
        console.log(`📋 Encontradas ${playlists.length} playlists`);
        
        // Verificar cada playlist
        for (const playlist of playlists.slice(0, 3)) { // Solo las primeras 3
            console.log(`\n🎵 Playlist: ${playlist.name} (${playlist.totalSongs} canciones)`);
            
            // Obtener detalles completos
            const detailResponse = await fetch(`http://192.168.1.10:3001/api/playlists/${playlist.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (detailResponse.ok) {
                const details = await detailResponse.json();
                console.log(`   - Canciones en items: ${details.items ? details.items.length : 0}`);
                if (details.items && details.items.length > 0) {
                    console.log(`   - Primera canción: ${details.items[0].song.title}`);
                }
            }
        }
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

testPlaylistSongs();
