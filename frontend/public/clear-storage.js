// Script para limpiar completamente el almacenamiento del navegador
// y forzar una re-autenticación limpia

console.log('🧹 Limpiando almacenamiento del navegador...');

// Limpiar localStorage
const keysToRemove = [
  'token',
  'user',
  'auth-storage',
  'player-storage',
  'playlist-storage'
];

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Eliminado localStorage: ${key}`);
});

// Limpiar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpiado');

// Limpiar cookies si las hay
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookies limpiadas');

console.log('🎉 Limpieza completa. Recarga la página para un estado limpio.');

// Forzar recarga
setTimeout(() => {
  window.location.reload();
}, 1000);
