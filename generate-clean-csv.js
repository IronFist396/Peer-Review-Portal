// generate-clean-csv.js - Convert new.csv to clean normalized CSV format
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// ==================== NORMALIZATION MAPS ====================
const DEPARTMENT_MAP = {
  'cs': 'Computer Science',
  'cse': 'Computer Science',
  'computer science': 'Computer Science',
  'computer science & engineering': 'Computer Science & Engineering',
  'ee': 'Electrical Engineering',
  'elec': 'Electrical Engineering',
  'electrical': 'Electrical Engineering',
  'electrical engineering': 'Electrical Engineering',
  'me': 'Mechanical Engineering',
  'mech': 'Mechanical Engineering',
  'mechanical': 'Mechanical Engineering',
  'mechanical engineering': 'Mechanical Engineering',
  'meta': 'Metallurgical Engineering',
  'metallurgical': 'Metallurgical Engineering',
  'metallurgical engineering & materials science': 'Metallurgical Engineering & Materials Science',
  'chem': 'Chemical Engineering',
  'chemical': 'Chemical Engineering',
  'chemical engineering': 'Chemical Engineering',
  'civil': 'Civil Engineering',
  'civil engineering': 'Civil Engineering',
  'aero': 'Aerospace Engineering',
  'aerospace': 'Aerospace Engineering',
  'aerospace engineering': 'Aerospace Engineering',
  'ep': 'Engineering Physics',
  'engineering physics': 'Engineering Physics',
  'engineering physics council': 'Engineering Physics',
  'eco': 'Economics',
  'economics': 'Economics',
  'economics council': 'Economics',
  'energy': 'Energy Science and Engineering',
  'energy science and engineering': 'Energy Science and Engineering',
  'physics': 'Physics',
  'mathematics': 'Mathematics',
  'mathematics council': 'Mathematics',
  'chemistry': 'Chemistry',
  'chemistry council': 'Chemistry',
  'environmental science and engineering': 'Environmental Science and Engineering',
};

const POR_MAP = {
  // Core Council variations
  'smp': 'SMP',
  's.m.p': 'SMP',
  's.m.p.': 'SMP',
  'wncc': 'WnCC',
  'w n c c': 'WnCC',
  'web and coding club': 'WnCC',
  'web and coding club (wncc)': 'WnCC',
  'i was a convener of web and coding club (wncc)': 'WnCC',
  
  // Fests - normalize to base name
  'techfest': 'Techfest',
  'tech fest': 'Techfest',
  'techfest coordinator': 'Techfest',
  'techfest core team': 'Techfest',
  'mood indigo': 'Mood Indigo',
  'mood-indigo': 'Mood Indigo',
  'mi': 'Mood Indigo',
  'mood indigo coordinator': 'Mood Indigo',
  'mood indigo core team': 'Mood Indigo',
  
  // Councils
  'student council': 'Student Council',
  'sports council': 'Sports Affairs Council',
  'cultural council': 'Cultural Affairs Council',
  'tech council': 'Technical Affairs Council',
  'technical council': 'Technical Affairs Council',
  'academic council': 'Academic Affairs Council',
  'hostel council': 'Hostel Affairs Council',
  'hostel affairs council': 'Hostel Affairs Council',
  'department council': 'Department Council',
  
  // Sports variations
  'institute sports': 'Institute Sports',
  'nso': 'NSO',
  'nso : cricket': 'Cricket',
  
  // Typo fixes & variations
  'calistanics': 'Calisthenics',
  'calisthenics club': 'Calisthenics',
  'eeri': 'EERI',
  'eeri iitb': 'EERI',
  'frisbee': 'Ultimate Frisbee',
  'frisbee (the night crawlers)': 'Ultimate Frisbee',
  
  // Inter IIT variations
  '56th inter iit sports meet coordinator': 'Inter IIT Sports',
  'coordinator in aavhan and interiit sports meet 2023': 'Aavhan',
  'inter iit squash team captain': 'Inter IIT Sports',
  'inter iit in music': 'Inter IIT Cultural',
  'interiit tech meet 13.0 core team member': 'Inter IIT Tech',
  
  // Teams - normalize to main name only
  'aavhan': 'Aavhan',
  'aavhan coordinator': 'Aavhan',
  'aavhan core team': 'Aavhan',
  'aavhan manager': 'Aavhan',
  'aavhan sports head': 'Aavhan',
  
  // E-Cell variations
  'e-cell': 'E-Cell',
  'e-cell coordinator': 'E-Cell',
  'e-cell core team': 'E-Cell',
  
  // Other teams
  'enactus': 'Enactus',
  'enactus head': 'Enactus',
  'team enactus': 'Enactus',
  'sarc': 'SARC',
  'sarc coordinator': 'SARC',
  'sarc core team': 'SARC',
  'saathi': 'Saathi',
  'saathi overall coordinator': 'Saathi',
  'abhyuday': 'Abhyuday',
  'abhyuday coordinator': 'Abhyuday',
  'abhuyday core team': 'Abhyuday',
  
  // Technical teams
  'mars rover team': 'Mars Rover Team',
  'hyperloop iitb': 'Hyperloop',
  'iitb rocket team': 'Rocket Team',
  'iitb-racing': 'Racing Team',
  'student satellite team': 'Student Satellite',
  'auv iitb': 'AUV',
  'i was in mrt in the first year but not ticking since it wasn\'t for long': 'Mars Rover Team',
  
  // Research & Academic
  'casper research group': 'Research',
  'research': 'Research',
  'volunteer at krittika': 'Krittika',
  
  // Hult Prize variations
  'hult prize': 'Hult Prize',
  'hult prize  (logistics head)': 'Hult Prize',
  
  // SPART variations
  'spart': 'SPART',
  'spart (solar powered airship research team)': 'SPART',
  
  // NSS/NCC/NSO
  'nss': 'NSS',
  'ncc': 'NCC',
  
  // Council merging - Environmental
  'environmental science & engineering council': 'Environmental Engineering Council',
  'environmental science and engineering department council': 'Environmental Engineering Council',
  
  // Hostel roles
  'cultural secretary of hostel-5 in my second year': 'Hostel Affairs Council',
  'hostel 5 council': 'Hostel Affairs Council',
  
  // GRA variations
  'gra overall coordinator': 'GRA',
  'group for rural activities': 'GRA',
  
  // TA roles
  'been a teaching assistant of ent courses': 'Teaching Assistant',
  'i have completed the following taships: ma105': 'Teaching Assistant',
  'was a ta for the course cs101 in my 2nd year': 'Teaching Assistant',
  'elit ta': 'Teaching Assistant',
  'cs108': 'Teaching Assistant',
  'cs215': 'Teaching Assistant',
  'cs236': 'Teaching Assistant',
  
  // Weird entries
  'took part in a few styleup events in my first year': 'Cultural Activities',
  
  // Mentorship
  'summer of science mentor': 'SoS Mentor',
  'enb buzz mentor': 'EnB Mentor',
  'wids mentorship': 'WiDS',
  
  // WISE
  'wise core team member( women in science engineering -a one week program happened at iitb campus for 150+ school girls from different state)': 'WISE',
  
  // Sports Head
  'sports head': 'Sports Affairs Council',
  
  // Team variations
  'team shunya': 'Team Shunya',
  'team zero waste': 'Sustainability Cell',
  
  // ChemE variations
  'cheme tl con': 'Chemical Engineering Council',
  'chemetl and chemistry club': 'Chemistry Council',
  'chemeca': 'Chemical Engineering Council',
  
  // SoC/SoS
  'soc': 'SoC',
  'sos': 'SoS',
  
  // Cultural groups
  'tca(tamil cultural association)': 'Cultural Council',
};

