const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  // Delete in order to respect relations
  await prisma.proctoringEvent.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.avatarMessage.deleteMany({});
  await prisma.avatarInterview.deleteMany({});
  await prisma.mockRound.deleteMany({});
  await prisma.mockInterview.deleteMany({});
  await prisma.codingSubmission.deleteMany({});
  await prisma.codingProblem.deleteMany({});
  await prisma.practiceAnswer.deleteMany({});
  await prisma.practiceSession.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.resume.deleteMany({});
  await prisma.jobDescription.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding demo user...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const demoUser = await prisma.user.create({
    data: {
      email: 'abhineet@interviewai.com',
      passwordHash: passwordHash,
      name: 'Abhineet',
      role: 'Fresher · Software Engineer',
      profile: {
        create: {
          onboardingCompleted: true,
          goal: 'Campus Placement',
          experience: 'Fresher',
          targetRole: 'Software Engineer',
          skills: JSON.stringify(['Java', 'Python', 'DSA', 'SQL', 'React', 'Git', 'Spring Boot']),
          resumeUrl: '/resumes/Abhineet_Resume.pdf',
          resumeName: 'Abhineet_Resume.pdf',
          jobDescription: 'Software Engineer specializing in backend systems, algorithms, and cloud services.',
          bio: 'Passionate computer science graduate with strong foundations in DSA, Java backend, and full-stack development.',
          streakDays: 12,
          overallPrepPct: 72,
          aptitudeScore: 78,
          dsaScore: 65,
          technicalScore: 70,
          hrScore: 80,
        },
      },
      subscription: {
        create: {
          plan: 'PRO',
          status: 'ACTIVE',
          practiceRemaining: 999,
          mockRemaining: 15,
          aiInterviewRemaining: 10,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log('Seeding resume...');
  await prisma.resume.create({
    data: {
      userId: demoUser.id,
      fileName: 'Abhineet_Resume.pdf',
      rawText: `Abhineet Jha\nabhineet@interviewai.com | +91 9876543210 | Noida, India\nLinkedIn: linkedin.com/in/abhineet | GitHub: github.com/abhineet\n\nEDUCATION\nB.Tech in Computer Science Engineering (Data Science) | NIET, Greater Noida (2024 - 2028) | CGPA: 7.48\n\nSKILLS\nLanguages: Java, Python, C++, JavaScript\nWeb: HTML, CSS, React, Node.js\nDatabase: SQL, MySQL\nCore: DSA, OOP, DBMS, Computer Networks\n\nPROJECTS\n1. University Management System (Python, Tkinter, OOP)\n- Developed desktop application for student, faculty, and administration management.\n- Implemented CRUD operations with database integration.\n2. Netflix Clone (HTML, CSS, JavaScript)\n- Responsive streaming platform replica featuring modern UI and video previews.\n3. Placement Prep Portal (Java, Spring Boot)\n- Interactive mock testing engine with algorithmic challenges and timer.`,
      atsScore: 78,
      formatScore: 85,
      keywordScore: 70,
      skillsScore: 80,
      experienceScore: 75,
      achievementsScore: 60,
      parsedSkills: JSON.stringify(['Java', 'Python', 'C++', 'JavaScript', 'HTML', 'CSS', 'SQL', 'DSA', 'OOP', 'DBMS']),
      missingKeywords: JSON.stringify(['System Design', 'Database Management', 'Problem Solving', 'Team Collaboration', 'Leadership', 'Cloud (AWS / Azure)']),
      suggestions: JSON.stringify([
        'Add relevant system design experience or architectural details in project descriptions.',
        'Mention specific database technologies and indexing (e.g., MySQL, PostgreSQL, Redis).',
        'Highlight problem-solving metrics (e.g., solved 300+ LeetCode problems).',
        'Add teamwork and cross-functional collaboration experience.',
        'Include leadership roles (e.g., tech lead, event coordinator).',
        'Include cloud technologies if you have hands-on experience (AWS, Azure, Docker).'
      ]),
    },
  });

  console.log('Seeding coding problems...');
  const codingProblemsData = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'Easy',
      category: 'DSA',
      tags: JSON.stringify(['Array', 'Hash Map']),
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      examples: JSON.stringify([
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
        },
        {
          input: 'nums = [3,2,4], target = 6',
          output: '[1,2]',
          explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
        },
        {
          input: 'nums = [3,3], target = 6',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
        }
      ]),
      constraints: JSON.stringify([
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists.'
      ]),
      hints: JSON.stringify([
        'A really brute force way would be to search for all possible pairs of numbers but that would be O(N^2).',
        'Can we use a HashMap to store complements (target - nums[i]) with their indices for O(N) lookup?'
      ]),
      explanation: 'We iterate through the array once while keeping a HashMap that maps elements to their indices. For each element `nums[i]`, we calculate `complement = target - nums[i]`. If the complement is already in the map, we return `[map.get(complement), i]`. Otherwise, we store `(nums[i], i)` in the map.',
      starterCodeJava: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        
        return new int[]{};
    }
}`,
      solutionJava: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
      testCases: JSON.stringify([
        { input: '[2,7,11,15]\n9', expected: '[0, 1]', hidden: false },
        { input: '[3,2,4]\n6', expected: '[1, 2]', hidden: false },
        { input: '[3,3]\n6', expected: '[0, 1]', hidden: false },
        { input: '[1,5,8,3,9]\n11', expected: '[2, 3]', hidden: true },
        { input: '[100,-50,20,-30]\n-10', expected: '[2, 3]', hidden: true }
      ])
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: 'Easy',
      category: 'DSA',
      tags: JSON.stringify(['String', 'Stack']),
      description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
      examples: JSON.stringify([
        { input: 's = "()"', output: 'true', explanation: 'Single matched pair.' },
        { input: 's = "()[]{}"', output: 'true', explanation: 'All pairs properly opened and closed.' },
        { input: 's = "(]"', output: 'false', explanation: 'Mismatched brackets.' }
      ]),
      constraints: JSON.stringify([
        '1 <= s.length <= 10^4',
        's consists of parentheses only: ()[]{}'
      ]),
      hints: JSON.stringify([
        'Use a Stack to keep track of opening brackets.',
        'Whenever a closing bracket is encountered, pop the stack and check if it matches.'
      ]),
      explanation: 'Push open brackets onto a stack. When a closing bracket is encountered, verify that the top of stack has the matching opener. At the end, the stack must be empty.',
      starterCodeJava: `import java.util.*;

class Solution {
    public boolean isValid(String s) {
        // Write your code here
        
        return false;
    }
}`,
      solutionJava: `import java.util.*;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return stack.isEmpty();
    }
}`,
      testCases: JSON.stringify([
        { input: '()', expected: 'true', hidden: false },
        { input: '()[]{}', expected: 'true', hidden: false },
        { input: '(]', expected: 'false', hidden: false },
        { input: '([{}])', expected: 'true', hidden: true },
        { input: '([)]', expected: 'false', hidden: true }
      ])
    },
    {
      title: 'Reverse Linked List',
      slug: 'reverse-linked-list',
      difficulty: 'Easy',
      category: 'DSA',
      tags: JSON.stringify(['Linked List', 'Recursion']),
      description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nInput is given as space-separated integers, and output is the reversed list as space-separated integers.',
      examples: JSON.stringify([
        { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'The list is reversed.' }
      ]),
      constraints: JSON.stringify([
        'The number of nodes in the list is the range [0, 5000].',
        '-5000 <= Node.val <= 5000'
      ]),
      hints: JSON.stringify([
        'Maintain three pointers: prev, current, and next.',
        'Iterate and invert the pointer direction for each node.'
      ]),
      explanation: 'By maintaining `prev = null` and advancing `curr`, we redirect each `curr.next = prev` until `curr` becomes null.',
      starterCodeJava: `import java.util.*;

