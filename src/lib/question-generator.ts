// Comprehensive Offline Question Bank & Generator
// Zero external AI credits required - fully deterministic and realistic

export interface GeneratedQuestion {
  id: string;
  title: string;
  category: 'APTITUDE' | 'DSA' | 'TECHNICAL' | 'HR';
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Adaptive';
  description: string;
  options?: string[];
  correctAnswer?: string;
  explanation: string;
  hints: string[];
  companyTags?: string[];
  starterCodeJava?: string;
  solutionJava?: string;
  testCases?: Array<{ input: string; expected: string; hidden?: boolean }>;
}

export interface CodingProblemDef {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  hints: string[];
  explanation: string;
  starterCodeJava: string;
  solutionJava: string;
  testCases: Array<{ input: string; expected: string; hidden?: boolean }>;
}

export const CATEGORY_TOPICS: Record<string, string[]> = {
  'Aptitude': [
    'Quantitative Aptitude',
    'Logical Reasoning',
    'Verbal Ability',
    'Data Interpretation',
    'Probability & Permutations',
    'Time, Speed & Distance',
    'Number Systems',
    'Puzzles & Deductions'
  ],
  'DSA & Coding': [
    'Array',
    'String',
    'Linked List',
    'Stack',
    'Queue',
    'Tree',
    'Graph',
    'Dynamic Programming',
    'Recursion & Backtracking',
    'Binary Search'
  ],
  'Technical': [
    'DBMS & SQL',
    'Operating Systems',
    'Computer Networks',
    'Object Oriented Programming (OOP)',
    'System Design Basics',
    'Data Structures Theory',
    'Cloud & Distributed Systems'
  ],
  'HR / Behavioral': [
    'Self Introduction',
    'Behavioral (STAR Method)',
    'Situational Judgment',
    'Team Conflict & Collaboration',
    'Leadership & Ownership',
    'Career Goals & Motivation',
    'Strengths & Weaknesses'
  ]
};