// ==================== NORMALIZATION FUNCTIONS ====================

function normalizeDepartment(dept) {
  if (!dept) return ''
  const cleaned = dept.trim().toLowerCase()
  return DEPARTMENT_MAP[cleaned] || dept.trim()
}

function normalizeHostel(hostel) {
  if (!hostel) return ''
  
  const cleaned = hostel.trim()
  
  // Handle pure numbers
  if (/^\d+$/.test(cleaned)) {
    return `Hostel ${cleaned}`
  }
  
  // Handle variations like "Hostel-5", "hostel 5", "H5", "H-5"
  const match = cleaned.match(/h(?:ostel)?[\s-]*(\d+)/i)
  if (match) {
    return `Hostel ${match[1]}`
  }
  
  return cleaned
}

function normalizePOR(por) {
  if (!por) return null
  
  const cleaned = por.trim()
  const lowerCased = cleaned.toLowerCase()
  
  // Check explicit mapping first
  if (POR_MAP[lowerCased]) {
    return POR_MAP[lowerCased]
  }
  
  // Pattern-based normalization - more aggressive
  
  // 1. Remove "coordinator", "core team", "manager", "head" suffixes
  const rolePatterns = [
    { regex: /^(.+?)\s+(coordinator|core team|manager|head|overall coordinator)$/i, 
      extract: (match) => match[1].trim() },
  ]
  
  for (const pattern of rolePatterns) {
    const match = cleaned.match(pattern.regex)
    if (match) {
      const base = pattern.extract(match)
      const baseLower = base.toLowerCase()
      
      // Check if the base form is in the map
      if (POR_MAP[baseLower]) {
        return POR_MAP[baseLower]
      }
      
      // Otherwise return capitalized base
      return base.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
  }
  
  // 2. Council normalization - standardize format
  if (lowerCased.includes('council')) {
    const councilMap = {
      'hostel council': 'Hostel Affairs Council',
      'sports council': 'Sports Affairs Council',
      'cultural council': 'Cultural Affairs Council',
      'academic council': 'Academic Affairs Council',
      'technical council': 'Technical Affairs Council',
    }
    
    if (councilMap[lowerCased]) {
      return councilMap[lowerCased]
    }
    
    return cleaned.replace(/\s+/g, ' ').trim()
  }
  
  // 3. "Team X" variations - remove "Team" prefix
  const teamMatch = cleaned.match(/^team\s+(.+)$/i)
  if (teamMatch) {
    const teamName = teamMatch[1].trim()
    const teamLower = teamName.toLowerCase()
    
    if (POR_MAP[teamLower]) {
      return POR_MAP[teamLower]
    }
    
    return teamName
  }
  
  return cleaned
}

// Extract PORs from multiple columns
function extractPORs(row) {
  const pors = new Set()
  
  const porColumns = [
    'Institute Councils\nDo NOT tick any option if you have not been a part of the following councils\n',
    'Independent Bodies/Cells/Fests\nDo NOT tick any option if you have not been a part of the following activities',
    'Technical Activities\nDo NOT tick any option if you have not been a part of the following activities',
    'Cultural Activities\nDo NOT tick any option if you have not been a part of the following activities.',
    'Department Councils\nDo NOT tick any option if you have not been a part of the following councils.\n',
    'Sports + Clubs\nDo NOT tick any option if you have not been a part of the following clubs or sports teams'
  ]
  
  porColumns.forEach(col => {
    const value = row[col]
    if (value && value.trim()) {
      value.split(/[,;]/).forEach(p => {
        const normalized = normalizePOR(p.trim())
        if (normalized) pors.add(normalized)
      })
    }
  })
  
  return Array.from(pors)
}

// ==================== CSV GENERATION ====================

async function generateCleanCSV() {
  console.log('📝 Generating clean CSV from new.csv...\n')
  
  const users = []
  const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('new.csv')
      .pipe(csv())
      .on('data', (row) => {
        const rollNumber = row['Roll number']?.trim()
        
        // Skip if no valid roll number
        if (!rollNumber) {
          return
        }
        
        // Generate email from roll number (lowercase)
        const email = `${rollNumber.toLowerCase()}@iitb.ac.in`
        
        const firstName = row['First Name']?.trim() || ''
        const lastName = row['Last Name']?.trim() || ''
        const name = `${firstName} ${lastName}`.trim() || 'Unknown'
        
        const department = normalizeDepartment(row['Department'])
        const hostel = normalizeHostel(row['Hostel'])
        
        // Parse year from strings like "4th year, DD/ IDDDP/ M.Sc."
        let year = 1
        const yearMatch = row['Current year of study']?.match(/(\d+)/)
        if (yearMatch) {
          year = parseInt(yearMatch[1])
        }
        
        const pors = extractPORs(row)
        
        users.push({
          email,
          name,
          department,
          year,
          hostel,
          pors: pors.join(','), // Join with comma for CSV
          isAdmin: 'FALSE',
          password: DEFAULT_PASSWORD
        })
      })
      .on('end', () => {
        console.log(`✓ Processed ${users.length} users from new.csv\n`)
        resolve(users)
      })
      .on('error', reject)
  })
}

