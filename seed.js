// seed.js
const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  // Read CSV file
  const csvPath = path.join(__dirname, 'users-clean.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  
  // Parse CSV
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',')
  
  console.log(`📁 Found ${lines.length - 1} users in CSV file`)

  // Process each user (skip header row)
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    
    const userData = {
      email: values[0].trim(),
      name: values[1].trim(),
      department: values[2].trim(),
      year: parseInt(values[3].trim()),
      hostel: values[4].trim(),
      pors: values[5].trim().split(',').map(p => p.trim()).filter(p => p), // Split by comma and clean
      isAdmin: values[6].trim().toLowerCase() === 'true',
      passwordPlain: values[7].trim()
    }

    // Hash the password
    const hashedPassword = await hash(userData.passwordPlain, 12)

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        department: userData.department,
        year: userData.year,
        hostel: userData.hostel,
        pors: userData.pors,
        isAdmin: userData.isAdmin,
      },
      create: {
        email: userData.email,
        name: userData.name,
        department: userData.department,
        year: userData.year,
        hostel: userData.hostel,
        pors: userData.pors,
        isAdmin: userData.isAdmin,
        password: hashedPassword,
      },
    })

    console.log(`✓ ${userData.isAdmin ? '👑 Admin' : '👤 User'}: ${userData.name} (${userData.email})`)
  }

  console.log("\n✅ Database seeded successfully from CSV!")
}

// Helper function to parse CSV line (handles quoted fields)
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current) // Add last field
  
  return result
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
  