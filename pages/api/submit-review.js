// pages/api/submit-review.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cache for systemSettings to reduce database queries
let cachedSettings = null;
let cacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: 'Unauthorized' });

  const { 
    revieweeId, 
    approachability, 
    academicInclination, 
    workEthics,
    maturity,
    openMindedness,
    academicEthics,
    substanceAbuse,
    ismpMentor,
    otherComments
  } = req.body;

  try {
    // Check if reviews are enabled (with caching)
    const now = Date.now();
    if (!cachedSettings || now - cacheTime > CACHE_DURATION) {
      cachedSettings = await prisma.systemSettings.findFirst();
      cacheTime = now;
    }
    
    if (cachedSettings && !cachedSettings.reviewsEnabled) {
      return res.status(403).json({ message: 'Review submissions are currently disabled' });
    }

    // Get reviewer and reviewee details
    const reviewer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { applyingFor: true, department: true }
    });

    const reviewee = await prisma.user.findUnique({
      where: { id: revieweeId },
      select: { applyingFor: true, department: true, acceptingReviews: true }
    });

    if (!reviewee) {
      return res.status(404).json({ message: 'Reviewee not found' });
    }

    // Check if reviewee is accepting reviews
    if (!reviewee.acceptingReviews) {
      return res.status(403).json({ message: 'This user is not currently accepting reviews' });
    }

    // Validate program compatibility
    if (reviewer.applyingFor === 'damp' && reviewee.applyingFor === 'damp') {
      // DAMP can only review same department
      if (reviewer.department !== reviewee.department) {
        return res.status(403).json({ message: 'You can only review DAMP applicants from your department' });
      }
    } else if (reviewer.applyingFor !== reviewee.applyingFor) {
      // Can't cross-review between programs
      return res.status(403).json({ message: 'You can only review applicants from your program' });
    }

    // UPSERT: The magic command for "Create or Edit"
    await prisma.review.upsert({
      where: {
        // We look for a unique combo of YOU (reviewer) and THEM (reviewee)
        reviewerId_revieweeId: {
          reviewerId: session.user.id,
          revieweeId: revieweeId,
        },
      },
      // If found, update these fields
      update: {
        approachability: parseInt(approachability),
        academicInclination: parseInt(academicInclination),
        workEthics: parseInt(workEthics),
        maturity: parseInt(maturity),
        openMindedness: parseInt(openMindedness),
        academicEthics: parseInt(academicEthics),
        substanceAbuse: substanceAbuse || "",
        ismpMentor: ismpMentor || "",
        otherComments: otherComments || "",
      },
      // If NOT found, create a new one
      create: {
        reviewerId: session.user.id,
        revieweeId: revieweeId,
        approachability: parseInt(approachability),
        academicInclination: parseInt(academicInclination),
        workEthics: parseInt(workEthics),
        maturity: parseInt(maturity),
        openMindedness: parseInt(openMindedness),
        academicEthics: parseInt(academicEthics),
        substanceAbuse: substanceAbuse || "",
        ismpMentor: ismpMentor || "",
        otherComments: otherComments || "",
      },
    });

    return res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Database error' });
  }
}