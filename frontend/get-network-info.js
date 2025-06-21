const os = require('os');
const { execSync } = require('child_process');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Пропускаем internal (localhost) интерфейсы и IPv6
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`Найден сетевой интерфейс ${name}: ${interface.address}`);
        return interface.address;
      }
    }
  }
  
  return '192.168.1.100'; // Дефолтный IP если не найден
}

function displayNetworkInfo() {
  const ip = getLocalIPAddress();
  
  console.log('🌐 === ИНФОРМАЦИЯ О СЕТИ ===');
  console.log(`📍 IP-адрес компьютера: ${ip}`);
  console.log(`🔗 Frontend URL: http://${ip}:5101`);
  console.log(`🔗 Backend URL: http://${ip}:5100`);
  console.log('');
  console.log('📱 === ИНСТРУКЦИИ ДЛЯ МОБИЛЬНОГО ДОСТУПА ===');
  console.log(`1. Убедитесь, что backend запущен на порту 5100`);
  console.log(`2. Откройте на мобильном: http://${ip}:5101`);
  console.log(`3. Убедитесь, что устройства в одной Wi-Fi сети`);
  console.log('');
  console.log('🛠️ === TROUBLESHOOTING ===');
  console.log('- Если не работает, проверьте firewall');
  console.log('- Убедитесь что backend доступен извне');
  console.log('- Попробуйте другой порт: 3001 или 5101');
  console.log('');
  
  return ip;
}

if (require.main === module) {
  displayNetworkInfo();
}

module.exports = { getLocalIPAddress, displayNetworkInfo };
