const fs = require('fs');

function verifyFixIsApplied() {
  try {
    console.log('🔍 Verifying that fix is applied in songsImproved.ts...\n');
    
    const filePath = 'd:\\proyectos\\CGPlayerWeb\\backend\\src\\routes\\songsImproved.ts';
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar marcadores del fix
    const hasOldCode = content.includes('const voiceTypes = [');
    const hasNewCode = content.includes('songsToCreateLyricsFor');
    const hasCorrectSongId = content.includes('songId: songId,');
    const hasTargetSongs = content.includes('🎯 [LYRICS] Target songs:');
    
    console.log('📊 Fix verification results:');
    console.log(`  - Old hardcoded voiceTypes array: ${hasOldCode ? '❌ STILL PRESENT' : '✅ REMOVED'}`);
    console.log(`  - New songsToCreateLyricsFor logic: ${hasNewCode ? '✅ PRESENT' : '❌ MISSING'}`);
    console.log(`  - Correct songId usage: ${hasCorrectSongId ? '✅ PRESENT' : '❌ MISSING'}`);
    console.log(`  - Target songs logging: ${hasTargetSongs ? '✅ PRESENT' : '❌ MISSING'}`);
    
    if (!hasOldCode && hasNewCode && hasCorrectSongId && hasTargetSongs) {
      console.log('\n✅ FIX SUCCESSFULLY APPLIED!');
      console.log('🎯 Next song upload should use the corrected logic');
      
      // Buscar las líneas específicas del nuevo código
      const lines = content.split('\n');
      const targetLine = lines.find(line => line.includes('songsToCreateLyricsFor'));
      if (targetLine) {
        console.log('\n📋 New logic found:');
        console.log(`   ${targetLine.trim()}`);
      }
      
    } else {
      console.log('\n❌ FIX NOT FULLY APPLIED');
      console.log('❗ Some parts of the fix are missing');
    }
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error.message);
  }
}

verifyFixIsApplied();