// =========================================================================
// 1. RICH OFFLINE CODING PROBLEMS BANK (Clean Starter Templates, No Prefilled Algorithms)
// =========================================================================
export const CODING_PROBLEMS_BANK: CodingProblemDef[] = [
  {
    id: 'p-two-sum',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Map'],
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    hints: ['Can you use a HashMap to store complements (target - nums[i]) with their indices for O(N) lookup?'],
    explanation: 'Iterate through the array while maintaining a HashMap mapping value to index. For each element, look up (target - nums[i]).',
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
            if (map.containsKey(complement)) return new int[]{map.get(complement), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
    testCases: [
      { input: '[2,7,11,15]\n9', expected: '[0, 1]', hidden: false },
      { input: '[3,2,4]\n6', expected: '[1, 2]', hidden: false },
      { input: '[3,3]\n6', expected: '[0, 1]', hidden: false },
      { input: '[1,5,8,3,9]\n11', expected: '[2, 3]', hidden: true },
      { input: '[100,-50,20,-30]\n-10', expected: '[2, 3]', hidden: true }
    ]
  },
  {
    id: 'p-valid-parentheses',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nOpen brackets must be closed by the same type of brackets in the correct order.',
    examples: [
      { input: 's = "()"', output: 'true', explanation: 'Matched single pair.' },
      { input: 's = "()[]{}"', output: 'true', explanation: 'Multiple valid pairs.' },
      { input: 's = "(]"', output: 'false', explanation: 'Mismatched brackets.' }
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only: ()[]{}'],
    hints: ['Push opening brackets to a stack, and pop & verify when closing brackets appear.'],
    explanation: 'Use a stack to track open brackets. Match each closing bracket with the top of stack.',
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
            if (c == '(' || c == '{' || c == '[') stack.push(c);
            else {
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
    testCases: [
      { input: '()', expected: 'true', hidden: false },
      { input: '()[]{}', expected: 'true', hidden: false },
      { input: '(]', expected: 'false', hidden: false },
      { input: '([{}])', expected: 'true', hidden: true },
      { input: '([)]', expected: 'false', hidden: true }
    ]
  },
  {
    id: 'p-reverse-linked-list',
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    description: 'Given a list of elements representing a singly linked list, reverse the list and return the reversed list.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'Reversed order.' }
    ],
    constraints: ['0 <= length <= 5000', '-5000 <= val <= 5000'],
    hints: ['Keep three pointers: prev, curr, and next.'],
    explanation: 'Iteratively advance curr while redirecting next pointers backwards to prev.',
    starterCodeJava: `import java.util.*;

class Solution {
    public List<Integer> reverseList(List<Integer> list) {
        // Write your code here
        
        return new ArrayList<>();
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
    testCases: [
      { input: '[1, 2, 3, 4, 5]', expected: '[5, 4, 3, 2, 1]', hidden: false },
      { input: '[1, 2]', expected: '[2, 1]', hidden: false },
      { input: '[]', expected: '[]', hidden: false }
    ]
  },
  {
    id: 'p-climbing-stairs',
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math'],
    description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2 steps.' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, or 2+1 steps.' }
    ],
    constraints: ['1 <= n <= 45'],
    hints: ['To reach step n, you must arrive from step n-1 or n-2. Notice the Fibonacci pattern.'],
    explanation: 'ways(n) = ways(n-1) + ways(n-2). Compute iteratively in O(N) time and O(1) space.',
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
    testCases: [
      { input: '2', expected: '2', hidden: false },
      { input: '3', expected: '3', hidden: false },
      { input: '4', expected: '5', hidden: false },
      { input: '5', expected: '8', hidden: true }
    ]
  },
  {
    id: 'p-number-of-islands',
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium',
    tags: ['Graph', 'BFS', 'DFS'],
    description: 'Given an m x n 2D binary grid grid which represents a map of 1s (land) and 0s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    examples: [
      { input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]', output: '2', explanation: 'Two distinct islands.' }
    ],
    constraints: ['1 <= m, n <= 300', 'grid[i][j] is "0" or "1"'],
    hints: ['Traverse the grid and launch DFS/BFS whenever an unvisited land cell "1" is encountered.'],
    explanation: 'Sink each visited island by turning connected "1"s into "0"s during traversal.',
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
    testCases: [
      { input: '[["1","1","0"],["1","1","0"],["0","0","1"]]', expected: '2', hidden: false }
    ]
  },
  {
    id: 'p-maximum-subarray',
    title: 'Maximum Subarray (Kadane)',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming'],
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    hints: ['Kadane\'s algorithm: currentSum = max(num, currentSum + num).'],
    explanation: 'Track the running subarray sum and reset to current element if negative.',
    starterCodeJava: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your code here
        
        return 0;
    }
}`,
    solutionJava: `class Solution {
    public int maxSubArray(int[] nums) {
        int max = nums[0], cur = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            max = Math.max(max, cur);
        }
        return max;
    }
}`,
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6', hidden: false },
      { input: '[1]', expected: '1', hidden: false },
      { input: '[5,4,-1,7,8]', expected: '23', hidden: false }
    ]
  },
  {
    id: 'p-best-time-stock',
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'],
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' }
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    hints: ['Maintain minimum price seen so far, and calculate max profit for each day.'],
    explanation: 'Track minPrice seen so far and update maxProfit = max(maxProfit, price - minPrice).',
    starterCodeJava: `class Solution {
    public int maxProfit(int[] prices) {
        // Write your code here
        
        return 0;
    }
}`,
    solutionJava: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;
        for (int p : prices) {
            if (p < minPrice) minPrice = p;
            else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
        }
        return maxProfit;
    }
}`,
    testCases: [
      { input: '[7,1,5,3,6,4]', expected: '5', hidden: false },
      { input: '[7,6,4,3,1]', expected: '0', hidden: false }
    ]
  },
  {
    id: 'p-binary-search',
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    tags: ['Binary Search', 'Array'],
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4' }
    ],
    constraints: ['1 <= nums.length <= 10^4', 'All elements in nums are unique and sorted.'],
    hints: ['Calculate mid = left + (right - left) / 2 to prevent integer overflow.'],
    explanation: 'Divide search space in half repeatedly in O(log N) time.',
    starterCodeJava: `class Solution {
    public int search(int[] nums, int target) {
        // Write your code here
        
        return -1;
    }
}`,
    solutionJava: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`,
    testCases: [
      { input: '[-1,0,3,5,9,12]\n9', expected: '4', hidden: false },
      { input: '[-1,0,3,5,9,12]\n2', expected: '-1', hidden: false }
    ]
  },
  {
    id: 'p-merge-sorted-lists',
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list and return the head of the merged list.',
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]', explanation: 'Merged sorted list.' }
    ],
    constraints: ['Number of nodes is 0 to 50', '-100 <= val <= 100'],
    hints: ['Use a dummy head pointer to simplify node linking.'],
    explanation: 'Compare heads of both lists and advance the smaller node pointer.',
    starterCodeJava: `import java.util.*;

class Solution {
    public List<Integer> mergeTwoLists(List<Integer> l1, List<Integer> l2) {
        // Write your code here
        
        return new ArrayList<>();
    }
}`,
    solutionJava: `import java.util.*;

class Solution {
    public List<Integer> mergeTwoLists(List<Integer> l1, List<Integer> l2) {
        List<Integer> res = new ArrayList<>(l1);
        res.addAll(l2);
        Collections.sort(res);
        return res;
    }
}`,
    testCases: [
      { input: '[1, 2, 4]\n[1, 3, 4]', expected: '[1, 1, 2, 3, 4, 4]', hidden: false },
      { input: '[]\n[]', expected: '[]', hidden: false }
    ]
  },
  {
    id: 'p-palindrome-number',
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: 'Easy',
    tags: ['Math'],
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.',
    examples: [
      { input: 'x = 121', output: 'true', explanation: '121 reads 121 forward and backward.' },
      { input: 'x = -121', output: 'false', explanation: 'Reads -121 vs 121-.' }
    ],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    hints: ['Negative numbers cannot be palindromes due to the leading minus sign.'],
    explanation: 'Reverse the second half of the digits and compare with the first half.',
    starterCodeJava: `class Solution {
    public boolean isPalindrome(int x) {
        // Write your code here
        
        return false;
    }
}`,
    solutionJava: `class Solution {
    public boolean isPalindrome(int x) {
        if (x < 0 || (x % 10 == 0 && x != 0)) return false;
        int rev = 0;
        while (x > rev) {
            rev = rev * 10 + x % 10;
            x /= 10;
        }
        return x == rev || x == rev / 10;
    }
}`,
    testCases: [
      { input: '121', expected: 'true', hidden: false },
      { input: '-121', expected: 'false', hidden: false },
      { input: '10', expected: 'false', hidden: false }
    ]
  }
];

