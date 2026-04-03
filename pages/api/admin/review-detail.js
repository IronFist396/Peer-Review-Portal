import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  if (!adminUser?.isAdmin) {
    return res.status(403).json({ error: "Forbidden - Admin access required" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid review ID" });
  }

  const review = await prisma.review.findUnique({
    where: { id },
    select: {
      id: true,
      substanceUseStance: true,
      substanceUseObserved: true,
      substanceAbuse: true,
      ismpMentor: true,
      otherComments: true,
      createdAt: true,
    },
  });

  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  return res.status(200).json({
    review: {
      ...review,
      createdAt: review.createdAt?.toISOString?.() || null,
    },
  });
}
