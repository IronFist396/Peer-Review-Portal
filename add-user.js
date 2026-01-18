// add-user.js - Quick script to add a single user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addUser() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'newuser@iitb.ac.in',
      name: 'New User Name',
      password: hashedPassword,
      department: 'CS',
      year: 3,
      hostel: 'Hostel 2',
      pors: 'WnCC',
      isAdmin: false,
    },
  });
  
  console.log('✅ User created:', user.email);
  await prisma.$disconnect();
}

addUser().catch(console.error);
