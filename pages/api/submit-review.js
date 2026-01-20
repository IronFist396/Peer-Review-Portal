// pages/api/submit-review.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    // Check if reviews are enabled
    const settings = await prisma.systemSettings.findFirst();
    if (settings && !settings.reviewsEnabled) {
      return res.status(403).json({ message: 'Review submissions are currently disabled' });
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