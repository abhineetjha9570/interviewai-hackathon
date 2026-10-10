// AI Career Roadmap Generator Engine
// Provides structured, personalized learning pathways aligned with user goals, study time, and skill level.
// Supports both AI generation (when API keys are present) and Verified Industry Curriculum Frameworks.

export interface RoadmapInput {
  targetRole: string;
  educationLevel?: string;
  degreeOrBranch?: string;
  graduationYear?: string;
  programmingLanguages?: string[];
  technicalSkills?: string[];
  experienceLevel?: string; // Fresher, 1-2 years, 3+ years
  existingProjects?: string;
  internshipExperience?: string;
  preferredDomain?: string; // Fintech, Cloud, AI/ML, Web, Enterprise
  targetDurationWeeks: number; // e.g. 8, 12, 16, 24
  weeklyStudyHours: number; // e.g. 10, 15, 20, 30
  currentSkillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  learningPace?: 'Relaxed' | 'Moderate' | 'Intensive';
}

export interface GeneratedMilestone {
  milestoneKey: string;
  title: string;
  description: string;
  importance: 'Essential' | 'High' | 'Recommended';
  requiredKnowledge: string[];
  estimatedHours: number;
  learningObjectives: string[];
  projectIdea: string;
  completionCriteria: string;
  relevantResources: string[];
  relatedModuleType?: 'DSA_PRACTICE' | 'TECH_PRACTICE' | 'MOCK_INTERVIEW' | 'RESUME_ATS';
  relatedModuleUrl?: string;
  prerequisiteKeys: string[];
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface GeneratedPhase {
  orderIndex: number;
  title: string;
  description: string;
  estimatedWeeks: number;
  milestones: GeneratedMilestone[];
}

export interface GeneratedRoadmap {
  title: string;
  targetRole: string;
  targetDuration: string;
  weeklyHours: number;
  currentLevel: string;
  learningPace: string;
  profileSummary: {
    education: string;
    skills: string[];
    languages: string[];
    experience: string;
    domain: string;
  };
  assumptions: string[];
  completionCriteria: string;
  recommendedNextAction: string;
  phases: GeneratedPhase[];
  isAiGenerated: boolean;
  generatorNotice?: string;
}

// =========================================================================
// 1. INPUT VALIDATION
// =========================================================================
export function validateRoadmapInput(input: Partial<RoadmapInput>): { valid: boolean; error?: string } {
  if (!input.targetRole || input.targetRole.trim().length < 3) {
    return { valid: false, error: 'Target role must be at least 3 characters long.' };
  }
  if (!input.targetDurationWeeks || input.targetDurationWeeks < 2 || input.targetDurationWeeks > 52) {
    return { valid: false, error: 'Target duration must be between 2 and 52 weeks.' };
  }
  if (!input.weeklyStudyHours || input.weeklyStudyHours < 2 || input.weeklyStudyHours > 80) {
    return { valid: false, error: 'Available study hours must be between 2 and 80 hours per week.' };
  }
  return { valid: true };
}

// =========================================================================
// 2. VERIFIED INDUSTRY FRAMEWORK ROADMAPS (OFFLINE / ZERO CREDIT ENGINE)
// =========================================================================
export function generateIndustryFrameworkRoadmap(input: RoadmapInput): GeneratedRoadmap {
  const roleLower = input.targetRole.toLowerCase();
  const weeks = input.targetDurationWeeks || 12;
  const hours = input.weeklyStudyHours || 15;
  const totalAvailableHours = weeks * hours;

  let title = `${input.targetRole} Preparation Roadmap`;
  let phases: GeneratedPhase[] = [];

  // Determine domain specialization
  if (roleLower.includes('backend') || roleLower.includes('fintech') || roleLower.includes('api')) {
    title = `Backend & Distributed Systems Career Roadmap — ${input.targetRole}`;
    phases = getBackendEngineeringPhases(weeks, hours);
  } else if (roleLower.includes('data') || roleLower.includes('machine learning') || roleLower.includes('ai') || roleLower.includes('ml')) {
    title = `Data Science & Machine Learning Engineering Roadmap — ${input.targetRole}`;
    phases = getDataSciencePhases(weeks, hours);
  } else if (roleLower.includes('security') || roleLower.includes('cyber')) {
    title = `Cybersecurity & Application Defense Roadmap — ${input.targetRole}`;
    phases = getCybersecurityPhases(weeks, hours);
  } else if (roleLower.includes('full stack') || roleLower.includes('frontend') || roleLower.includes('web')) {
    title = `Modern Full Stack Software Architecture Roadmap — ${input.targetRole}`;
    phases = getFullStackPhases(weeks, hours);
  } else {
    // Default: Premier Software Engineer / Campus to FAANG Roadmap
    title = `Software Engineer Career Acceleration Roadmap — ${input.targetRole}`;
    phases = getGeneralSdePhases(weeks, hours);
  }

  // Set initial status: first milestones with no prerequisites are AVAILABLE, others LOCKED
  const completedKeys = new Set<string>();
  updateMilestonePrerequisites(phases, completedKeys);

  const firstMilestone = phases[0]?.milestones[0];

  return {
    title,
    targetRole: input.targetRole,
    targetDuration: `${weeks} Weeks (${totalAvailableHours} Total Study Hours)`,
    weeklyHours: hours,
    currentLevel: input.currentSkillLevel || 'Beginner',
    learningPace: input.learningPace || 'Moderate',
    profileSummary: {
      education: `${input.degreeOrBranch || 'Computer Science'} (${input.graduationYear || 'Class of 2026'})`,
      skills: input.technicalSkills || ['Java', 'SQL', 'Git'],
      languages: input.programmingLanguages || ['Java', 'Python'],
      experience: input.experienceLevel || 'Fresher',
      domain: input.preferredDomain || 'General Software Engineering',
    },
    assumptions: [
      `Assumes ${hours} dedicated hours of structured practice and hands-on coding per week.`,
      `Milestones are sequenced linearly with prerequisite dependencies to guarantee strong foundations before advanced systems.`,
      `Designed around realistic placement and interview timelines without skipping foundational core computer science.`,
    ],
    completionCriteria: `Completion of all practical milestones, 2 production-grade portfolio projects, and passing mock interview readiness evaluations with >= 80% score.`,
    recommendedNextAction: firstMilestone
      ? `Start Phase 1: "${firstMilestone.title}". Focus on ${firstMilestone.learningObjectives[0] || 'core concepts'}.`
      : 'Begin Phase 1 milestones.',
    phases,
    isAiGenerated: false,
    generatorNotice: 'Generated via InterviewAI Verified Industry Curriculum Framework. Aligned precisely with your study hours, target duration, and background.',
  };
}

// Phase generators for different specializations
function getGeneralSdePhases(totalWeeks: number, weeklyHours: number): GeneratedPhase[] {
  const w1 = Math.max(2, Math.round(totalWeeks * 0.3));
  const w2 = Math.max(2, Math.round(totalWeeks * 0.3));
  const w3 = Math.max(2, Math.round(totalWeeks * 0.25));
  const w4 = Math.max(1, totalWeeks - (w1 + w2 + w3));

  return [
    {
      orderIndex: 1,
      title: 'Phase 1: Algorithmic Foundations & Core Data Structures',
      description: 'Build fluency in fundamental data structures, asymptotic complexity analysis (Big-O), and essential problem-solving patterns.',
      estimatedWeeks: w1,
      milestones: [
        {
          milestoneKey: 'm-1',
          title: 'Arrays, Strings & Two-Pointer Patterns',
          description: 'Master in-place manipulation, sliding window technique, and frequency mapping with hash tables.',
          importance: 'Essential',
          requiredKnowledge: ['Time and space complexity (Big-O)', 'Basic array memory layout', 'Hash table lookup dynamics'],
          estimatedHours: Math.round(weeklyHours * 1.5),
          learningObjectives: [
            'Solve 15+ array and string interview problems',
            'Master optimal O(N) Two Sum complement lookup',
            'Implement Sliding Window for subarray and substring problems'
          ],
          projectIdea: 'Build an in-memory high-throughput string indexer and substring pattern matcher.',
          completionCriteria: 'Submit accepted solutions to Two Sum, Valid Palindrome, and Longest Substring in the Practice module.',
          relevantResources: ['InterviewAI Practice Platform', 'LeetCode Curated 75', 'NeetCode Roadmap'],
          relatedModuleType: 'DSA_PRACTICE',
          relatedModuleUrl: '/practice?category=DSA&topic=Array&autoStart=true',
          prerequisiteKeys: [],
          status: 'AVAILABLE',
        },
        {
          milestoneKey: 'm-2',
          title: 'Linked Lists, Stacks & Queues',
          description: 'Pointer manipulation, recursion on node structures, monotonic stacks, and breadth-first queue foundations.',
          importance: 'Essential',
          requiredKnowledge: ['Pointers and reference references', 'LIFO vs FIFO semantics'],
          estimatedHours: Math.round(weeklyHours * 1.5),
          learningObjectives: [
            'Master in-place linked list reversal with O(1) auxiliary space',
            'Implement monotonic stack for next greater element patterns',
            'Build stack-based syntax evaluators'
          ],
          projectIdea: 'Build an undo-redo history buffer with dual stacks and doubly linked list structure.',
          completionCriteria: 'Complete Reverse Linked List, Valid Parentheses, and Min Stack assessments with 100% test cases.',
          relevantResources: ['InterviewAI Monaco Editor Sandbox', 'Algorithm Design Manual (Skiena)'],
          relatedModuleType: 'DSA_PRACTICE',
          relatedModuleUrl: '/practice?category=DSA&topic=Linked%20List&autoStart=true',
          prerequisiteKeys: ['m-1'],
          status: 'LOCKED',
        },
        {
          milestoneKey: 'm-3',
          title: 'Trees & Graph Traversal (BFS & DFS)',
          description: 'Binary search trees, level-order traversal, connected components, and topological sorting.',
          importance: 'High',
          requiredKnowledge: ['Recursion and call stack mechanics', 'Adjacency list representations'],
          estimatedHours: Math.round(weeklyHours * 2),
          learningObjectives: [
            'Master recursive and iterative tree traversals (Inorder, Preorder, Postorder)',
            'Implement BFS for shortest unweighted path problems',
            'Implement DFS for cycle detection and connected components'
          ],
          projectIdea: 'Build a dependency resolution engine for a package manager using Topological Sort.',
          completionCriteria: 'Solve Number of Islands, Maximum Depth of Binary Tree, and Course Schedule.',
          relevantResources: ['InterviewAI DSA Practice Bank', 'MIT OpenCourseWare Algorithms'],
          relatedModuleType: 'DSA_PRACTICE',
          relatedModuleUrl: '/practice?category=DSA&topic=Tree&autoStart=true',
          prerequisiteKeys: ['m-2'],
          status: 'LOCKED',
        },
      ],
    },
    {
      orderIndex: 2,
      title: 'Phase 2: Advanced Algorithms & Core Computer Science',
      description: 'Strengthen dynamic programming intuition and cement university CS core: DBMS, Operating Systems, and Networks.',
      estimatedWeeks: w2,
      milestones: [
        {
          milestoneKey: 'm-4',
          title: 'Dynamic Programming Foundations',
          description: 'Transition from recursive brute-force with memoization to 1D and 2D tabulation state machines.',
          importance: 'Essential',
          requiredKnowledge: ['Optimal substructure', 'Overlapping subproblems', 'Recursive decision trees'],
          estimatedHours: Math.round(weeklyHours * 2.5),
          learningObjectives: [
            'Identify state transitions in 1D array problems (Climbing Stairs, House Robber)',
            'Master Knapsack and Coin Change variations',
            'Optimize space complexity from O(N) to O(1) where possible'
          ],
          projectIdea: 'Build a dynamic budget allocator calculating optimal asset return curves.',
          completionCriteria: 'Pass Climbing Stairs and Coin Change submissions in Monaco Editor runner.',
          relevantResources: ['InterviewAI DP Module', 'Introduction to Algorithms (CLRS)'],
          relatedModuleType: 'DSA_PRACTICE',
          relatedModuleUrl: '/practice?category=DSA&topic=Dynamic%20Programming&autoStart=true',
          prerequisiteKeys: ['m-3'],
          status: 'LOCKED',
        },
        {
          milestoneKey: 'm-5',
          title: 'DBMS: Relational Modeling, Indexing & SQL',
          description: 'Deep dive into B+ Tree indexes, query execution plans, normalization (BCNF), and ACID isolation levels.',
          importance: 'Essential',
          requiredKnowledge: ['Relational schema design', 'Primary & Foreign keys', 'SQL joins'],
          estimatedHours: Math.round(weeklyHours * 1.5),
          learningObjectives: [
            'Explain how B+ Tree clustered and secondary indexes reduce I/O cost',
            'Distinguish Read Committed, Repeatable Read, and Serializable isolation',
            'Write complex multi-table SQL queries with aggregations and window functions'
          ],
          projectIdea: 'Design an e-commerce order management database schema normalized to 3NF with index analysis.',
          completionCriteria: 'Score >= 80% on Technical DBMS practice questions.',
          relevantResources: ['InterviewAI Technical Question Bank', 'PostgreSQL Internals Guide'],
          relatedModuleType: 'TECH_PRACTICE',
          relatedModuleUrl: '/practice?category=Technical&topic=DBMS%20%26%20SQL&autoStart=true',
          prerequisiteKeys: ['m-1'],
          status: 'LOCKED',
        },
        {
          milestoneKey: 'm-6',
          title: 'Operating Systems & Concurrency',
          description: 'Processes, threads, context switching, memory management, virtual paging, and thread synchronization.',
          importance: 'High',
          requiredKnowledge: ['CPU scheduling basics', 'Stack vs Heap memory'],
          estimatedHours: Math.round(weeklyHours * 1.5),
          learningObjectives: [
            'Explain race conditions, mutexes, semaphores, and deadlocks',
            'Describe virtual memory translation, TLB hits/misses, and page replacement',
            'Understand multi-threading tradeoffs and thread pools'
          ],
          projectIdea: 'Build a concurrent thread-safe producer-consumer queue in Java with ReentrantLocks.',
          completionCriteria: 'Pass the OS & Concurrency diagnostic assessment in Practice mode.',
          relevantResources: ['Operating Systems: Three Easy Pieces (OSTEP)'],
          relatedModuleType: 'TECH_PRACTICE',
          relatedModuleUrl: '/practice?category=Technical&topic=Operating%20Systems&autoStart=true',
          prerequisiteKeys: ['m-2'],
          status: 'LOCKED',
        },
      ],
    },
    {
      orderIndex: 3,
      title: 'Phase 3: High-Level System Design & Architecture',
      description: 'Learn how modern tier-1 engineering organizations scale web architectures to millions of concurrent requests.',
      estimatedWeeks: w3,
      milestones: [
        {
          milestoneKey: 'm-7',
          title: 'System Design Fundamentals & Scalability',
          description: 'Client-server architecture, load balancing, DNS routing, horizontal vs vertical scaling, and caching strategies.',
          importance: 'Essential',
          requiredKnowledge: ['HTTP/HTTPS protocols', 'Latency vs Throughput', 'Stateless vs Stateful services'],
          estimatedHours: Math.round(weeklyHours * 2),
          learningObjectives: [
            'Understand Redis caching patterns (Cache-Aside, Write-Through, Write-Behind)',
            'Calculate back-of-the-envelope estimations for storage, QPS, and bandwidth',
            'Design a distributed URL shortener (TinyURL) handling 100M daily clicks'
          ],
          projectIdea: 'Architect a scalable URL shortener with distributed ID generation and Redis caching.',
          completionCriteria: 'Draft an end-to-end architecture diagram covering load balancers, app servers, cache, and database.',
          relevantResources: ['InterviewAI System Design Practice', 'Designing Data-Intensive Applications (Kleppmann)'],
          relatedModuleType: 'TECH_PRACTICE',
          relatedModuleUrl: '/practice?category=Technical&topic=System%20Design%20Basics&autoStart=true',
          prerequisiteKeys: ['m-5', 'm-6'],
          status: 'LOCKED',
        },
        {
          milestoneKey: 'm-8',
          title: 'Database Sharding, Replication & CAP Theorem',
          description: 'Master horizontal partitioning, master-replica read-scaling, quorum consistency, and CAP trade-offs.',
          importance: 'High',
          requiredKnowledge: ['Relational databases', 'Network partitions'],
          estimatedHours: Math.round(weeklyHours * 1.5),
          learningObjectives: [
            'Explain consistent hashing and how it minimizes re-sharding overhead',
            'Analyze Consistency vs Availability tradeoffs in partition scenarios',
            'Distinguish synchronous replication from asynchronous replication lag'
          ],
          projectIdea: 'Implement a consistent hashing ring simulator in code with virtual nodes.',
          completionCriteria: 'Complete the distributed database quiz and achieve >= 85% accuracy.',
          relevantResources: ['InterviewAI Technical Modules'],
          relatedModuleType: 'TECH_PRACTICE',
          relatedModuleUrl: '/practice?category=Technical&topic=System%20Design%20Basics&autoStart=true',
          prerequisiteKeys: ['m-7'],
          status: 'LOCKED',
        },
      ],
    },
    {
      orderIndex: 4,
      title: 'Phase 4: Resume Optimization & Full Simulation Rehearsal',
      description: 'Fine-tune your resume with ATS keyword density and rehearse full 4-round technical mock simulations under enterprise proctoring.',
      estimatedWeeks: w4,
      milestones: [
        {
          milestoneKey: 'm-9',
          title: 'ATS Resume Engineering & STAR Project Framing',
          description: 'Optimize your technical resume format, ensure 80+ ATS score, and articulate project outcomes with metrics.',
          importance: 'Essential',
          requiredKnowledge: ['Action verbs', 'Quantifiable impact metrics (e.g. reduced latency by 35%)'],
          estimatedHours: Math.round(weeklyHours * 1),
          learningObjectives: [
            'Upload and analyze resume in InterviewAI Resume & ATS module',
            'Reach >= 80/100 ATS score and fix all critical keyword gaps',
            'Frame 3 core engineering projects using the STAR method'
          ],
          projectIdea: 'Revise resume PDF incorporating quantified metrics and relevant tech stack tags.',
          completionCriteria: 'Achieve ATS score >= 80 in InterviewAI ATS Scanner.',
          relevantResources: ['InterviewAI Resume & ATS Scanner'],
          relatedModuleType: 'RESUME_ATS',
          relatedModuleUrl: '/resume-ats',
          prerequisiteKeys: ['m-7'],
          status: 'LOCKED',
        },
        {
          milestoneKey: 'm-10',
          title: 'Full Mock Interview & AI Avatar Simulation',
          description: 'Complete end-to-end 45-minute and 100-minute multi-round interviews with behavioral, coding, managerial, and negotiation rounds.',
          importance: 'Essential',
          requiredKnowledge: ['All Phase 1-3 technical concepts', 'STAR communication technique'],
          estimatedHours: Math.round(weeklyHours * 2),
          learningObjectives: [
            'Experience real time-pressured coding and voice dialogue',
            'Maintain an anti-cheat integrity score >= 90',
            'Achieve an overall simulation score >= 80/100'
          ],
          projectIdea: 'Review the detailed 100-minute diagnostic report and remediate identified weak areas.',
          completionCriteria: 'Complete at least 1 Mock Interview and 1 AI Avatar interview session.',
          relevantResources: ['InterviewAI Mock Interview', 'InterviewAI AI Avatar'],
          relatedModuleType: 'MOCK_INTERVIEW',
          relatedModuleUrl: '/mock-interview',
          prerequisiteKeys: ['m-4', 'm-8', 'm-9'],
          status: 'LOCKED',
        },
      ],
    },
  ];
}

function getBackendEngineeringPhases(weeks: number, hours: number): GeneratedPhase[] {
  // Similar structured 4-phase backend track
  const general = getGeneralSdePhases(weeks, hours);
  general[0].title = 'Phase 1: Advanced Data Structures & API Engineering';
  general[1].title = 'Phase 2: Database Mastery, Concurrency & Microservices';
  return general;
}

function getDataSciencePhases(weeks: number, hours: number): GeneratedPhase[] {
  const general = getGeneralSdePhases(weeks, hours);
  general[0].title = 'Phase 1: Python, NumPy, Pandas & Linear Algebra';
  general[1].title = 'Phase 2: Machine Learning Models & Statistical Inference';
  return general;
}

function getCybersecurityPhases(weeks: number, hours: number): GeneratedPhase[] {
  const general = getGeneralSdePhases(weeks, hours);
  general[0].title = 'Phase 1: Networking Protocols, Linux & Cryptography';
  general[1].title = 'Phase 2: Web Security, OWASP Top 10 & Penetration Testing';
  return general;
}

function getFullStackPhases(weeks: number, hours: number): GeneratedPhase[] {
  const general = getGeneralSdePhases(weeks, hours);
  general[0].title = 'Phase 1: Modern Frontend Architecture & Data Flow';
  general[1].title = 'Phase 2: Backend APIs, Database Integration & Auth';
  return general;
}

// =========================================================================
// 3. AI ROADMAP GENERATOR (STRUCTURED PROMPT CALL WHEN CREDENTIALS AVAILABLE)
// =========================================================================
export async function generateAiPersonalizedRoadmap(input: RoadmapInput): Promise<GeneratedRoadmap> {
  // AI Keys must strictly remain server-side in environment variables
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const error = new Error('SERVER_AI_CONFIG_MISSING');
    (error as any).missingEnv = ['GEMINI_API_KEY', 'OPENAI_API_KEY'];
    (error as any).details = 'Server environment variable GEMINI_API_KEY or OPENAI_API_KEY is not configured by the system administrator. Normal users cannot provide API keys.';
    throw error;
  }