class Solution {
    public List<Integer> reverseList(List<Integer> list) {
        // Write your code here
        List<Integer> res = new ArrayList<>();
        return res;
    }
}`,
      solutionJava: `import java.util.*;

class Solution {
    public List<Integer> reverseList(List<Integer> list) {
        List<Integer> res = new ArrayList<>(list);
        Collections.reverse(res);
        return res;
    }
}`,
      testCases: JSON.stringify([
        { input: '[1, 2, 3, 4, 5]', expected: '[5, 4, 3, 2, 1]', hidden: false },
        { input: '[1, 2]', expected: '[2, 1]', hidden: false },
        { input: '[]', expected: '[]', hidden: false }
      ])
    },
    {
      title: 'Climbing Stairs',
      slug: 'climbing-stairs',
      difficulty: 'Easy',
      category: 'DSA',
      tags: JSON.stringify(['Dynamic Programming', 'Math']),
      description: 'You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
      examples: JSON.stringify([
        { input: 'n = 2', output: '2', explanation: 'There are two ways: 1 step + 1 step, or 2 steps.' },
        { input: 'n = 3', output: '3', explanation: 'There are three ways: 1+1+1, 1+2, or 2+1.' }
      ]),
      constraints: JSON.stringify(['1 <= n <= 45']),
      hints: JSON.stringify(['To reach step n, you must arrive from step n-1 or n-2.', 'This is the Fibonacci sequence!']),
      explanation: 'ways(n) = ways(n-1) + ways(n-2). We can compute this iteratively using two state variables in O(N) time and O(1) space.',
      starterCodeJava: `class Solution {
    public int climbStairs(int n) {
        // Write your code here
        return 0;
    }
}`,
      solutionJava: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
}`,
      testCases: JSON.stringify([
        { input: '2', expected: '2', hidden: false },
        { input: '3', expected: '3', hidden: false },
        { input: '4', expected: '5', hidden: false },
        { input: '5', expected: '8', hidden: true }
      ])
    },
    {
      title: 'Number of Islands',
      slug: 'number-of-islands',
      difficulty: 'Medium',
      category: 'DSA',
      tags: JSON.stringify(['Graph', 'BFS', 'DFS']),
      description: 'Given an m x n 2D binary grid grid which represents a map of 1s (land) and 0s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
      examples: JSON.stringify([
        { input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]', output: '2', explanation: 'Two distinct islands separated by water.' }
      ]),
      constraints: JSON.stringify(['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300']),
      hints: JSON.stringify(['Use Depth First Search (DFS) or Breadth First Search (BFS) to visit and mark all connected land cells.']),
      explanation: 'Iterate through every cell. Whenever a 1 is encountered, increment the island counter and launch a DFS/BFS traversal to sink the island (mark all connected 1s as 0).',
      starterCodeJava: `class Solution {
    public int numIslands(char[][] grid) {
        // Write your code here
        return 0;
    }
}`,
      solutionJava: `class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int count = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == '1') {
                    count++;
                    dfs(grid, i, j);
                }
            }
        }
        return count;
    }
    private void dfs(char[][] grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r+1, c);
        dfs(grid, r-1, c);
        dfs(grid, r, c+1);
        dfs(grid, r, c-1);
    }
}`,
      testCases: JSON.stringify([
        { input: '[["1","1","0"],["1","1","0"],["0","0","1"]]', expected: '2', hidden: false }
      ])
    }
  ];

  for (const prob of codingProblemsData) {
    await prisma.codingProblem.create({ data: prob });
  }

  console.log('Seeding questions bank...');
  const questionsBank = [
    // APTITUDE
    {
      title: 'Train Speed and Length Calculation',
      category: 'APTITUDE',
      topic: 'Quantitative',
      difficulty: 'Medium',
      description: 'A train 125 m long passes a man, running at 5 km/hr in the same direction in which the train is going, in 10 seconds. What is the speed of the train in km/hr?',
      options: JSON.stringify(['45 km/hr', '50 km/hr', '54 km/hr', '55 km/hr']),
      correctAnswer: '50 km/hr',
      explanation: 'Speed of the train relative to man = (125 / 10) m/sec = 12.5 m/sec = 12.5 * (18/5) = 45 km/hr. Let the speed of the train be v. Then relative speed = v - 5 = 45 => v = 50 km/hr.',
      hints: JSON.stringify(['Calculate relative speed in m/s, convert to km/h, then add the man speed.']),
      companyTags: JSON.stringify(['TCS', 'Infosys', 'Cognizant']),
    },
    {
      title: 'Probability of Rolling Sum',
      category: 'APTITUDE',
      topic: 'Quantitative',
      difficulty: 'Easy',
      description: 'Two unbiased dice are thrown simultaneously. What is the probability of getting two numbers whose product is even?',
      options: JSON.stringify(['1/2', '3/4', '3/8', '5/16']),
      correctAnswer: '3/4',
      explanation: 'Total outcomes = 36. Product is odd only when both are odd (3 * 3 = 9 outcomes). Therefore product is even = 36 - 9 = 27 outcomes. Probability = 27 / 36 = 3/4.',
      hints: JSON.stringify(['Think of the complement: when is the product of two integers odd?']),
      companyTags: JSON.stringify(['Accenture', 'Wipro']),
    },
    {
      title: 'Logical Deduction - Syllogism',
      category: 'APTITUDE',
      topic: 'Logical Reasoning',
      difficulty: 'Medium',
      description: 'Statements: (1) All mangoes are golden in color. (2) No golden colored things are cheap. Conclusions: I. All mangoes are cheap. II. Golden-colored mangoes are not cheap.',
      options: JSON.stringify(['Only I follows', 'Only II follows', 'Either I or II follows', 'Neither follows']),
      correctAnswer: 'Only II follows',
      explanation: 'Since all mangoes are golden colored and no golden colored things are cheap, mangoes cannot be cheap. Hence II logically follows.',
      hints: JSON.stringify(['Draw a Venn diagram of Mangoes inside Golden inside Not-Cheap.']),
      companyTags: JSON.stringify(['Amazon', 'Capgemini']),
    },

    // TECHNICAL / CORE CS
    {
      title: 'DBMS Normalization and Dependency',
      category: 'TECHNICAL',
      topic: 'DBMS',
      difficulty: 'Medium',
      description: 'A relation R with attributes (A, B, C, D) has functional dependencies A -> B, B -> C, C -> D. What is the highest normal form of R?',
      options: JSON.stringify(['1NF', '2NF', '3NF', 'BCNF']),
      correctAnswer: '2NF',
      explanation: 'The candidate key is A. Transitive dependencies exist (A -> B -> C -> D), so non-prime attributes depend transitively on the primary key. Hence it satisfies 2NF but violates 3NF.',
      hints: JSON.stringify(['Check if transitive dependencies exist from candidate key to non-prime attributes.']),
      companyTags: JSON.stringify(['Google', 'Microsoft', 'Oracle']),
    },
    {
      title: 'OS Virtual Memory & Page Faults',
      category: 'TECHNICAL',
      topic: 'Operating Systems',
      difficulty: 'Medium',
      description: 'What condition triggers a Page Fault in an operating system?',
      options: JSON.stringify([
        'When a page in cache is corrupted',
        'When the requested virtual page is not currently mapped into physical memory RAM',
        'When CPU executes an invalid opcode',
        'When stack memory exceeds heap memory limits'
      ]),
      correctAnswer: 'When the requested virtual page is not currently mapped into physical memory RAM',
      explanation: 'A page fault is an interrupt raised by hardware when a program accesses a memory page that is mapped in the virtual address space, but not loaded in physical RAM.',
      hints: JSON.stringify(['Think about the role of the MMU and valid/invalid bits in the page table.']),
      companyTags: JSON.stringify(['Microsoft', 'Qualcomm', 'Intel']),
    },
    {
      title: 'Computer Networks TCP vs UDP Handshake',
      category: 'TECHNICAL',
      topic: 'Computer Networks',
      difficulty: 'Easy',
      description: 'Which of the following packets are exchanged during a standard TCP 3-way handshake?',
      options: JSON.stringify([
        'SYN, SYN-ACK, ACK',
        'ACK, SYN, FIN',
        'SYN, PUSH, ACK',
        'REQ, RES, EST'
      ]),
      correctAnswer: 'SYN, SYN-ACK, ACK',
      explanation: 'TCP connection establishment uses a 3-way handshake: Client sends SYN, Server replies with SYN-ACK, and Client sends ACK to establish the socket connection.',
      hints: JSON.stringify(['Synchronize and Acknowledge flags.']),
      companyTags: JSON.stringify(['Cisco', 'Amazon', 'Akamai']),
    },

    // HR / BEHAVIORAL
    {
      title: 'Professional Self Introduction',
      category: 'HR',
      topic: 'Introduction',
      difficulty: 'Easy',
      description: 'Tell me about yourself, your educational background, and why you are interested in a software engineering career.',
      options: JSON.stringify([
        'Give a structured summary: current education/role, key technical projects, passion for building software, and alignment with the company.',
        'Recite your entire high school and family history.',
        'Only state your college name and GPA without discussing projects or skills.',
        'Discuss non-technical personal hobbies only.'
      ]),
      correctAnswer: 'Give a structured summary: current education/role, key technical projects, passion for building software, and alignment with the company.',
      explanation: 'A strong introduction uses the Present-Past-Future model: where you are today, key relevant projects/achievements, and why you are excited for this role.',
      hints: JSON.stringify(['Use the Present-Past-Future framework and highlight 2 top projects.']),
      companyTags: JSON.stringify(['Google', 'Microsoft', 'Amazon', 'Flipkart']),
    },
    {
      title: 'Handling Technical Disagreements (STAR Method)',
      category: 'HR',
      topic: 'Behavioral',
      difficulty: 'Medium',
      description: 'Describe a situation where you disagreed with a teammate or peer regarding a technical design choice. How did you resolve it?',
      options: JSON.stringify([
        'Use STAR: Situation, Task, Action (listened, collected data/benchmarks, reached consensus), Result (successful delivery).',
        'Insist on your way because your solution is definitely better.',
        'Immediately give up and let the other person do whatever they want.',
        'Escalate to management without discussing with the teammate.'
      ]),
      correctAnswer: 'Use STAR: Situation, Task, Action (listened, collected data/benchmarks, reached consensus), Result (successful delivery).',
      explanation: 'Demonstrating collaborative disagreement resolution through data, open dialogue, and trade-off analysis shows high engineering maturity.',
      hints: JSON.stringify(['Focus on data-driven discussion and constructive team outcomes.']),
      companyTags: JSON.stringify(['Amazon', 'Atlassian', 'Uber']),
    }
  ];

  for (const q of questionsBank) {
    await prisma.question.create({ data: q });
  }

  console.log('Seeding mock interview...');
  const pastMock = await prisma.mockInterview.create({
    data: {
      userId: demoUser.id,
      company: 'Amazon',
      role: 'Software Development Engineer I',
      experienceLevel: 'Fresher',
      mockType: 'Full Mock',
      durationMinutes: 45,
      currentRound: 4,
      status: 'COMPLETED',
      overallScore: 76,
      hrScore: 82,
      technicalScore: 76,
      codingScore: 74,
      managerialScore: 81,
      feedback: 'Good problem-solving communication and structured approach. Can optimize time complexity in DSA and deepen DBMS indexing concepts.',
      radarMetrics: JSON.stringify({ technical: 76, coding: 74, managerial: 81, hr: 82, communication: 79 }),
    },
  });

  await prisma.mockRound.createMany({
    data: [
      { mockInterviewId: pastMock.id, roundIndex: 1, roundType: 'HR', score: 82, status: 'COMPLETED', feedback: 'Clear introduction and confident answers.' },
      { mockInterviewId: pastMock.id, roundIndex: 2, roundType: 'Coding', score: 74, status: 'COMPLETED', feedback: 'Implemented solution with test cases passing, could optimize space.' },
      { mockInterviewId: pastMock.id, roundIndex: 3, roundType: 'Technical', score: 76, status: 'COMPLETED', feedback: 'Good understanding of OS and OOP principles.' },
      { mockInterviewId: pastMock.id, roundIndex: 4, roundType: 'Managerial', score: 81, status: 'COMPLETED', feedback: 'Sound situational reasoning using STAR approach.' }
    ]
  });

  console.log('Seeding past 100-minute AI Avatar interview...');
  const pastAiInterview = await prisma.avatarInterview.create({
    data: {
      userId: demoUser.id,
      company: 'Google',
      role: 'Software Engineer',
      experienceLevel: 'Fresher',
      interviewerPersona: 'Sarah',
      durationMinutes: 100,
      currentRound: 4,
      status: 'COMPLETED',
      overallScore: 78,
      hrScore: 82,
      codingScore: 74,
      technicalScore: 76,
      managerialScore: 81,
      negotiationScore: 84,
      communicationScore: 80,
      confidenceScore: 76,
      techAccuracyScore: 78,
      answerStructureScore: 74,
      problemSolvingScore: 80,
      integrityScore: 98,
      summaryReport: 'Strong performance across all 4 rounds. Demonstrated clear communication in HR and Negotiation rounds. High technical depth in DBMS and System Design foundations. Good coding execution on Two Sum and Stack algorithms.',
    },
  });

  await prisma.avatarMessage.createMany({
    data: [
      { avatarInterviewId: pastAiInterview.id, roundNumber: 1, sender: 'AI', message: 'Hi Abhineet! Welcome to your 100-minute comprehensive interview. Let us start with a brief introduction.' },
      { avatarInterviewId: pastAiInterview.id, roundNumber: 1, sender: 'USER', message: 'Hello Sarah! I am a final-year CS student passionate about distributed systems and algorithmic problem solving.' },
      { avatarInterviewId: pastAiInterview.id, roundNumber: 1, sender: 'AI', message: 'Great! I noticed you built a placement prep engine. What was the most technically challenging bug you encountered?' },
      { avatarInterviewId: pastAiInterview.id, roundNumber: 2, sender: 'SYSTEM', message: 'Round 2 - Coding & DSA commenced. Monaco Editor loaded.' },
      { avatarInterviewId: pastAiInterview.id, roundNumber: 3, sender: 'AI', message: 'Welcome to Round 3. How would you design a scalable URL shortener with low latency?' },
      { avatarInterviewId: pastAiInterview.id, roundNumber: 4, sender: 'AI', message: 'In this final round, let us discuss package and career expectations. What are your compensation expectations?' },
    ]
  });

  console.log('Seeding recommendations...');
  const recommendationsData = [
    {
      userId: demoUser.id,
      title: 'Practice 10 Graph questions',
      description: 'Based on your recent mock performance, strengthen BFS/DFS and Topological Sort.',
      category: 'DSA',
      priority: 'HIGH',
      actionUrl: '/practice?topic=Graph&category=DSA',
    },
    {
      userId: demoUser.id,
      title: 'Revise System Design Basics',
      description: 'Improve caching strategies, database sharding, and API rate limiting concepts.',
      category: 'System Design',
      priority: 'HIGH',
      actionUrl: '/practice?topic=System%20Design&category=TECHNICAL',
    },
    {
      userId: demoUser.id,
      title: 'Improve Communication - STAR Method',
      description: 'Practice answering behavioral scenarios with concrete metrics and impact.',
      category: 'Communication',
      priority: 'MEDIUM',
      actionUrl: '/practice?topic=Behavioral&category=HR',
    },
    {
      userId: demoUser.id,
      title: 'Schedule Full Mock Interview',
      description: 'Simulate a timed session with Google/Amazon specific question patterns.',
      category: 'Mock',
      priority: 'MEDIUM',
      actionUrl: '/mock-interview',
    },
    {
      userId: demoUser.id,
      title: 'Take 100-min AI Avatar Interview',
      description: 'Test all 4 rounds in real-time with continuous AI evaluation and proctoring.',
      category: 'AI Interview',
      priority: 'HIGH',
      actionUrl: '/ai-avatar',
    }
  ];

  for (const rec of recommendationsData) {
    await prisma.recommendation.create({ data: rec });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
