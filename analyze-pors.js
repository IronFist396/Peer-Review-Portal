// analyze-pors.js - Detailed POR analysis
const fs = require('fs');
const csv = require('csv-parser');

const POR_MAP = {
  // Core Council variations
  'smp': 'SMP',
  's.m.p': 'SMP',
  's.m.p.': 'SMP',
  'wncc': 'WnCC',
  'w n c c': 'WnCC',
  'web and coding club': 'WnCC',
  'web and coding club (wncc)': 'WnCC',
  
  // Fests
  'techfest': 'Techfest',
  'tech fest': 'Techfest',
  'techfest coordinator': 'Techfest Coordinator',
  'techfest core team': 'Techfest Core Team',
  'mood indigo': 'Mood Indigo',
  'mood-indigo': 'Mood Indigo',
  'mi': 'Mood Indigo',
  'mood indigo coordinator': 'Mood Indigo Coordinator',
  'mood indigo core team': 'Mood Indigo Core Team',
  
  // Councils
  'student council': 'Student Council',
  'sports council': 'Sports Affairs Council',
  'cultural council': 'Cultural Affairs Council',
  'tech council': 'Technical Affairs Council',
  'technical council': 'Technical Affairs Council',
  'academic council': 'Academic Affairs Council',
  'hostel council': 'Hostel Affairs Council',
  
  // Sports variations
  'institute sports': 'Institute Sports',
  
  // Teams - normalize to main name only
  'aavhan': 'Aavhan',
  'aavhan coordinator': 'Aavhan',
  'aavhan core team': 'Aavhan',
  'aavhan manager': 'Aavhan',
  'aavhan sports head': 'Aavhan',
  
  // Typo fixes
  'calistanics': 'Calisthenics',
  'calisthenics club': 'Calisthenics',
  
  // E-Cell variations
  'e-cell': 'E-Cell',
  'e-cell coordinator': 'E-Cell',
  'e-cell core team': 'E-Cell',
};

function normalizePOR(por) {
  if (!por) return null
  
  const cleaned = por.trim()
  const lowerCased = cleaned.toLowerCase()
  
  if (POR_MAP[lowerCased]) {
    return POR_MAP[lowerCased]
  }
  
  const basePatterns = [
    { regex: /^(aavhan)\s+(coordinator|core team|manager|sports head)$/i, base: 'Aavhan' },
    { regex: /^(abhyuday)\s+(coordinator|core team)$/i, base: 'Abhyuday' },
    { regex: /^(enactus)\s+(head|coordinator|core team)?$/i, base: 'Enactus' },
    { regex: /^(sarc)\s+(coordinator|core team)$/i, base: 'SARC' },
    { regex: /^(saathi)\s+(overall coordinator|coordinator)?$/i, base: 'Saathi' },
  ]
  
  for (const pattern of basePatterns) {
    const match = cleaned.match(pattern.regex)
    if (match) return pattern.base
  }
  
  if (lowerCased.includes('council')) {
    return cleaned.replace(/\s+/g, ' ').trim()
  }
  
  return cleaned
}

const originalPORs = new Map(); // original -> count
const normalizedPORs = new Map(); // normalized -> [originals]

fs.createReadStream('new.csv')
  .pipe(csv())
  .on('data', (row) => {
    const porCols = [
      'Institute Councils\nDo NOT tick any option if you have not been a part of the following councils\n',
      'Independent Bodies/Cells/Fests\nDo NOT tick any option if you have not been a part of the following activities',
      'Technical Activities\nDo NOT tick any option if you have not been a part of the following activities',
      'Cultural Activities\nDo NOT tick any option if you have not been a part of the following activities.',
      'Department Councils\nDo NOT tick any option if you have not been a part of the following councils.\n',
      'Sports + Clubs\nDo NOT tick any option if you have not been a part of the following clubs or sports teams'
    ];
    
    porCols.forEach(col => {
      if (row[col]) {
        row[col].split(/[,;]/).forEach(p => {
          const original = p.trim();
          if (!original) return;
          
          originalPORs.set(original, (originalPORs.get(original) || 0) + 1);
          
          const normalized = normalizePOR(original);
          if (!normalizedPORs.has(normalized)) {
            normalizedPORs.set(normalized, []);
          }
          if (!normalizedPORs.get(normalized).includes(original)) {
            normalizedPORs.get(normalized).push(original);
          }
        });
      }
    });
  })
  .on('end', () => {
    console.log(`\n📊 POR Analysis Summary:`);
    console.log(`   Original unique PORs: ${originalPORs.size}`);
    console.log(`   After normalization: ${normalizedPORs.size}`);
    console.log(`   Duplicates eliminated: ${originalPORs.size - normalizedPORs.size}\n`);
    
    console.log(`\n✅ Successfully Normalized (variations merged):\n`);
    const normalized = Array.from(normalizedPORs.entries())
      .filter(([_, originals]) => originals.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    normalized.forEach(([canonical, variations]) => {
      console.log(`  "${canonical}" ← merged from ${variations.length} variations:`);
      variations.forEach(v => console.log(`    - "${v}"`));
      console.log();
    });
    
    console.log(`\n⚠️  Potential Issues (might need more normalization):\n`);
    const similar = [];
    const pors = Array.from(normalizedPORs.keys()).sort();
    
    for (let i = 0; i < pors.length; i++) {
      for (let j = i + 1; j < pors.length; j++) {
        const a = pors[i].toLowerCase();
        const b = pors[j].toLowerCase();
        
        // Check for similar names
        if (a.includes(b.substring(0, Math.min(b.length, 10))) || 
            b.includes(a.substring(0, Math.min(a.length, 10)))) {
          similar.push([pors[i], pors[j]]);
        }
      }
    }
    
    similar.slice(0, 20).forEach(([a, b]) => {
      console.log(`  "${a}" vs "${b}"`);
    });
    
    console.log(`\n\n📋 All Final PORs (${normalizedPORs.size} total):\n`);
    Array.from(normalizedPORs.keys()).sort().forEach((por, i) => {
      console.log(`${(i+1).toString().padStart(3)}. ${por}`);
    });
  });
