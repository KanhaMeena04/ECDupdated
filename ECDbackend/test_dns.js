const dns = require('dns');

async function testDNS(name, servers) {
  if (servers) {
    dns.setServers(servers);
  }
  console.log(`Testing DNS [${name}]:`, dns.getServers());
  return new Promise((resolve) => {
    dns.resolveSrv('_mongodb._tcp.rishiserver.kdybcms.mongodb.net', (err, addresses) => {
      if (err) {
        console.log(`[${name}] SRV Error:`, err.message);
        resolve(null);
      } else {
        console.log(`[${name}] SRV Success:`, addresses);
        resolve(addresses);
      }
    });
  });
}

async function run() {
  await testDNS('Default System DNS');
  await testDNS('Google DNS', ['8.8.8.8', '8.8.4.4']);
  await testDNS('Cloudflare DNS', ['1.1.1.1', '1.0.0.1']);
}

run();