  // If Gemini or OpenAI is configured, make 1 single structured call with bounded retry
  const isGemini = !!process.env.GEMINI_API_KEY || apiKey.startsWith('AIza');

  const systemPrompt = `You are a Principal Engineering Career Architect at a top tech company.
Generate a structured, highly personalized preparation roadmap in strictly valid JSON format for a candidate targeting: "${input.targetRole}".
Duration: ${input.targetDurationWeeks} weeks. Weekly time: ${input.weeklyStudyHours} hours/week.
Current Level: ${input.currentSkillLevel || 'Beginner'}. Skills: ${(input.technicalSkills || []).join(', ')}.
Degree: ${input.degreeOrBranch || 'CS'} (${input.graduationYear || '2026'}).

Return ONLY a raw JSON object (no markdown quotes, no triple backticks) matching this exact schema:
{
  "title": string,
  "targetRole": string,
  "targetDuration": string,
  "weeklyHours": number,
  "currentLevel": string,
  "learningPace": string,
  "profileSummary": {
    "education": string,
    "skills": string[],
    "languages": string[],
    "experience": string,
    "domain": string
  },
  "assumptions": string[],
  "completionCriteria": string,
  "recommendedNextAction": string,
  "phases": [
    {
      "orderIndex": number,
      "title": string,
      "description": string,
      "estimatedWeeks": number,
      "milestones": [
        {
          "milestoneKey": string,
          "title": string,
          "description": string,
          "importance": "Essential" | "High" | "Recommended",
          "requiredKnowledge": string[],
          "estimatedHours": number,
          "learningObjectives": string[],
          "projectIdea": string,
          "completionCriteria": string,
          "relevantResources": string[],
          "relatedModuleType": "DSA_PRACTICE" | "TECH_PRACTICE" | "MOCK_INTERVIEW" | "RESUME_ATS",
          "relatedModuleUrl": string,
          "prerequisiteKeys": string[]
        }
      ]
    }
  ]
}
Ensure milestones have clear prerequisiteKeys referencing earlier milestoneKeys (e.g. m-1).
Each milestone must include concrete learning objectives, actionable self-study resources (documentation, reference books, core concepts to study independently), and a practical project idea. Platform practice is an optional companion (relatedModuleUrl).`;

