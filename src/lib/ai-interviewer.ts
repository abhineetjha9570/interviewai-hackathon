export interface InterviewContext {
  candidateName: string;
  role: string;
  experienceLevel: string;
  company: string;
  roundNumber: number;
  resumeDetails?: string;
  jobDescription?: string;
  conversationHistory: Array<{
    sender: 'AI' | 'USER' | 'SYSTEM';
    message: string;
  }>;
}

export interface InterviewerResponse {
  nextQuestion: string;
  interviewerPersonaName: string;
  detectedEmotion?: string;
  scoreUpdate?: {
    communication: number;
    technicalAccuracy?: number;
    confidence: number;
    answerStructure: number;
  };
  feedbackTip?: string;
  isRoundComplete?: boolean;
}

export function generateInterviewerTurn(
  context: InterviewContext,
  candidateAnswer?: string
): InterviewerResponse {
  const { roundNumber, candidateName, company, role, conversationHistory, resumeDetails } = context;

  // Round 1: HR & Behavioral (15 Mins)
  if (roundNumber === 1) {
    const userMessages = conversationHistory.filter(m => m.sender === 'USER');
    
    if (userMessages.length === 0) {
      return {
        nextQuestion: `Hi ${candidateName}! Welcome to your comprehensive interview for the ${role} position at ${company}. Let's begin with a brief introduction. Could you tell me about yourself and your journey in software engineering?`,
        interviewerPersonaName: 'Sarah',
        scoreUpdate: { communication: 82, confidence: 80, answerStructure: 78 },
        feedbackTip: 'Start with Present, Past, Future: your current background, core projects, and future career goals.',
      };
    }

    const lastMsg = candidateAnswer || userMessages[userMessages.length - 1]?.message || '';
    const lower = lastMsg.toLowerCase();

    if (userMessages.length === 1) {
      // Resume and project probing
      let projectMention = 'one of your prominent engineering projects';
      if (lower.includes('project') || lower.includes('system') || lower.includes('portal') || lower.includes('clone') || lower.includes('app')) {
        projectMention = 'the projects you highlighted';
      }
      return {
        nextQuestion: `That sounds like a great foundation, ${candidateName}. In your resume, you mentioned building technical software solutions. Can you walk me through the architecture of ${projectMention}, and explain what key architectural trade-offs you had to make during development?`,
        interviewerPersonaName: 'Sarah',
        scoreUpdate: { communication: 84, confidence: 82, answerStructure: 80 },
        feedbackTip: 'Clearly specify your role, technical stack, architecture diagrams in mind, and trade-offs.',
      };
    }

    if (userMessages.length === 2) {
      // Behavioral / Conflict / Challenge
      return {
        nextQuestion: `Interesting technical decision! Now let's explore behavioral dynamics. Could you describe a situation where you had a significant technical disagreement or communication challenge with a teammate or project partner? How did you resolve it, and what was the outcome?`,
        interviewerPersonaName: 'Sarah',
        scoreUpdate: { communication: 81, confidence: 79, answerStructure: 76 },
        feedbackTip: 'Use the STAR format: Situation, Task, Action, and quantifiable Result.',
      };
    }

    if (userMessages.length === 3) {
      // Situational / Pressure
      return {
        nextQuestion: `Thank you for sharing that context. Imagine you are working on a high-stakes release at ${company}, and a critical regression is discovered 2 hours before the production deployment deadline. How would you prioritize actions between mitigation, debugging, and stakeholder communication?`,
        interviewerPersonaName: 'Sarah',
        scoreUpdate: { communication: 85, confidence: 83, answerStructure: 82 },
        feedbackTip: 'Emphasize calm triage, customer impact containment, team communication, and post-mortem.',
      };
    }

    // Wrap up Round 1
    return {
      nextQuestion: `Excellent insights, ${candidateName}. That gives me a very clear understanding of your communication style and ownership mindset. We have completed Round 1! We will now transition to Round 2 — Coding & DSA. Please prepare your algorithm thinking.`,
      interviewerPersonaName: 'Sarah',
      scoreUpdate: { communication: 85, confidence: 84, answerStructure: 82 },
      isRoundComplete: true,
      feedbackTip: 'Round 1 complete with high marks in structured communication.',
    };
  }

  // Round 3: Managerial + Core CS + System Design + DSA (25 Mins)
  if (roundNumber === 3) {
    const userMessages = conversationHistory.filter(m => m.sender === 'USER');

    if (userMessages.length === 0) {
      return {
        nextQuestion: `Welcome to Round 3, ${candidateName}. I'm David, Senior Engineering Manager. In this round, we'll dive deep into Core Computer Science, System Design, and architectural trade-offs. Let's start with databases: What is Database Normalization? Can you explain the difference between 2NF and 3NF, and in what real-world scenarios you would deliberately denormalize a schema?`,
        interviewerPersonaName: 'David',
        scoreUpdate: { communication: 80, technicalAccuracy: 78, confidence: 76, answerStructure: 75 },
        feedbackTip: 'Explain functional dependencies, transitive dependencies, and read vs write performance trade-offs in OLTP vs OLAP.',
      };
    }

    const lastMsg = candidateAnswer || userMessages[userMessages.length - 1]?.message || '';
    const lower = lastMsg.toLowerCase();

    if (userMessages.length === 1) {
      // System Design follow-up
      return {
        nextQuestion: `Great explanation on normalization and read optimization. Now let's consider scale: How would you design a distributed URL Shortener (like TinyURL or Bitly) handling 500 million links and 10 billion clicks per month? What hash generation strategy, caching layer, and database schema would you choose to guarantee sub-10ms redirect latency?`,
        interviewerPersonaName: 'David',
        scoreUpdate: { communication: 82, technicalAccuracy: 80, confidence: 78, answerStructure: 79 },
        feedbackTip: 'Discuss Base62 encoding, Redis caching for hot URLs, SQL vs NoSQL key-value storage, and high availability.',
      };
    }

    if (userMessages.length === 2) {
      // OS / Concurrency & Distributed tradeoffs
      return {
        nextQuestion: `Solid architectural breakdown. Let's dig deeper into concurrency and operating systems: In a high-concurrency backend service, how do you prevent Race Conditions and Deadlocks? What is the difference between optimistic concurrency control and pessimistic locking, and when would you use each?`,
        interviewerPersonaName: 'David',
        scoreUpdate: { communication: 83, technicalAccuracy: 81, confidence: 80, answerStructure: 80 },
        feedbackTip: 'Mention four Coffman conditions for deadlocks, mutexes/semaphores, and version-based optimistic locking.',
      };
    }

    if (userMessages.length === 3) {
      // Managerial / Ownership scenario
      return {
        nextQuestion: `Now let's discuss engineering leadership and ownership: Suppose a senior engineer proposes a complex microservice rewrite right before a company-wide product launch, while product managers want feature velocity. As an engineer on the team, how do you navigate this conflict and align the technical roadmap with business priorities?`,
        interviewerPersonaName: 'David',
        scoreUpdate: { communication: 85, technicalAccuracy: 83, confidence: 82, answerStructure: 83 },
        feedbackTip: 'Balance technical debt management with business impact and incremental migration strategies.',
      };
    }

    // Wrap up Round 3
    return {
      nextQuestion: `Very thorough technical and managerial reasoning, ${candidateName}. You demonstrated strong foundations in database design, concurrency, and pragmatic engineering trade-offs. We are now wrapping up Round 3 and moving into the final round: Negotiation & HR.`,
      interviewerPersonaName: 'David',
      scoreUpdate: { communication: 85, technicalAccuracy: 84, confidence: 82, answerStructure: 84 },
      isRoundComplete: true,
      feedbackTip: 'Round 3 completed with high marks in systems reasoning.',
    };
  }

  // Round 4: Negotiation + HR (10 Mins)
  if (roundNumber === 4) {
    const userMessages = conversationHistory.filter(m => m.sender === 'USER');

    if (userMessages.length === 0) {
      return {
        nextQuestion: `Hello again, ${candidateName}! Congratulations on progressing through our technical and managerial rounds. In this final round, we'll discuss your compensation expectations, joining timeline, and long-term career alignment with ${company}. To begin, what is your expected CTC or compensation package for this ${role} position?`,
        interviewerPersonaName: 'Sarah',
        scoreUpdate: { communication: 84, confidence: 82, answerStructure: 80 },
        feedbackTip: 'State a well-researched market compensation range with rationale based on your technical depth and value.',
      };
    }

    const lastMsg = candidateAnswer || userMessages[userMessages.length - 1]?.message || '';

    if (userMessages.length === 1) {
      return {
        nextQuestion: `Thank you for sharing your expectation. Based on our current band for fresh graduates and your performance today, our standard starting offer is slightly lower than that number, but includes performance bonuses and equity options. How flexible are you regarding the fixed component versus variable incentives and stock grants?`,
        interviewerPersonaName: 'Sarah',
        scoreUpdate: { communication: 86, confidence: 84, answerStructure: 83 },
        feedbackTip: 'Show flexibility while emphasizing total compensation value, learning trajectory, and performance incentives.',
      };
    }

    if (userMessages.length === 2) {
      return {
        nextQuestion: `That demonstrates great professional maturity. What would be your earliest possible joining date, and do you have any location preferences between our offices in Bangalore, Hyderabad, or Noida? Also, where do you see your technical impact growing over the next 2-3 years at ${company}?`,
        interviewerPersonaName: 'Sarah',
        scoreUpdate: { communication: 88, confidence: 86, answerStructure: 85 },
        feedbackTip: 'Reiterate readiness, enthusiasm to deliver value immediately, and ambition to grow into a senior engineer.',
      };
    }

    // Completion
    return {
      nextQuestion: `Fantastic, ${candidateName}! That concludes all 4 rounds of your InterviewAI evaluation. You have demonstrated commendable technical acumen, structured problem-solving, and professional communication throughout this 100-minute session. We are now compiling your comprehensive performance report!`,
      interviewerPersonaName: 'Sarah',
      scoreUpdate: { communication: 88, confidence: 87, answerStructure: 86 },
      isRoundComplete: true,
      feedbackTip: 'Interview fully completed. Detailed analytics and report ready.',
    };
  }

  return {
    nextQuestion: `Thank you, ${candidateName}. Let's proceed to the next question.`,
    interviewerPersonaName: 'Sarah',
  };
}
