#!/usr/bin/env node

/**
 * Authentication System Integration Test
 * Tests database connection, user lookup, and password verification
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

async function testDatabaseConnection() {
  log(COLORS.cyan, '\n📊 Testing Database Connection...');
  
  try {
    await prisma.$connect();
    log(COLORS.green, '✅ PostgreSQL connection successful');
    
    const result = await prisma.$queryRaw`SELECT version()`;
    log(COLORS.blue, `   Database: ${result[0].version.split(',')[0]}`);
    
    return true;
  } catch (error) {
    log(COLORS.red, `❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function testUserAuthentication() {
  log(COLORS.cyan, '\n🔐 Testing User Authentication...');
  
  const testCases = [
    { email: 'admin@state-immocom.com', password: 'Admin@2024', expectedRole: 'ADMIN' },
    { email: 'kwame@state-immocom.com', password: 'Agent@2024', expectedRole: 'AGENT' },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: testCase.email },
      });

      if (!user) {
        log(COLORS.red, `   ❌ User not found: ${testCase.email}`);
        failed++;
        continue;
      }

      const isPasswordValid = await bcrypt.compare(testCase.password, user.password);
      const isRoleCorrect = user.role === testCase.expectedRole;

      if (isPasswordValid && isRoleCorrect) {
        log(COLORS.green, `   ✅ ${testCase.email} - ${user.role} - Password valid`);
        passed++;
      } else {
        log(COLORS.red, `   ❌ ${testCase.email} - Password: ${isPasswordValid}, Role: ${isRoleCorrect}`);
        failed++;
      }
    } catch (error) {
      log(COLORS.red, `   ❌ Error testing ${testCase.email}: ${error.message}`);
      failed++;
    }
  }

  log(COLORS.blue, `\n   Summary: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function testDatabaseStatistics() {
  log(COLORS.cyan, '\n📈 Database Statistics...');
  
  try {
    const userCount = await prisma.user.count();
    const propertyCount = await prisma.property.count();
    const conversationCount = await prisma.conversation.count();

    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    log(COLORS.green, `   ✅ Total Users: ${userCount}`);
    roleDistribution.forEach(stat => {
      log(COLORS.blue, `      - ${stat.role}: ${stat._count}`);
    });
    log(COLORS.green, `   ✅ Total Properties: ${propertyCount}`);
    log(COLORS.green, `   ✅ Total Conversations: ${conversationCount}`);

    return true;
  } catch (error) {
    log(COLORS.red, `   ❌ Statistics query failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log(COLORS.yellow, '\n========================================');
  log(COLORS.yellow, '🧪 State-ImmoCom Authentication Tests');
  log(COLORS.yellow, '========================================');

  const results = {
    connection: await testDatabaseConnection(),
    authentication: await testUserAuthentication(),
    statistics: await testDatabaseStatistics(),
  };

  log(COLORS.yellow, '\n========================================');
  log(COLORS.yellow, '📊 Test Results Summary');
  log(COLORS.yellow, '========================================');

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    log(COLORS.green, '\n✅ All tests PASSED!');
    log(COLORS.green, '🚀 Authentication system is ready for production');
  } else {
    log(COLORS.red, '\n❌ Some tests FAILED!');
    log(COLORS.red, '⚠️  Please review the errors above');
  }

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

runAllTests();
