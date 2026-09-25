import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

async function updatePasswords() {
  await connectDB();
  const hash123 = await bcrypt.hash('Recruiter123', 12);
  const hashCandidate123 = await bcrypt.hash('Candidate123', 12);
  const hashAdmin123 = await bcrypt.hash('Admin123', 12);

  const recRes = await User.updateOne(
    { email: 'recruiter@jobconnect.dev' },
    { $set: { passwordHash: hash123, isEmailVerified: true, isActive: true, status: 'active' } }
  );
  console.log('Recruiter updated to Recruiter123:', recRes);

  const candRes = await User.updateOne(
    { email: 'candidate@jobconnect.dev' },
    { $set: { passwordHash: hashCandidate123, isEmailVerified: true, isActive: true, status: 'active' } }
  );
  console.log('Candidate updated to Candidate123:', candRes);

  const adminRes = await User.updateOne(
    { email: 'admin@jobconnect.dev' },
    { $set: { passwordHash: hashAdmin123, isEmailVerified: true, isActive: true, status: 'active' } }
  );
  console.log('Admin updated to Admin123:', adminRes);

  await disconnectDB();
  process.exit(0);
}

updatePasswords().catch(console.error);