// =========================================================================
// 2. COMPREHENSIVE CONCEPTUAL QUESTION BANK (Aptitude, Technical, HR)
// =========================================================================
export const QUESTION_DATABASE: Record<string, GeneratedQuestion[]> = {
  // === APTITUDE ===
  'Quantitative Aptitude': [
    {
      id: 'apt-quant-1',
      title: 'Time and Work Efficiency Calculation',
      category: 'APTITUDE',
      topic: 'Quantitative Aptitude',
      difficulty: 'Medium',
      description: 'A can complete a piece of work in 12 days and B in 15 days. They work together for 5 days and then B leaves. In how many more days will A finish the remaining work alone?',
      options: ['3 days', '4 days', '5 days', '6 days'],
      correctAnswer: '3 days',
      explanation: 'Combined rate = 1/12 + 1/15 = 3/20. Work done in 5 days = 5 * (3/20) = 3/4. Remaining = 1/4. Days for A alone = (1/4) / (1/12) = 3 days.',
      hints: ['Find combined daily rate, compute 5 days of work, and divide remainder by A\'s rate.'],
      companyTags: ['TCS', 'Infosys', 'Cognizant']
    },
    {
      id: 'apt-quant-2',
      title: 'Relative Speed of Two Moving Trains',
      category: 'APTITUDE',
      topic: 'Quantitative Aptitude',
      difficulty: 'Easy',
      description: 'Two trains 140 m and 160 m long run at speeds of 60 km/hr and 40 km/hr respectively in opposite directions on parallel tracks. How long will they take to cross each other?',
      options: ['9.6 seconds', '10.8 seconds', '12 seconds', '14.4 seconds'],
      correctAnswer: '10.8 seconds',
      explanation: 'Total distance = 140 + 160 = 300 m. Relative speed = 60 + 40 = 100 km/hr = 250/9 m/s. Time = 300 / (250/9) = 10.8 seconds.',
      hints: ['When trains move in opposite directions, relative speeds add together.'],
      companyTags: ['Accenture', 'Wipro']
    },
    {
      id: 'apt-quant-3',
      title: 'Compound Interest vs Simple Interest Difference',
      category: 'APTITUDE',
      topic: 'Quantitative Aptitude',
      difficulty: 'Hard',
      description: 'The difference between simple and compound interest on a sum of money for 2 years at 10% per annum is ₹65. What is the principal sum?',
      options: ['₹5,500', '₹6,000', '₹6,500', '₹7,000'],
      correctAnswer: '₹6,500',
      explanation: 'For 2 years: CI - SI = P * (R/100)^2. Here, 65 = P * (1/100). Thus P = ₹6,500.',
      hints: ['Use the 2-year difference formula: Difference = P * (r/100)^2.'],
      companyTags: ['Amazon', 'Flipkart']
    },
    {
      id: 'apt-quant-4',
      title: 'Probability of Selecting Distinct Items',
      category: 'APTITUDE',
      topic: 'Quantitative Aptitude',
      difficulty: 'Medium',
      description: 'A box contains 5 red, 4 green, and 3 blue balls. If two balls are drawn at random without replacement, what is the probability that both are green?',
      options: ['1/11', '2/11', '4/33', '1/9'],
      correctAnswer: '1/11',
      explanation: 'Total balls = 12. P(both green) = (4/12) * (3/11) = 12 / 132 = 1/11.',
      hints: ['Multiply probability of first green by conditional probability of second green.'],
      companyTags: ['Goldman Sachs', 'Morgan Stanley']
    },
    {
      id: 'apt-quant-5',
      title: 'Profit, Loss and Marked Price Discount',
      category: 'APTITUDE',
      topic: 'Quantitative Aptitude',
      difficulty: 'Easy',
      description: 'A shopkeeper marks an item 20% above the cost price and gives a 10% discount on the marked price. What is the net profit percentage?',
      options: ['8%', '10%', '12%', '15%'],
      correctAnswer: '8%',
      explanation: 'Let CP = 100. MP = 120. SP = 120 * 0.9 = 108. Net Profit = 8%.',
      hints: ['Assume base CP of 100 for percentage problems.'],
      companyTags: ['Deloitte', 'PwC']
    }
  ],

  'Logical Reasoning': [
    {
      id: 'apt-log-1',
      title: 'Blood Relations Logical Deduction',
      category: 'APTITUDE',
      topic: 'Logical Reasoning',
      difficulty: 'Easy',
      description: 'Pointing to a photograph, a woman says: "He is the brother of the only daughter of my father\'s wife." How is the man in the photograph related to the woman?',
      options: ['Brother', 'Son', 'Father', 'Uncle'],
      correctAnswer: 'Brother',
      explanation: 'Father\'s wife = Mother. Only daughter of mother = The woman herself. Brother of that daughter = Brother of the woman.',
      hints: ['Trace backwards from "father\'s wife" to identify relationships.'],
      companyTags: ['Deloitte', 'Capgemini']
    },
    {
      id: 'apt-log-2',
      title: 'Circular Seating Arrangement',
      category: 'APTITUDE',
      topic: 'Logical Reasoning',
      difficulty: 'Medium',
      description: 'Six persons A, B, C, D, E, and F sit around a circular table facing center. A sits second to the left of C. B sits opposite to A. D is an immediate neighbor of both B and C. Who sits opposite to E?',
      options: ['D', 'C', 'F', 'B'],
      correctAnswer: 'C',
      explanation: 'Placing positions clockwise: A(1), E(2), C(3), D(4), B(5), F(6). In a 6-seat circle, opposite to E(2) is position (2+3=5) or position 3: here C sits opposite.',
      hints: ['Sketch a 6-node circle and lock opposite pairs first.'],
      companyTags: ['Google', 'Microsoft']
    },
    {
      id: 'apt-log-3',
      title: 'Syllogisms and Quantifiers',
      category: 'APTITUDE',
      topic: 'Logical Reasoning',
      difficulty: 'Medium',
      description: 'Statements: (1) All engineers are thinkers. (2) Some thinkers are poets. Conclusions: I. Some engineers are poets. II. All thinkers are engineers.',
      options: ['Only I follows', 'Only II follows', 'Either I or II follows', 'Neither follows'],
      correctAnswer: 'Neither follows',
      explanation: 'Because the overlap between thinkers and poets may not intersect with the subset of thinkers who are engineers, neither conclusion necessarily follows.',
      hints: ['Draw overlapping Venn diagrams to test counterexamples.'],
      companyTags: ['Adobe', 'TCS']
    },
    {
      id: 'apt-log-4',
      title: 'Number Series Completion Pattern',
      category: 'APTITUDE',
      topic: 'Logical Reasoning',
      difficulty: 'Easy',
      description: 'Find the next number in the series: 3, 7, 15, 31, 63, ?',
      options: ['125', '127', '129', '131'],
      correctAnswer: '127',
      explanation: 'Pattern is 2 * n + 1 (or +4, +8, +16, +32, +64). 63 + 64 = 127.',
      hints: ['Look at differences: 4, 8, 16, 32...'],
      companyTags: ['Infosys', 'Wipro']
    }
  ],

  'Verbal Ability': [
    {
      id: 'apt-verb-1',
      title: 'Subject-Verb Agreement and Collective Nouns',
      category: 'APTITUDE',
      topic: 'Verbal Ability',
      difficulty: 'Easy',
      description: 'Choose the grammatically correct sentence:',
      options: [
        'The team of software engineers have submitted their final report.',
        'The team of software engineers has submitted its final report.',
        'The team of software engineers have submitted its final report.',
        'The team of software engineers has submitted their final report.'
      ],
      correctAnswer: 'The team of software engineers has submitted its final report.',
      explanation: '"The team" is a singular collective noun requiring the singular verb "has" and singular pronoun "its".',
      hints: ['The subject is "team", not the plural prepositional object "engineers".'],
      companyTags: ['Goldman Sachs', 'Amazon']
    },
    {
      id: 'apt-verb-2',
      title: 'Vocabulary in Context - Equivocal',
      category: 'APTITUDE',
      topic: 'Verbal Ability',
      difficulty: 'Medium',
      description: 'Select the synonym closest in meaning to "Equivocal":',
      options: ['Ambiguous', 'Certain', 'Resolute', 'Transparent'],
      correctAnswer: 'Ambiguous',
      explanation: 'Equivocal means open to more than one interpretation or deliberately ambiguous.',
      hints: ['Equi (equal) + vocal (voice) -> having two voices/meanings.'],
      companyTags: ['Cognizant', 'Accenture']
    }
  ],

  // === TECHNICAL (CORE CS) ===
  'DBMS & SQL': [
    {
      id: 'tech-dbms-1',
      title: 'Database Normalization - 3NF vs BCNF',
      category: 'TECHNICAL',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      description: 'Which condition is strictly required for a relational schema to be in Boyce-Codd Normal Form (BCNF)?',
      options: [
        'Every non-prime attribute is fully functional dependent on candidate keys.',
        'No transitive dependency exists between non-prime attributes.',
        'For every functional dependency X -> Y, X must be a superkey.',
        'Every determinant is a non-prime attribute.'
      ],
      correctAnswer: 'For every functional dependency X -> Y, X must be a superkey.',
      explanation: 'BCNF strictly requires the determinant X to be a superkey for every non-trivial functional dependency X -> Y.',
      hints: ['BCNF eliminates all dependencies where left hand is not a candidate/super key.'],
      companyTags: ['Oracle', 'Google', 'Microsoft']
    },
    {
      id: 'tech-dbms-2',
      title: 'ACID Properties & Transaction Anomalies',
      category: 'TECHNICAL',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      description: 'What transaction anomaly occurs when a transaction reads the same row twice and observes changed values because another transaction committed an update?',
      options: ['Dirty Read', 'Non-Repeatable Read', 'Phantom Read', 'Lost Update'],
      correctAnswer: 'Non-Repeatable Read',
      explanation: 'A Non-Repeatable Read occurs when a committed UPDATE modifies existing rows between two reads of the same transaction.',
      hints: ['Phantom reads relate to newly inserted rows; non-repeatable reads relate to updated existing rows.'],
      companyTags: ['Amazon', 'Salesforce']
    },
    {
      id: 'tech-dbms-3',
      title: 'B+ Tree Indexing in Disk-Based Relational DBs',
      category: 'TECHNICAL',
      topic: 'DBMS & SQL',
      difficulty: 'Hard',
      description: 'Why do relational databases predominantly utilize B+ Trees for table indexes rather than binary search trees?',
      options: [
        'B+ Trees require zero disk operations.',
        'B+ Trees have high fanout minimizing disk I/O, and all data pointers are stored in linked leaf nodes enabling fast range queries.',
        'Hash tables cannot perform exact match lookups.',
        'Binary search trees are faster on disk than in RAM.'
      ],
      correctAnswer: 'B+ Trees have high fanout minimizing disk I/O, and all data pointers are stored in linked leaf nodes enabling fast range queries.',
      explanation: 'B+ Tree fanout matches disk block sizes keeping tree depth shallow (3-4 I/Os) and leaf pointers allow sequential range scans.',
      hints: ['Think of disk block allocation and range queries (BETWEEN).'],
      companyTags: ['Uber', 'Meta']
    },
    {
      id: 'tech-dbms-4',
      title: 'SQL JOIN Types & Cartesians',
      category: 'TECHNICAL',
      topic: 'DBMS & SQL',
      difficulty: 'Easy',
      description: 'Which SQL JOIN returns all rows from the left table, and matching rows from the right table, returning NULL for right columns when there is no match?',
      options: ['INNER JOIN', 'LEFT OUTER JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'],
      correctAnswer: 'LEFT OUTER JOIN',
      explanation: 'LEFT JOIN preserves every row from table A and pairs with matching rows of B, filling unmatched B rows with NULLs.',
      hints: ['Left preserves the left table regardless of matches.'],
      companyTags: ['Microsoft', 'SAP']
    }
  ],

  'Operating Systems': [
    {
      id: 'tech-os-1',
      title: 'Coffman Deadlock Conditions',
      category: 'TECHNICAL',
      topic: 'Operating Systems',
      difficulty: 'Medium',
      description: 'Which of the following is NOT one of the four necessary Coffman conditions for a system deadlock?',
      options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
      correctAnswer: 'Preemption Allowed',
      explanation: 'The four necessary conditions are: 1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, and 4. Circular Wait.',
      hints: ['Preemption prevents deadlocks rather than creating them.'],
      companyTags: ['Microsoft', 'Intel', 'Cisco']
    },
    {
      id: 'tech-os-2',
      title: 'Process vs Thread Memory Architecture',
      category: 'TECHNICAL',
      topic: 'Operating Systems',
      difficulty: 'Easy',
      description: 'In a multithreaded process, what resource is privately owned by each individual thread rather than shared?',
      options: ['Heap memory', 'Global variables', 'Stack and CPU Registers', 'Open File Descriptors'],
      correctAnswer: 'Stack and CPU Registers',
      explanation: 'Each thread has its own private execution context: Stack, Program Counter, and CPU Registers. Heap and globals are shared.',
      hints: ['Each thread must track its own function call frames.'],
      companyTags: ['Apple', 'Qualcomm']
    },
    {
      id: 'tech-os-3',
      title: 'Virtual Memory and Page Fault Handling',
      category: 'TECHNICAL',
      topic: 'Operating Systems',
      difficulty: 'Medium',
      description: 'What happens when a CPU reference encounters a Page Fault exception?',
      options: [
        'The process is immediately terminated with a segmentation fault.',
        'The OS traps into kernel mode, locates the requested page on backing store/swap, loads it into an empty physical RAM frame, and resumes the instruction.',
        'The CPU resets the memory bus.',
        'The compiler re-optimizes the binary.'
      ],
      correctAnswer: 'The OS traps into kernel mode, locates the requested page on backing store/swap, loads it into an empty physical RAM frame, and resumes the instruction.',
      explanation: 'Page faults are handled transparently by the OS kernel pager by bringing missing pages into physical memory.',
      hints: ['Think of the role of the MMU and kernel swap handling.'],
      companyTags: ['Google', 'AWS']
    }
  ],

  'Computer Networks': [
    {
      id: 'tech-cn-1',
      title: 'TCP 3-Way Handshake Purpose',
      category: 'TECHNICAL',
      topic: 'Computer Networks',
      difficulty: 'Easy',
      description: 'What is the primary function of the initial SYN, SYN-ACK, ACK packet exchange in TCP?',
      options: [
        'To encrypt data with TLS certificates.',
        'To synchronize sequence numbers, verify bi-directional connectivity, and establish flow control parameters.',
        'To compress packet payloads.',
        'To route packets via DNS.'
      ],
      correctAnswer: 'To synchronize sequence numbers, verify bi-directional connectivity, and establish flow control parameters.',
      explanation: 'The 3-way handshake confirms that both client and server can send and receive, and aligns initial sequence numbers.',
      hints: ['Synchronize and acknowledge initial sequence numbers.'],
      companyTags: ['Cisco', 'Cloudflare']
    }
  ],

  'System Design Basics': [
    {
      id: 'tech-sd-1',
      title: 'CAP Theorem and Distributed Systems',
      category: 'TECHNICAL',
      topic: 'System Design Basics',
      difficulty: 'Medium',
      description: 'According to the CAP Theorem, when a network partition (P) occurs between distributed nodes, what fundamental choice must a system make?',
      options: [
        'Trade-off between Speed and Storage capacity.',
        'Trade-off between Consistency (C) and Availability (A).',
        'Trade-off between Encryption and Compression.',
        'Trade-off between CPU utilization and RAM allocation.'
      ],
      correctAnswer: 'Trade-off between Consistency (C) and Availability (A).',
      explanation: 'When nodes cannot communicate across a partition, the system can either reject requests to protect consistency (CP) or serve potentially stale data to stay available (AP).',
      hints: ['You cannot avoid partitions in real distributed networks.'],
      companyTags: ['Amazon AWS', 'Uber', 'Netflix']
    },
    {
      id: 'tech-sd-2',
      title: 'Database Read-Replication vs Sharding',
      category: 'TECHNICAL',
      topic: 'System Design Basics',
      difficulty: 'Hard',
      description: 'What is the key architectural difference between Database Read-Replication and Horizontal Sharding?',
      options: [
        'Replication handles writes; Sharding handles reads.',
        'Read-Replication duplicates entire datasets to scale read throughput; Sharding partitions rows across multiple nodes to scale write throughput and total storage.',
        'Sharding stores all data in memory; Replication stores data on disk.',
        'There is no functional difference.'
      ],
      correctAnswer: 'Read-Replication duplicates entire datasets to scale read throughput; Sharding partitions rows across multiple nodes to scale write throughput and total storage.',
      explanation: 'Replicas mirror all data for reads; Shards distribute data subsets to distribute write load and storage capacity.',
      hints: ['Replicas hold identical copies; Shards hold distinct partitions.'],
      companyTags: ['Stripe', 'Twitter / X', 'LinkedIn']
    }
  ],

  // === HR / BEHAVIORAL ===
  'Self Introduction': [
    {
      id: 'hr-intro-1',
      title: 'Executive Pitch - Present, Past, Future Framework',
      category: 'HR',
      topic: 'Self Introduction',
      difficulty: 'Easy',
      description: 'When an interviewer asks "Tell me about yourself", which answering structure demonstrates the highest professional polish?',
      options: [
        'Present (current role/education & technical focus) -> Past (key 2 projects & achievements) -> Future (why this company and role excite you).',
        'Chronological biography starting from elementary school and personal childhood hobbies.',
        'Recite every line from your resume word-for-word in order.',
        'Ask the interviewer to read your resume instead.'
      ],
      correctAnswer: 'Present (current role/education & technical focus) -> Past (key 2 projects & achievements) -> Future (why this company and role excite you).',
      explanation: 'The Present-Past-Future framework provides a crisp 90-second narrative that hooks the interviewer, highlights demonstrable engineering impact, and bridges directly into the open position.',
      hints: ['Keep it under 2 minutes, focus on technical value and excitement for the role.'],
      companyTags: ['Google', 'Microsoft', 'Amazon', 'Goldman Sachs']
    },
    {
      id: 'hr-intro-2',
      title: 'Discussing Academic Projects and Foundations',
      category: 'HR',
      topic: 'Self Introduction',
      difficulty: 'Easy',
      description: 'When highlighting your capstone or primary software project to an interviewer, which detail is most impactful to emphasize?',
      options: [
        'Only the design tools used for UI mockups.',
        'The problem solved, your personal architectural contributions, technical challenges overcome, and measurable performance outcomes.',
        'That your professor gave you an A grade without explaining what the code did.',
        'Complaints about other students who did not contribute.'
      ],
      correctAnswer: 'The problem solved, your personal architectural contributions, technical challenges overcome, and measurable performance outcomes.',
      explanation: 'Interviewers seek demonstrable engineering ownership: what decisions you made, how you solved bugs, and what impact the software achieved.',
      hints: ['Focus on your specific individual contribution and problem solved.'],
      companyTags: ['Amazon', 'Adobe']
    }
  ],

  'Behavioral (STAR Method)': [
    {
      id: 'hr-star-1',
      title: 'Overcoming Critical Technical Hurdles (STAR)',
      category: 'HR',
      topic: 'Behavioral (STAR Method)',
      difficulty: 'Medium',
      description: 'Describe a situation where a software bug or architectural bottleneck threatened a deadline. How should you structure your response using the STAR method?',
      options: [
        'Situation (context/deadline) -> Task (your specific responsibility) -> Action (steps you took, technical triage, debugging) -> Result (metrics, saved time, what you learned).',
        'Blame teammates who wrote the buggy code and explain how you fixed it alone.',
        'Focus only on the technical code snippet without discussing team impact.',
        'State that you never write bugs so you haven\'t faced this situation.'
      ],
      correctAnswer: 'Situation (context/deadline) -> Task (your specific responsibility) -> Action (steps you took, technical triage, debugging) -> Result (metrics, saved time, what you learned).',
      explanation: 'Top tech companies evaluate structured ownership: clearly articulating context, identifying your personal contribution, and highlighting quantifiable business impact.',
      hints: ['Focus on the "Action" and quantifiable "Result" (e.g. reduced latency by 40%, shipped on time).'],
      companyTags: ['Amazon', 'Meta', 'Uber']
    },
    {
      id: 'hr-star-2',
      title: 'Handling Constructive Feedback and Mistakes',
      category: 'HR',
      topic: 'Behavioral (STAR Method)',
      difficulty: 'Medium',
      description: 'How should you answer: "Tell me about a time you made a mistake in code that affected users or broke a build?"',
      options: [
        'Acknowledge the mistake transparently, explain how you quickly mitigated user impact, conducted a root-cause blameless postmortem, and built safeguards/tests to prevent recurrence.',
        'Claim that the CI/CD pipeline was faulty and it wasn\'t your responsibility.',
        'Hide mistakes and say everything always worked on the first try.',
        'Blame the QA team for missing it.'
      ],
      correctAnswer: 'Acknowledge the mistake transparently, explain how you quickly mitigated user impact, conducted a root-cause blameless postmortem, and built safeguards/tests to prevent recurrence.',
      explanation: 'Mature engineers display blameless accountability, swift mitigation, and automated preventative measures.',
      hints: ['Emphasize accountability, root cause analysis, and preventative tests.'],
      companyTags: ['Microsoft', 'Google']
    }
  ],

  'Team Conflict & Collaboration': [
    {
      id: 'hr-conflict-1',
      title: 'Navigating Architectural Disagreements with Peers',
      category: 'HR',
      topic: 'Team Conflict & Collaboration',
      difficulty: 'Medium',
      description: 'How should you respond to: "Tell me about a time you strongly disagreed with a senior engineer or teammate over a technical approach?"',
      options: [
        'Explain how you listened to their perspective, gathered concrete benchmark data and proof-of-concept metrics, evaluated trade-offs collaboratively, and committed fully to the chosen decision.',
        'Argue until they agree with your approach because you know you are right.',
        'Silently ignore their decision and secretly write code your way.',
        'Escalate immediately to upper management to force a decision.'
      ],
      correctAnswer: 'Explain how you listened to their perspective, gathered concrete benchmark data and proof-of-concept metrics, evaluated trade-offs collaboratively, and committed fully to the chosen decision.',
      explanation: 'Demonstrating disagreement with data, empathy, and the principle of "Disagree and Commit" proves strong team maturity, open-mindedness, and emotional intelligence.',
      hints: ['Highlight objective benchmarks, trade-off analysis, and "Disagree and Commit".'],
      companyTags: ['Apple', 'Microsoft', 'Netflix']
    }
  ]
};

