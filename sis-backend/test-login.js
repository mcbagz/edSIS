const bcrypt = require('bcryptjs');

async function testPassword() {
  const inputPassword = 'admin123';
  const storedHash = '$2a$10$Uz0z9DQyWh4YZ1bBPVwmeOlMoLqGAOWLZlzBqKQGm4UyRSQgEFsXa'; // from database
  
  // Test if password matches
  const isValid = await bcrypt.compare(inputPassword, storedHash);
  console.log('Password match result:', isValid);
  
  // Generate new hash for comparison
  const newHash = await bcrypt.hash(inputPassword, 10);
  console.log('New hash for admin123:', newHash);
}

testPassword();