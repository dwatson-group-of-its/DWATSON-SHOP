import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const ensureDefaultAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';

  if (!email || !password) {
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      console.log(`Promoted existing user ${email} to admin`);
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    isActive: true,
  });

  console.log(`Seeded default admin account: ${email}`);
};

export default ensureDefaultAdmin;
