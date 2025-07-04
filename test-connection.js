// test-hostinger-hosts.js
import mysql from 'mysql2/promise';

const connectionConfigs = [
  {
    name: 'Current Host',
    host: 'srv604.hstgr.io',
    port: 3306
  },
  {
    name: 'MySQL Hostinger',
    host: 'mysql.hostinger.com',
    port: 3306
  },
  {
    name: 'SQL Hostinger',
    host: 'sql.hostinger.com',
    port: 3306
  },
  {
    name: 'Direct IP',
    host: '45.84.205.0',
    port: 3306
  },
  {
    name: 'Alternative Port',
    host: 'srv604.hstgr.io',
    port: 3307
  }
];

async function testConfig(config) {
  console.log(`\n🔍 Testing: ${config.name}`);
  console.log(`   Host: ${config.host}:${config.port}`);
  
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: 'u424760305_user',
      password: '9H8eexRU^v',
      database: 'u424760305_db',
      connectTimeout: 15000
    });
    
    console.log(`✅ ${config.name} - Connection successful!`);
    
    const [rows] = await connection.execute('SELECT NOW() as time, DATABASE() as db');
    console.log(`📊 Query result:`, rows[0]);
    
    await connection.end();
    return { success: true, config };
  } catch (error) {
    console.error(`❌ ${config.name} - Failed: ${error.message}`);
    return { success: false, config, error: error.message };
  }
}

async function testAllConfigs() {
  console.log('🚀 Testing all Hostinger connection configurations...');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const config of connectionConfigs) {
    const result = await testConfig(config);
    results.push(result);
    
    if (result.success) {
      console.log(`\n🎉 WORKING CONFIGURATION FOUND!`);
      console.log(`   Use: ${config.host}:${config.port}`);
      console.log(`   Update your db.ts with this host!`);
      break;
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('='.repeat(30));
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.config.name}: ${result.config.host}:${result.config.port}`);
  });
  
  const workingConfig = results.find(r => r.success);
  if (workingConfig) {
    console.log(`\n🔧 UPDATE YOUR db.ts FILE:`);
    console.log(`host: '${workingConfig.config.host}',`);
    console.log(`port: ${workingConfig.config.port},`);
  } else {
    console.log(`\n⚠️  No working configuration found.`);
    console.log(`   The Remote MySQL settings might need more time to propagate.`);
    console.log(`   Try again in 5-10 minutes.`);
  }
}

testAllConfigs();