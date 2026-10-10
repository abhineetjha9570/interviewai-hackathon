export interface AtsAnalysisResult {
  atsScore: number;
  formatScore: number;
  keywordScore: number;
  skillsScore: number;
  experienceScore: number;
  achievementsScore: number;
  parsingSuccess: number;
  foundKeywords: string[];
  missingKeywords: string[];
  relevantKeywordsCount: number;
  suggestions: string[];
  strengths: string[];
  areasToImprove: string[];
  optimizedResumeText: string;
}

const COMMON_TECH_KEYWORDS = [
  'Java', 'Python', 'C++', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'REST API', 'GraphQL', 'Microservices', 'System Design',
  'DSA', 'Data Structures', 'Algorithms', 'OOP', 'Object Oriented Programming',
  'DBMS', 'Operating Systems', 'Computer Networks', 'Git', 'GitHub', 'CI/CD',
  'Problem Solving', 'Team Collaboration', 'Agile', 'Scrum', 'Unit Testing',
  'Spring Boot', 'Next.js', 'Tailwind CSS', 'Kafka', 'Leadership'
];

export function analyzeResumeText(rawText: string, jobDescriptionText?: string): AtsAnalysisResult {
  const textUpper = rawText.toUpperCase();
  const jdUpper = (jobDescriptionText || '').toUpperCase();

  const found: string[] = [];
  const missing: string[] = [];

  COMMON_TECH_KEYWORDS.forEach(kw => {
    const isPresentInResume = textUpper.includes(kw.toUpperCase());
    const isPresentInJd = jdUpper ? jdUpper.includes(kw.toUpperCase()) : true;

    if (isPresentInResume) {
      found.push(kw);
    } else if (isPresentInJd) {
      missing.push(kw);
    }
  });

  // Calculate scores based on presence
  const foundRatio = found.length / (found.length + missing.length || 1);
  const keywordScore = Math.min(95, Math.max(50, Math.round(foundRatio * 100)));

  // Format check
  let formatScore = 85;
  if (textUpper.includes('EDUCATION') && textUpper.includes('SKILLS') && textUpper.includes('PROJECTS')) {
    formatScore = 90;
  }
  if (textUpper.includes('@') && (textUpper.includes('PHONE') || textUpper.includes('+91') || textUpper.includes('LINKEDIN'))) {
    formatScore = Math.min(95, formatScore + 5);
  }

  // Skills Score
  const skillsScore = Math.min(95, Math.max(60, Math.round((found.length / 15) * 80)));

  // Experience & Projects Score
  const hasProjects = textUpper.includes('PROJECT');
  const hasExperience = textUpper.includes('EXPERIENCE') || textUpper.includes('INTERN');
  const experienceScore = hasExperience ? 85 : hasProjects ? 75 : 60;

  // Quantifiable Achievements Score (check for % or numbers)
  const numbersCount = (rawText.match(/\d+%/g) || []).length + (rawText.match(/\d+\+/g) || []).length;
  const achievementsScore = numbersCount >= 3 ? 85 : numbersCount >= 1 ? 70 : 60;

  // Composite ATS Score
  const atsScore = Math.round(
    (formatScore * 0.2) +
    (keywordScore * 0.3) +
    (skillsScore * 0.25) +
    (experienceScore * 0.15) +
    (achievementsScore * 0.1)
  );

  const suggestions = [
    'Add quantifiable metrics (e.g. "improved query latency by 35%", "handled 10k daily requests").',
    'Include missing high-value keywords like System Design, Database Management, and Cloud (AWS/Azure).',
    'Structure your experience and project bullets using Action Verb + Task + Quantifiable Result.',
    'Ensure all contact links (LinkedIn, GitHub, Portfolio) are clean and clickable.',
    'Keep your formatting consistent and ATS friendly (standard headers, clean bullet points).'
  ];

  const strengths = [
    'Clean education section with prominent degree and coursework.',
    'Good core programming language foundation (Java, Python, SQL).',
    'Clearly partitioned project entries with tech stack indicators.'
  ];

  const areasToImprove = [
    'Add more quantifiable achievements with percentage and scale indicators.',
    'Include missing keywords tailored to your target Software Engineer role.',
    'Improve format and action verb strength at the beginning of bullet points.'
  ];

  const optimizedResumeText = `ABHINEET JHA
Noida, India | +91 9876543210 | abhineet@interviewai.com
LinkedIn: linkedin.com/in/abhineet | GitHub: github.com/abhineet | Portfolio: abhineet.dev

PROFESSIONAL SUMMARY
Aspiring Software Engineer with high proficiency in Java, Data Structures & Algorithms, and Distributed Systems. Solved 350+ algorithmic challenges and developed high-performance web applications using modern full-stack architectures.

EDUCATION
B.Tech in Computer Science Engineering (Data Science)
NIET, Greater Noida | 2024 - 2028 | CGPA: 7.48 / 10.0

TECHNICAL SKILLS
• Programming Languages: Java (Core & Advanced), Python, C++, JavaScript (ES6+), SQL
• Web & Frameworks: React.js, Next.js, Node.js, Spring Boot, RESTful APIs, Tailwind CSS
• Databases & Cloud: MySQL, PostgreSQL, Redis, AWS (S3, EC2), Docker
• Core CS Fundamentals: Data Structures & Algorithms, Object-Oriented Programming (OOP), Database Management Systems (DBMS), Operating Systems, System Design

KEY PROJECTS
Placement Prep & Algorithmic Interview Engine | Java, Spring Boot, React, Docker
• Designed and implemented an automated coding evaluation engine executing user test cases in isolated sandboxes within sub-second latencies.
• Optimized MySQL query indexing and integrated Redis caching, reducing problem retrieval response times by 42%.
• Built real-time WebSocket communication and anti-cheat event tracking for proctored sessions.

Distributed University Management System | Python, OOP, MySQL
• Developed an enterprise desktop and backend administrative suite managing 2,500+ student and faculty records.
• Applied OOP design patterns (Factory, Singleton, MVC), ensuring modular maintainability and 99.8% crash-free uptime.

CERTIFICATIONS & ACHIEVEMENTS
• Solved 350+ algorithmic problems across LeetCode & HackerRank (Top 15% percentile).
• AWS Certified Cloud Practitioner / HackerRank Certified Java Developer.`;

  return {
    atsScore,
    formatScore,
    keywordScore,
    skillsScore,
    experienceScore,
    achievementsScore,
    parsingSuccess: 100,
    foundKeywords: found.slice(0, 20),
    missingKeywords: missing.slice(0, 10),
    relevantKeywordsCount: found.length + missing.length,
    suggestions,
    strengths,
    areasToImprove,
    optimizedResumeText,
  };
}