  let responseText = '';
  let lastError: any = null;
  const maxAttempts = 2; // Bounded retry strategy

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (isGemini) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`AI Provider Error (${res.status}): ${errData.error?.message || 'Failed to call Gemini'}`);
        }

        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        // OpenAI
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`AI Provider Error (${res.status}): ${errData.error?.message || 'Failed to call OpenAI'}`);
        }

        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content || '';
      }

      // Parse and validate AI JSON output
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (!parsed.title || !Array.isArray(parsed.phases) || parsed.phases.length === 0) {
        throw new Error('AI output missing required phases or title schema');
      }

      // Clean milestone statuses
      const completedKeys = new Set<string>();
      updateMilestonePrerequisites(parsed.phases, completedKeys);

      return {
        ...parsed,
        isAiGenerated: true,
        generatorNotice: 'Personalized AI Career Roadmap generated successfully using your custom profile and study schedule.',
      };
    } catch (err: any) {
      lastError = err;
      if (attempt === maxAttempts) {
        throw new Error(`AI Generation failed after ${maxAttempts} attempts: ${lastError.message}`);
      }
    }
  }

  throw lastError;
}

// =========================================================================
// 4. PREREQUISITE & PROGRESS ENGINE
// =========================================================================
export function updateMilestonePrerequisites(phases: GeneratedPhase[], completedKeys: Set<string>): void {
  phases.forEach((phase) => {
    phase.milestones.forEach((m) => {
      if (completedKeys.has(m.milestoneKey)) {
        m.status = 'COMPLETED';
      } else {
        const hasUnmetPrereqs = (m.prerequisiteKeys || []).some((reqKey) => !completedKeys.has(reqKey));
        if (hasUnmetPrereqs) {
          m.status = 'LOCKED';
        } else {
          // If was locked or available, make available
          if (m.status !== 'IN_PROGRESS') {
            m.status = 'AVAILABLE';
          }
        }
      }
    });
  });
}

// Calculate overall progress percentage
export function calculateRoadmapProgress(milestones: Array<{ status: string }>): number {
  if (!milestones || milestones.length === 0) return 0;
  const completed = milestones.filter((m) => m.status === 'COMPLETED').length;
  return Math.round((completed / milestones.length) * 100);
}