async function main() {
  try {
    // Generate user data from new.csv
    const users = await generateCleanCSV()
    
    // Get admin credentials from environment
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
    const ADMIN_NAME = process.env.ADMIN_NAME
    
    // Create CSV content
    const csvRows = []
    
    // Header
    csvRows.push('email,name,department,year,hostel,pors,isAdmin,password')
    
    // Admin row (first)
    csvRows.push(`${ADMIN_EMAIL},${ADMIN_NAME},Administration,4,NA,Admin,TRUE,${ADMIN_PASSWORD}`)
    
    // User rows
    users.forEach(user => {
      // Escape commas in name and pors if needed
      const name = user.name.includes(',') ? `"${user.name}"` : user.name
      const pors = user.pors.includes(',') ? `"${user.pors}"` : user.pors
      const dept = user.department.includes(',') ? `"${user.department}"` : user.department
      const hostel = user.hostel.includes(',') ? `"${user.hostel}"` : user.hostel
      
      csvRows.push(`${user.email},${name},${dept},${user.year},${hostel},${pors},${user.isAdmin},${user.password}`)
    })
    
    // Write to file
    const outputPath = 'users-clean.csv'
    fs.writeFileSync(outputPath, csvRows.join('\n'))
    
    console.log(`✅ Clean CSV generated successfully!`)
    console.log(`   📄 File: ${outputPath}`)
    console.log(`   👑 Admin: ${ADMIN_EMAIL}`)
    console.log(`   👥 Users: ${users.length}`)
    console.log(`   🔑 Default password: ${process.env.DEFAULT_USER_PASSWORD}`)
    console.log(`\n💡 Now you can use this with the original seed.js:`)
    console.log(`   1. Rename: mv users-clean.csv users.csv`)
    console.log(`   2. Seed: node seed.js\n`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
