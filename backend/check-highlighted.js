const { PrismaClient } = require('@prisma/client');

async function checkHighlighted() {
    const prisma = new PrismaClient();
    
    try {
        const lyrics = await prisma.lyric.findMany({
            where: { 
                songId: 'cmf48sdsc0005wpm65y04hkoc' 
            },
            select: {
                id: true,
                content: true,
                isHighlighted: true,
                startTime: true,
                lineNumber: true
            },
            orderBy: {
                lineNumber: 'asc'
            }
        });
        
        console.log('✅ Letras encontradas:', lyrics.length);
        console.log('');
        
        lyrics.forEach((l, i) => {
            const content = l.content?.substring(0, 50) || 'Sin contenido';
            console.log(`${i+1}: Line ${l.lineNumber} | isHighlighted=${l.isHighlighted} | startTime=${l.startTime}s | "${content}"`);
        });
        
        const highlightedCount = lyrics.filter(l => l.isHighlighted === true).length;
        const notHighlightedCount = lyrics.filter(l => l.isHighlighted === false).length;
        
        console.log('');
        console.log(`📊 Resumen:`);
        console.log(`   - Highlighted: ${highlightedCount}`);
        console.log(`   - No Highlighted: ${notHighlightedCount}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

checkHighlighted();
