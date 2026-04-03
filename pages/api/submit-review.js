// pages/api/submit-review.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const { logger } = require("@/lib/logger");

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
    substanceUseStance,
    substanceUseObserved,
    substanceAbuse,
    ismpMentor,
    otherComments
  } = req.body;

  const parsedSubstanceUseStance = parseInt(substanceUseStance, 10);
  const normalizedSubstanceUseStance = Number.isInteger(parsedSubstanceUseStance) && parsedSubstanceUseStance >= 1 && parsedSubstanceUseStance <= 5
    ? parsedSubstanceUseStance
    : null;

  const normalizedSubstanceUseObserved =
    typeof substanceUseObserved === "boolean" ? substanceUseObserved : null;

  try {
    if (normalizedSubstanceUseStance === null || normalizedSubstanceUseObserved === null) {
      return res.status(400).json({
        message: "Please provide valid values for substance usage stance and observed usage"
      });
    }

    // Check if reviews are enabled
    const settings = await prisma.systemSettings.findFirst();
    if (settings && !settings.reviewsEnabled) {
      return res.status(403).json({ message: 'Review submissions are currently disabled' });
    }

    // UPSERT: The magic command for "Create or Edit"
    const result = await prisma.review.upsert({
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
        substanceUseStance: normalizedSubstanceUseStance,
        substanceUseObserved: normalizedSubstanceUseObserved,
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
        substanceUseStance: normalizedSubstanceUseStance,
        substanceUseObserved: normalizedSubstanceUseObserved,
        substanceAbuse: substanceAbuse || "",
        ismpMentor: ismpMentor || "",
        otherComments: otherComments || "",
      },
    });

    // Get reviewee name for better logs
    const reviewee = await prisma.user.findUnique({
      where: { id: revieweeId },
      select: { name: true }
    });

    logger.userAction('SUBMIT_REVIEW', session.user.id, session.user.email, {
      message: `Submitted review for ${reviewee?.name || revieweeId}`,
      revieweeId,
      revieweeName: reviewee?.name,
      ratings: { approachability, academicInclination, workEthics, maturity, openMindedness, academicEthics },
      substanceUseStance: normalizedSubstanceUseStance,
      substanceUseObserved: normalizedSubstanceUseObserved
    });

    return res.status(200).json({ message: 'Success' });
  } catch (error) {
    logger.error('REVIEW_API', 'Review submission failed', error, {
      userId: session.user.id,
      revieweeId
    });
    console.error(error);
    return res.status(500).json({ message: 'Database error' });
  }
}