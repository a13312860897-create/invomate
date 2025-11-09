// Print verification tokens for users in memory DB
// Usage:
//   node backend/scripts/print-verification-tokens.js            # prints all users
//   node backend/scripts/print-verification-tokens.js <email>    # prints specific user

const path = require('path');
const memoryDb = require(path.join(__dirname, '..', 'src', 'config', 'memoryDatabase'));

const emailFilter = process.argv[2];

function toPlainUser(u) {
  return {
    id: u.id,
    email: u.email,
    emailVerified: u.emailVerified,
    verificationToken: u.verificationToken || null,
    verificationExpires: u.verificationExpires || null
  };
}

if (emailFilter) {
  const u = memoryDb.users.find((x) => x.email === emailFilter);
  if (u) {
    console.log(JSON.stringify(toPlainUser(u), null, 2));
  } else {
    console.error(`User not found: ${emailFilter}`);
  }
} else {
  const users = memoryDb.users.map(toPlainUser);
  console.log(JSON.stringify(users, null, 2));
}