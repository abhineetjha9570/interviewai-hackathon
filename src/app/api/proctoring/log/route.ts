import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { interviewId, eventType, details, penaltyPoints = 2 } = await req.json();
    const user = await getCurrentUser();

    if (user) {
      await prisma.proctoringEvent.create({
        data: {
          userId: user.id,
          interviewId,
          eventType,
          details,
          penaltyPoints,
        },
      });

      // Update integrity score in avatarInterview if applicable
      if (interviewId) {
        await prisma.avatarInterview.updateMany({
          where: { id: interviewId },
          data: {
            integrityScore: {
              decrement: penaltyPoints,
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
