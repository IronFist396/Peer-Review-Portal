// pages/api/recommendations.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Get MY profile details
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { department: true, hostel: true, pors: true, applyingFor: true }
    });

    // Build program filter
    let programFilter = {};
    
    if (me.applyingFor === 'ismp') {
      // ISMP users can see all ISMP applicants
      programFilter = { applyingFor: 'ismp' };
    } else if (me.applyingFor === 'damp') {
      // DAMP users can only see DAMP applicants from their department
      programFilter = { 
        applyingFor: 'damp',
        department: me.department 
      };
    }

    // 2. Find matches
    const matches = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } }, // Not myself
          { isAdmin: false }, // Exclude all admins from recommendations
          { isDeptHead: false }, // Exclude dept heads
          { acceptingReviews: true }, // Only accepting reviews
          programFilter, // Apply program filter
          {
            OR: [
              { department: me.department },       // Same Dept
              { hostel: me.hostel },               // Same Hostel
              { pors: { hasSome: me.pors } }       // Shares at least one POR
            ]
          }
        ]
      },
      // 3. Check if reviewed
      include: {
        reviewsReceived: {
          where: { reviewerId: session.user.id },
          select: { id: true }
        }
      },
      take: 20 // Limit to 20 suggestions
    });

    // 4. Clean up data and explain WHY they matched
    const formatted = matches.map(user => {
      const matchReasons = [];
      let matchScore = 0; // Track match strength
      let matchCount = 0; // Number of different types of matches
      
      if (user.department === me.department) {
        matchReasons.push("Same Dept");
        matchScore += 2;
        matchCount += 1;
      }
      if (user.hostel === me.hostel) {
        matchReasons.push("Same Hostel");
        matchScore += 3; // Hostel weighted higher - more likely to know
        matchCount += 1;
      }
      
      // Check which PORs overlap
      const commonPors = user.pors.filter(p => me.pors.includes(p));
      if (commonPors.length > 0) {
        matchReasons.push(`${commonPors.length} Shared POR${commonPors.length > 1 ? 's' : ''}`);
        matchScore += commonPors.length * 2; // Each POR adds 2 points
        matchCount += 1;
      }

      // Boost score if multiple types of matches (compound bonus)
      if (matchCount > 1) {
        matchScore += matchCount * 3; // Extra 3 points per additional match type
      }

      return {
        id: user.id,
        name: user.name,
        department: user.department,
        year: user.year,
        hostel: user.hostel,
        applyingFor: user.applyingFor,
        matchTag: matchReasons.join(" • "), // e.g. "Same Dept • 2 Shared PORs"
        matchScore: matchScore, // For sorting
        matchCount: matchCount, // Number of match types
        hasReviewed: user.reviewsReceived.length > 0
      };
    });

    // 5. Sort by match count first (more types of matches = higher), then score, then name
    const sorted = formatted.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount; // More match types first
      }
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore; // Higher score first
      }
      return a.name.localeCompare(b.name); // Alphabetical if tied
    });

    res.status(200).json(sorted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
}