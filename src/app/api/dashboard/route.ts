import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        user: {
          id: 'demo-user',
          name: 'Abhineet Jha',
          email: 'abhineet@interviewai.com',
          role: 'CANDIDATE',
        },
        profile: {
          goal: 'Campus Placement',
          experience: 'Fresher',
          targetRole: 'Software Engineer',
          skills: ['Java', 'Python', 'DSA', 'SQL'],
          resumeName: 'Abhineet_Resume.pdf',
          jobDescription: null,
          streakDays: 12,
          overallPrepPct: 72,
          aptitudeScore: 78,
          dsaScore: 65,
          technicalScore: 70,
          hrScore: 80,
        },
        resumeAts: {
          score: 78,
          fileName: 'Abhineet_Resume.pdf',
          status: 'Analyzed',
        },
        weakAreas: [
          { name: 'Dynamic Programming', score: 38, priority: 'HIGH', category: 'DSA' },
          { name: 'Graph', score: 42, priority: 'HIGH', category: 'DSA' },
          { name: 'System Design', score: 48, priority: 'MEDIUM', category: 'TECHNICAL' },
          { name: 'DBMS', score: 52, priority: 'MEDIUM', category: 'TECHNICAL' },
          { name: 'Communication', score: 62, priority: 'LOW', category: 'HR' },
        ],
        performanceAnalytics: [
          { week: 'Week 1', score: 54 },
          { week: 'Week 2', score: 62 },
          { week: 'Week 3', score: 68 },
          { week: 'Week 4', score: 76 },
        ],
        recentActivity: [
          {
            id: 'act-1',
            type: 'DSA Practice',
            title: 'Arrays (10 Questions)',
            score: '82%',
            timeAgo: '2 hours ago',
            category: 'PRACTICE',
          },
          {
            id: 'act-2',
            type: 'Mock Interview',
            title: 'Amazon - Technical',
            score: '76%',
            timeAgo: '1 day ago',
            category: 'MOCK',
          },
          {
            id: 'act-3',
            type: 'AI Avatar Interview',
            title: 'Full 100-Min Interview',
            score: '78%',
            timeAgo: '3 days ago',
            category: 'AI_AVATAR',
          },
          {
            id: 'act-4',
            type: 'Resume Analysis',
            title: 'ATS Score Check',
            score: '78/100',
            timeAgo: '4 days ago',
            category: 'RESUME',
          },
        ],
        upcomingSessions: [
          {
            id: 'ses-1',
            dateDay: '15',
            dateMonth: 'Dec',
            title: 'Mock Interview',
            subtitle: 'Google - SDE',
            time: '10:00 AM',
            type: 'MOCK',
          },
          {
            id: 'ses-2',
            dateDay: '17',
            dateMonth: 'Dec',
            title: 'AI Avatar Interview',
            subtitle: 'Full 100 Minutes',
            time: '02:00 PM',
            type: 'AVATAR',
          },
          {
            id: 'ses-3',
            dateDay: '20',
            dateMonth: 'Dec',
            title: 'Practice Session',
            subtitle: 'Graphs & DP',
            time: '06:00 PM',
            type: 'PRACTICE',
          },
        ],
        recommendations: [],
        subscription: {
          plan: 'PRO',
          status: 'ACTIVE',
          practiceRemaining: 999,
          mockRemaining: 15,
          aiInterviewRemaining: 10,
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        subscription: true,
        recommendations: true,
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        mockInterviews: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        avatarInterviews: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const latestResume = fullUser.resumes[0];

    const data = {
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
      },
      profile: {
        goal: fullUser.profile?.goal || 'Campus Placement',
        experience: fullUser.profile?.experience || 'Fresher',
        targetRole: fullUser.profile?.targetRole || 'Software Engineer',
        skills: fullUser.profile?.skills ? JSON.parse(fullUser.profile.skills) : ['Java', 'Python', 'DSA', 'SQL'],
        resumeName: fullUser.profile?.resumeName || 'Abhineet_Resume.pdf',
        jobDescription: fullUser.profile?.jobDescription || null,
        streakDays: fullUser.profile?.streakDays || 12,
        overallPrepPct: fullUser.profile?.overallPrepPct || 72,
        aptitudeScore: fullUser.profile?.aptitudeScore || 78,
        dsaScore: fullUser.profile?.dsaScore || 65,
        technicalScore: fullUser.profile?.technicalScore || 70,
        hrScore: fullUser.profile?.hrScore || 80,
      },
      resumeAts: {
        score: latestResume?.atsScore || 78,
        fileName: latestResume?.fileName || 'Abhineet_Resume.pdf',
        status: 'Analyzed',
      },
      weakAreas: [
        { name: 'Dynamic Programming', score: 38, priority: 'HIGH', category: 'DSA' },
        { name: 'Graph', score: 42, priority: 'HIGH', category: 'DSA' },
        { name: 'System Design', score: 48, priority: 'MEDIUM', category: 'TECHNICAL' },
        { name: 'DBMS', score: 52, priority: 'MEDIUM', category: 'TECHNICAL' },
        { name: 'Communication', score: 62, priority: 'LOW', category: 'HR' },
      ],
      performanceAnalytics: [
        { week: 'Week 1', score: 54 },
        { week: 'Week 2', score: 62 },
        { week: 'Week 3', score: 68 },
        { week: 'Week 4', score: 76 },
      ],
      recentActivity: [
        {
          id: 'act-1',
          type: 'DSA Practice',
          title: 'Arrays (10 Questions)',
          score: '82%',
          timeAgo: '2 hours ago',
          category: 'PRACTICE',
        },
        {
          id: 'act-2',
          type: 'Mock Interview',
          title: 'Amazon - Technical',
          score: '76%',
          timeAgo: '1 day ago',
          category: 'MOCK',
        },
        {
          id: 'act-3',
          type: 'AI Avatar Interview',
          title: 'Full 100-Min Interview',
          score: '78%',
          timeAgo: '3 days ago',
          category: 'AI_AVATAR',
        },
        {
          id: 'act-4',
          type: 'Resume Analysis',
          title: 'ATS Score Check',
          score: '78/100',
          timeAgo: '4 days ago',
          category: 'RESUME',
        },
      ],
      upcomingSessions: [
        {
          id: 'ses-1',
          dateDay: '15',
          dateMonth: 'Dec',
          title: 'Mock Interview',
          subtitle: 'Google - SDE',
          time: '10:00 AM',
          type: 'MOCK',
        },
        {
          id: 'ses-2',
          dateDay: '17',
          dateMonth: 'Dec',
          title: 'AI Avatar Interview',
          subtitle: 'Full 100 Minutes',
          time: '02:00 PM',
          type: 'AVATAR',
        },
        {
          id: 'ses-3',
          dateDay: '20',
          dateMonth: 'Dec',
          title: 'Practice Session',
          subtitle: 'Graphs & DP',
          time: '06:00 PM',
          type: 'PRACTICE',
        },
      ],
      recommendations: fullUser.recommendations || [],
      subscription: fullUser.subscription || {
        plan: 'PRO',
        status: 'ACTIVE',
        practiceRemaining: 999,
        mockRemaining: 15,
        aiInterviewRemaining: 10,
      },
    };

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