// =========================================================================
// 3. RETRIEVAL ENGINE WITH GUARANTEED QUESTION COUNT
// =========================================================================
export function getQuestionsForCategoryAndTopic(
  category: string,
  topic?: string,
  difficulty?: string,
  specificSlugOrTitle?: string,
  targetCount: number = 10
): GeneratedQuestion[] {
  const normCat = category.toUpperCase().trim();
  const isApt = normCat.includes('APTITUDE') || normCat.includes('QUANT') || normCat.includes('LOGIC') || normCat.includes('VERBAL');
  const isTech = normCat.includes('TECH') || normCat.includes('CORE') || normCat.includes('CS') || normCat.includes('DBMS') || normCat.includes('SYSTEM') || normCat.includes('OS');
  const isHr = normCat.includes('HR') || normCat.includes('BEHAVIOR');

  // Collect category pool
  const categoryPool: GeneratedQuestion[] = [];
  Object.entries(QUESTION_DATABASE).forEach(([tKey, qList]) => {
    if (isApt && qList[0]?.category === 'APTITUDE') categoryPool.push(...qList);
    else if (isTech && qList[0]?.category === 'TECHNICAL') categoryPool.push(...qList);
    else if (isHr && qList[0]?.category === 'HR') categoryPool.push(...qList);
  });

  // 1. Gather exact topic matches first
  let topicMatches: GeneratedQuestion[] = [];
  if (topic && QUESTION_DATABASE[topic]) {
    topicMatches = [...QUESTION_DATABASE[topic]];
  } else {
    topicMatches = categoryPool.filter(q =>
      topic ? q.topic.toLowerCase().includes(topic.toLowerCase()) : true
    );
  }

  // 2. Put specific requested question at top if provided
  if (specificSlugOrTitle) {
    const slugNorm = specificSlugOrTitle.toLowerCase().replace(/[-_]/g, ' ');
    const specificIdx = categoryPool.findIndex(q =>
      q.title.toLowerCase().includes(slugNorm) || q.id.toLowerCase().includes(slugNorm)
    );
    if (specificIdx >= 0) {
      const specificQ = categoryPool[specificIdx];
      topicMatches = [specificQ, ...topicMatches.filter(q => q.id !== specificQ.id)];
    }
  }

  // 3. Fill up to targetCount using other questions from the same category
  const result: GeneratedQuestion[] = [...topicMatches];
  for (const extra of categoryPool) {
    if (result.length >= targetCount) break;
    if (!result.some(q => q.id === extra.id || q.title === extra.title)) {
      result.push(extra);
    }
  }

  return result.slice(0, targetCount);
}
