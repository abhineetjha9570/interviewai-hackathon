import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const PLANS_CONFIG = {
  FREE: {
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    practiceLimit: 50,
    mockLimit: 1,
    aiInterviewLimit: 1,
    features: ['50 Practice questions', '1 Mock interview', 'Basic ATS score check'],
  },
  STARTER: {
    name: 'Starter',
    priceMonthly: 499,
    priceYearly: 399,
    practiceLimit: 500,
    mockLimit: 5,
    aiInterviewLimit: 3,
    features: ['500 Practice questions', '5 Mock interviews', '3 AI Avatar interviews', 'Full ATS report'],
  },
  PRO: {
    name: 'Pro',
    priceMonthly: 999,
    priceYearly: 799,
    practiceLimit: 9999,
    mockLimit: 15,
    aiInterviewLimit: 10,
    features: ['Unlimited practice questions & Monaco runner', '15 Full mock interviews', '10 Full 100-Minute AI Avatar interviews', 'Full ATS optimizer'],
  },
  PREMIUM: {
    name: 'Premium Enterprise',
    priceMonthly: 1999,
    priceYearly: 1499,
    practiceLimit: 99999,
    mockLimit: 999,
    aiInterviewLimit: 999,
    features: ['Unlimited everything', 'Expert critique', 'Direct referral connections', 'Priority support'],
  },
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        subscription: null,
        plans: PLANS_CONFIG,
      });
    }

    let sub = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'PRO',
          status: 'ACTIVE',
          practiceRemaining: 999,
          mockRemaining: 15,
          aiInterviewRemaining: 10,
        },
      });
    }

    return NextResponse.json({
      subscription: sub,
      plans: PLANS_CONFIG,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan = 'PRO' } = await req.json();
    const planKey = (plan as string).toUpperCase();

    if (!(planKey in PLANS_CONFIG)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const cfg = PLANS_CONFIG[planKey as keyof typeof PLANS_CONFIG];

    const updatedSub = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: planKey,
        status: 'ACTIVE',
        practiceRemaining: cfg.practiceLimit,
        mockRemaining: cfg.mockLimit,
        aiInterviewRemaining: cfg.aiInterviewLimit,
      },
      create: {
        userId: user.id,
        plan: planKey,
        status: 'ACTIVE',
        practiceRemaining: cfg.practiceLimit,
        mockRemaining: cfg.mockLimit,
        aiInterviewRemaining: cfg.aiInterviewLimit,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${cfg.name} plan!`,
      subscription: updatedSub,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
