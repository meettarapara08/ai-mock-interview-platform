from django.core.management.base import BaseCommand
from coding.models import CodingProblem, CodingTestCase


PROBLEMS_DATA = [
    {
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "easy",
        "category": "Arrays & Hashing",
        "order": 1,
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. Print the indices separated by a space in ascending order.",
        "input_format": "The first line contains an integer N (number of elements) and target T separated by a space.\nThe second line contains N space-separated integers representing the array nums.",
        "output_format": "Print the two 0-based indices separated by a space.",
        "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
        "starter_code": {
            "python": "import sys\n\ndef two_sum(nums, target):\n    # Write your solution here\n    pass\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n, target = int(lines[0]), int(lines[1])\n    nums = [int(x) for x in lines[2:2+n]]\n    idx1, idx2 = two_sum(nums, target)\n    print(f\"{idx1} {idx2}\")\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{0, 1};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) {\n            nums[i] = sc.nextInt();\n        }\n        int[] ans = twoSum(nums, target);\n        System.out.println(ans[0] + \" \" + ans[1]);\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\npair<int, int> twoSum(const vector<int>& nums, int target) {\n    // Write your solution here\n    return {0, 1};\n}\n\nint main() {\n    int n, target;\n    if (!(cin >> n >> target)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    auto ans = twoSum(nums, target);\n    cout << ans.first << \" \" << ans.second << endl;\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "4 9\n2 7 11 15",
                "expected_output": "0 1",
                "is_sample": True,
                "explanation": "Because nums[0] + nums[1] == 9, we return 0 1.",
                "order": 1,
            },
            {
                "input_data": "3 6\n3 2 4",
                "expected_output": "1 2",
                "is_sample": True,
                "explanation": "nums[1] + nums[2] == 6, so we return 1 2.",
                "order": 2,
            },
            {
                "input_data": "2 6\n3 3",
                "expected_output": "0 1",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
            {
                "input_data": "5 10\n1 3 5 7 9",
                "expected_output": "1 3",
                "is_sample": False,
                "explanation": "",
                "order": 4,
            },
        ],
    },
    {
        "title": "Reverse String",
        "slug": "reverse-string",
        "difficulty": "easy",
        "category": "Strings",
        "order": 2,
        "description": "Write a function that reverses a given string. Print the reversed string on standard output.",
        "input_format": "A single line containing the string S.",
        "output_format": "The reversed string.",
        "constraints": "1 <= s.length <= 10^5\ns consists of printable ASCII characters.",
        "starter_code": {
            "python": "import sys\n\ndef reverse_string(s):\n    # Write your solution here\n    return s[::-1]\n\ndef main():\n    line = sys.stdin.read().strip()\n    print(reverse_string(line))\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static String reverseString(String s) {\n        // Write your solution here\n        return new StringBuilder(s).reverse().toString();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String s = sc.nextLine().trim();\n            System.out.println(reverseString(s));\n        }\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nstring reverseString(string s) {\n    // Write your solution here\n    reverse(s.begin(), s.end());\n    return s;\n}\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        cout << reverseString(s) << endl;\n    }\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "hello",
                "expected_output": "olleh",
                "is_sample": True,
                "explanation": "hello reversed is olleh.",
                "order": 1,
            },
            {
                "input_data": "InterviewIQ",
                "expected_output": "QIweivretnI",
                "is_sample": True,
                "explanation": "",
                "order": 2,
            },
            {
                "input_data": "a",
                "expected_output": "a",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
            {
                "input_data": "123456789",
                "expected_output": "987654321",
                "is_sample": False,
                "explanation": "",
                "order": 4,
            },
        ],
    },
    {
        "title": "Valid Palindrome",
        "slug": "valid-palindrome",
        "difficulty": "easy",
        "category": "Two Pointers",
        "order": 3,
        "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nPrint `true` if it is a palindrome, or `false` otherwise.",
        "input_format": "A single line containing string S.",
        "output_format": "Print 'true' or 'false'.",
        "constraints": "1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.",
        "starter_code": {
            "python": "import sys\n\ndef is_palindrome(s):\n    # Write your solution here\n    filtered = [c.lower() for c in s if c.isalnum()]\n    return filtered == filtered[::-1]\n\ndef main():\n    line = sys.stdin.read().strip()\n    print('true' if is_palindrome(line) else 'false')\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static boolean isPalindrome(String s) {\n        // Write your solution here\n        int l = 0, r = s.length() - 1;\n        while (l < r) {\n            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;\n            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;\n            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;\n            l++; r--;\n        }\n        return true;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : \"\";\n        System.out.println(isPalindrome(s) ? \"true\" : \"false\");\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nbool isPalindrome(const string& s) {\n    // Write your solution here\n    int l = 0, r = (int)s.length() - 1;\n    while (l < r) {\n        while (l < r && !isalnum((unsigned char)s[l])) l++;\n        while (l < r && !isalnum((unsigned char)s[r])) r--;\n        if (tolower((unsigned char)s[l]) != tolower((unsigned char)s[r])) return false;\n        l++; r--;\n    }\n    return true;\n}\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        cout << (isPalindrome(s) ? \"true\" : \"false\") << endl;\n    }\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "A man, a plan, a canal: Panama",
                "expected_output": "true",
                "is_sample": True,
                "explanation": "\"amanaplanacanalpanama\" is a palindrome.",
                "order": 1,
            },
            {
                "input_data": "race a car",
                "expected_output": "false",
                "is_sample": True,
                "explanation": "\"raceacar\" is not a palindrome.",
                "order": 2,
            },
            {
                "input_data": " ",
                "expected_output": "true",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
            {
                "input_data": "0P",
                "expected_output": "false",
                "is_sample": False,
                "explanation": "",
                "order": 4,
            },
        ],
    },
    {
        "title": "Contains Duplicate",
        "slug": "contains-duplicate",
        "difficulty": "easy",
        "category": "Arrays & Hashing",
        "order": 4,
        "description": "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
        "input_format": "The first line contains N (number of elements).\nThe second line contains N space-separated integers.",
        "output_format": "Print 'true' or 'false'.",
        "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
        "starter_code": {
            "python": "import sys\n\ndef contains_duplicate(nums):\n    # Write your solution here\n    return len(nums) != len(set(nums))\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:1+n]]\n    print('true' if contains_duplicate(nums) else 'false')\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static boolean containsDuplicate(int[] nums) {\n        // Write your solution here\n        Set<Integer> set = new HashSet<>();\n        for (int x : nums) {\n            if (!set.add(x)) return true;\n        }\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        System.out.println(containsDuplicate(nums) ? \"true\" : \"false\");\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nbool containsDuplicate(const vector<int>& nums) {\n    // Write your solution here\n    unordered_set<int> seen;\n    for (int x : nums) {\n        if (seen.count(x)) return true;\n        seen.insert(x);\n    }\n    return false;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    cout << (containsDuplicate(nums) ? \"true\" : \"false\") << endl;\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "4\n1 2 3 1",
                "expected_output": "true",
                "is_sample": True,
                "explanation": "1 appears twice.",
                "order": 1,
            },
            {
                "input_data": "4\n1 2 3 4",
                "expected_output": "false",
                "is_sample": True,
                "explanation": "All elements are distinct.",
                "order": 2,
            },
            {
                "input_data": "10\n1 1 1 3 3 4 3 2 4 2",
                "expected_output": "true",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
        ],
    },
    {
        "title": "Fizz Buzz",
        "slug": "fizz-buzz",
        "difficulty": "easy",
        "category": "Math",
        "order": 5,
        "description": "Given an integer `n`, return a string array answer (1-indexed) where:\n- `answer[i] == \"FizzBuzz\"` if `i` is divisible by 3 and 5.\n- `answer[i] == \"Fizz\"` if `i` is divisible by 3.\n- `answer[i] == \"Buzz\"` if `i` is divisible by 5.\n- `answer[i] == i` (as a string) if none of the above conditions are true.\n\nPrint each answer on a new line.",
        "input_format": "A single integer N.",
        "output_format": "N lines representing the FizzBuzz sequence from 1 to N.",
        "constraints": "1 <= n <= 10^4",
        "starter_code": {
            "python": "import sys\n\ndef fizz_buzz(n):\n    # Write your solution here\n    res = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            res.append('FizzBuzz')\n        elif i % 3 == 0:\n            res.append('Fizz')\n        elif i % 5 == 0:\n            res.append('Buzz')\n        else:\n            res.append(str(i))\n    return res\n\ndef main():\n    line = sys.stdin.read().strip()\n    if line:\n        n = int(line)\n        for item in fizz_buzz(n):\n            print(item)\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        for (int i = 1; i <= n; i++) {\n            if (i % 15 == 0) System.out.println(\"FizzBuzz\");\n            else if (i % 3 == 0) System.out.println(\"Fizz\");\n            else if (i % 5 == 0) System.out.println(\"Buzz\");\n            else System.out.println(i);\n        }\n    }\n}\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    if (cin >> n) {\n        for (int i = 1; i <= n; i++) {\n            if (i % 15 == 0) cout << \"FizzBuzz\\n\";\n            else if (i % 3 == 0) cout << \"Fizz\\n\";\n            else if (i % 5 == 0) cout << \"Buzz\\n\";\n            else cout << i << \"\\n\";\n        }\n    }\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "3",
                "expected_output": "1\n2\nFizz",
                "is_sample": True,
                "explanation": "3 is divisible by 3 -> Fizz.",
                "order": 1,
            },
            {
                "input_data": "5",
                "expected_output": "1\n2\nFizz\n4\nBuzz",
                "is_sample": True,
                "explanation": "",
                "order": 2,
            },
            {
                "input_data": "15",
                "expected_output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
        ],
    },
    {
        "title": "Maximum Subarray",
        "slug": "maximum-subarray",
        "difficulty": "medium",
        "category": "Dynamic Programming",
        "order": 6,
        "description": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum (Kadane's algorithm).",
        "input_format": "The first line contains N (number of elements).\nThe second line contains N space-separated integers.",
        "output_format": "Print the maximum subarray sum.",
        "constraints": "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
        "starter_code": {
            "python": "import sys\n\ndef max_subarray(nums):\n    # Write your solution here\n    max_sum = cur_sum = nums[0]\n    for x in nums[1:]:\n        cur_sum = max(x, cur_sum + x)\n        max_sum = max(max_sum, cur_sum)\n    return max_sum\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:1+n]]\n    print(max_subarray(nums))\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static int maxSubArray(int[] nums) {\n        // Write your solution here\n        int maxSum = nums[0], curSum = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            curSum = Math.max(nums[i], curSum + nums[i]);\n            maxSum = Math.max(maxSum, curSum);\n        }\n        return maxSum;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        System.out.println(maxSubArray(nums));\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint maxSubArray(const vector<int>& nums) {\n    // Write your solution here\n    int maxSum = nums[0], curSum = nums[0];\n    for (size_t i = 1; i < nums.size(); i++) {\n        curSum = max(nums[i], curSum + nums[i]);\n        maxSum = max(maxSum, curSum);\n    }\n    return maxSum;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    cout << maxSubArray(nums) << endl;\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "9\n-2 1 -3 4 -1 2 1 -5 4",
                "expected_output": "6",
                "is_sample": True,
                "explanation": "The subarray [4,-1,2,1] has the largest sum 6.",
                "order": 1,
            },
            {
                "input_data": "1\n1",
                "expected_output": "1",
                "is_sample": True,
                "explanation": "Subarray [1] has sum 1.",
                "order": 2,
            },
            {
                "input_data": "5\n5 4 -1 7 8",
                "expected_output": "23",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
            {
                "input_data": "3\n-3 -2 -1",
                "expected_output": "-1",
                "is_sample": False,
                "explanation": "",
                "order": 4,
            },
        ],
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "slug": "longest-substring-without-repeating-characters",
        "difficulty": "medium",
        "category": "Sliding Window",
        "order": 7,
        "description": "Given a string `s`, find the length of the longest substring without duplicate characters.",
        "input_format": "A single line containing string S.",
        "output_format": "An integer representing the maximum length.",
        "constraints": "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
        "starter_code": {
            "python": "import sys\n\ndef length_of_longest_substring(s):\n    # Write your solution here\n    seen = {}\n    max_len = start = 0\n    for i, char in enumerate(s):\n        if char in seen and seen[char] >= start:\n            start = seen[char] + 1\n        seen[char] = i\n        max_len = max(max_len, i - start + 1)\n    return max_len\n\ndef main():\n    line = sys.stdin.read().rstrip('\\n\\r')\n    print(length_of_longest_substring(line))\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        Map<Character, Integer> seen = new HashMap<>();\n        int maxLen = 0, start = 0;\n        for (int i = 0; i < s.length(); i++) {\n            char c = s.charAt(i);\n            if (seen.containsKey(c) && seen.get(c) >= start) {\n                start = seen.get(c) + 1;\n            }\n            seen.put(c, i);\n            maxLen = Math.max(maxLen, i - start + 1);\n        }\n        return maxLen;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : \"\";\n        System.out.println(lengthOfLongestSubstring(s));\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nint lengthOfLongestSubstring(const string& s) {\n    // Write your solution here\n    unordered_map<char, int> seen;\n    int maxLen = 0, start = 0;\n    for (int i = 0; i < (int)s.size(); i++) {\n        char c = s[i];\n        if (seen.count(c) && seen[c] >= start) {\n            start = seen[c] + 1;\n        }\n        seen[c] = i;\n        maxLen = max(maxLen, i - start + 1);\n    }\n    return maxLen;\n}\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        cout << lengthOfLongestSubstring(s) << endl;\n    } else {\n        cout << 0 << endl;\n    }\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "abcabcbb",
                "expected_output": "3",
                "is_sample": True,
                "explanation": "The answer is \"abc\", with the length of 3.",
                "order": 1,
            },
            {
                "input_data": "bbbbb",
                "expected_output": "1",
                "is_sample": True,
                "explanation": "The answer is \"b\", with length 1.",
                "order": 2,
            },
            {
                "input_data": "pwwkew",
                "expected_output": "3",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
            {
                "input_data": "",
                "expected_output": "0",
                "is_sample": False,
                "explanation": "",
                "order": 4,
            },
        ],
    },
    {
        "title": "3Sum",
        "slug": "3sum",
        "difficulty": "medium",
        "category": "Two Pointers",
        "order": 8,
        "description": "Given an integer array `nums`, return the number of distinct triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.",
        "input_format": "The first line contains N (number of elements).\nThe second line contains N space-separated integers.",
        "output_format": "Print the number of unique triplets that sum to 0.",
        "constraints": "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
        "starter_code": {
            "python": "import sys\n\ndef three_sum_count(nums):\n    # Write your solution here\n    nums.sort()\n    count = 0\n    n = len(nums)\n    for i in range(n - 2):\n        if i > 0 and nums[i] == nums[i - 1]:\n            continue\n        l, r = i + 1, n - 1\n        while l < r:\n            s = nums[i] + nums[l] + nums[r]\n            if s == 0:\n                count += 1\n                l += 1\n                r -= 1\n                while l < r and nums[l] == nums[l - 1]:\n                    l += 1\n                while l < r and nums[r] == nums[r + 1]:\n                    r -= 1\n            elif s < 0:\n                l += 1\n            else:\n                r -= 1\n    return count\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:1+n]]\n    print(three_sum_count(nums))\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static int threeSumCount(int[] nums) {\n        Arrays.sort(nums);\n        int count = 0, n = nums.length;\n        for (int i = 0; i < n - 2; i++) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            int l = i + 1, r = n - 1;\n            while (l < r) {\n                int s = nums[i] + nums[l] + nums[r];\n                if (s == 0) {\n                    count++;\n                    l++; r--;\n                    while (l < r && nums[l] == nums[l - 1]) l++;\n                    while (l < r && nums[r] == nums[r + 1]) r--;\n                } else if (s < 0) l++;\n                else r--;\n            }\n        }\n        return count;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        System.out.println(threeSumCount(nums));\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint threeSumCount(vector<int>& nums) {\n    sort(nums.begin(), nums.end());\n    int count = 0, n = nums.size();\n    for (int i = 0; i < n - 2; i++) {\n        if (i > 0 && nums[i] == nums[i - 1]) continue;\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            int s = nums[i] + nums[l] + nums[r];\n            if (s == 0) {\n                count++;\n                l++; r--;\n                while (l < r && nums[l] == nums[l - 1]) l++;\n                while (l < r && nums[r] == nums[r + 1]) r--;\n            } else if (s < 0) l++;\n            else r--;\n        }\n    }\n    return count;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    cout << threeSumCount(nums) << endl;\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "6\n-1 0 1 2 -1 -4",
                "expected_output": "2",
                "is_sample": True,
                "explanation": "Triplets are [-1,-1,2] and [-1,0,1]. Total 2.",
                "order": 1,
            },
            {
                "input_data": "3\n0 1 1",
                "expected_output": "0",
                "is_sample": True,
                "explanation": "No triplets sum to 0.",
                "order": 2,
            },
            {
                "input_data": "3\n0 0 0",
                "expected_output": "1",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
        ],
    },
    {
        "title": "Container With Most Water",
        "slug": "container-with-most-water",
        "difficulty": "medium",
        "category": "Two Pointers",
        "order": 9,
        "description": "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water. Print the maximum amount of water a container can store.",
        "input_format": "The first line contains N (number of vertical lines).\nThe second line contains N space-separated integers representing heights.",
        "output_format": "Print the maximum water area.",
        "constraints": "n >= 2\n0 <= height[i] <= 10^4",
        "starter_code": {
            "python": "import sys\n\ndef max_area(height):\n    # Write your solution here\n    l, r = 0, len(height) - 1\n    ans = 0\n    while l < r:\n        h = min(height[l], height[r])\n        ans = max(ans, h * (r - l))\n        if height[l] < height[r]:\n            l += 1\n        else:\n            r -= 1\n    return ans\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    height = [int(x) for x in lines[1:1+n]]\n    print(max_area(height))\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static int maxArea(int[] height) {\n        int l = 0, r = height.length - 1, ans = 0;\n        while (l < r) {\n            int h = Math.min(height[l], height[r]);\n            ans = Math.max(ans, h * (r - l));\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return ans;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] height = new int[n];\n        for (int i = 0; i < n; i++) height[i] = sc.nextInt();\n        System.out.println(maxArea(height));\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint maxArea(const vector<int>& height) {\n    int l = 0, r = (int)height.size() - 1, ans = 0;\n    while (l < r) {\n        int h = min(height[l], height[r]);\n        ans = max(ans, h * (r - l));\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return ans;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> height(n);\n    for (int i = 0; i < n; i++) cin >> height[i];\n    cout << maxArea(height) << endl;\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "9\n1 8 6 2 5 4 8 3 7",
                "expected_output": "49",
                "is_sample": True,
                "explanation": "Max area is formed between index 1 (height 8) and index 8 (height 7): min(8,7)*(8-1) = 49.",
                "order": 1,
            },
            {
                "input_data": "2\n1 1",
                "expected_output": "1",
                "is_sample": True,
                "explanation": "1 * 1 = 1.",
                "order": 2,
            },
            {
                "input_data": "5\n4 3 2 1 4",
                "expected_output": "16",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
        ],
    },
    {
        "title": "String to Integer (atoi)",
        "slug": "string-to-integer-atoi",
        "difficulty": "medium",
        "category": "Strings",
        "order": 10,
        "description": "Implement the `myAtoi(string s)` function, which converts a string to a 32-bit signed integer.\n\nRules:\n1. Ignore any leading whitespace.\n2. Check if the next character is '-' or '+'.\n3. Read digits until a non-digit character or end of input.\n4. Clamp the integer within 32-bit signed range [-2^31, 2^31 - 1].",
        "input_format": "A single line of text.",
        "output_format": "Print the parsed 32-bit signed integer.",
        "constraints": "0 <= s.length <= 200",
        "starter_code": {
            "python": "import sys\n\ndef my_atoi(s):\n    # Write your solution here\n    s = s.lstrip()\n    if not s:\n        return 0\n    sign = 1\n    i = 0\n    if s[0] == '-':\n        sign = -1\n        i = 1\n    elif s[0] == '+':\n        i = 1\n    res = 0\n    while i < len(s) and s[i].isdigit():\n        res = res * 10 + int(s[i])\n        i += 1\n    res = sign * res\n    INT_MAX = 2**31 - 1\n    INT_MIN = -2**31\n    return max(INT_MIN, min(INT_MAX, res))\n\ndef main():\n    line = sys.stdin.read().rstrip('\\n\\r')\n    print(my_atoi(line))\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static int myAtoi(String s) {\n        s = s.trim();\n        if (s.isEmpty()) return 0;\n        int sign = 1, i = 0;\n        if (s.charAt(0) == '-') { sign = -1; i = 1; }\n        else if (s.charAt(0) == '+') { i = 1; }\n        long res = 0;\n        while (i < s.length() && Character.isDigit(s.charAt(i))) {\n            res = res * 10 + (s.charAt(i) - '0');\n            if (sign == 1 && res > Integer.MAX_VALUE) return Integer.MAX_VALUE;\n            if (sign == -1 && -res < Integer.MIN_VALUE) return Integer.MIN_VALUE;\n            i++;\n        }\n        return (int)(sign * res);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : \"\";\n        System.out.println(myAtoi(s));\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <string>\n#include <climits>\nusing namespace std;\n\nint myAtoi(string s) {\n    int i = 0, n = s.size();\n    while (i < n && s[i] == ' ') i++;\n    if (i == n) return 0;\n    int sign = 1;\n    if (s[i] == '-') { sign = -1; i++; }\n    else if (s[i] == '+') { i++; }\n    long long res = 0;\n    while (i < n && isdigit(s[i])) {\n        res = res * 10 + (s[i] - '0');\n        if (sign == 1 && res > INT_MAX) return INT_MAX;\n        if (sign == -1 && -res < INT_MIN) return INT_MIN;\n        i++;\n    }\n    return sign * res;\n}\n\nint main() {\n    string s;\n    if (getline(cin, s)) cout << myAtoi(s) << endl;\n    else cout << 0 << endl;\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "42",
                "expected_output": "42",
                "is_sample": True,
                "explanation": "Parsed 42.",
                "order": 1,
            },
            {
                "input_data": "   -042",
                "expected_output": "-42",
                "is_sample": True,
                "explanation": "Leading spaces ignored, negative parsed.",
                "order": 2,
            },
            {
                "input_data": "1337c0d3",
                "expected_output": "1337",
                "is_sample": False,
                "explanation": "Stops reading at 'c'.",
                "order": 3,
            },
            {
                "input_data": "-91283472332",
                "expected_output": "-2147483648",
                "is_sample": False,
                "explanation": "Clamped to INT_MIN.",
                "order": 4,
            },
        ],
    },
    {
        "title": "Trapping Rain Water",
        "slug": "trapping-rain-water",
        "difficulty": "hard",
        "category": "Two Pointers",
        "order": 11,
        "description": "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
        "input_format": "The first line contains N (number of bars).\nThe second line contains N space-separated non-negative integers.",
        "output_format": "Print the total units of trapped rain water.",
        "constraints": "n >= 1\n0 <= height[i] <= 10^5",
        "starter_code": {
            "python": "import sys\n\ndef trap(height):\n    # Write your solution here\n    if not height:\n        return 0\n    l, r = 0, len(height) - 1\n    left_max, right_max = height[l], height[r]\n    water = 0\n    while l < r:\n        if left_max < right_max:\n            l += 1\n            left_max = max(left_max, height[l])\n            water += left_max - height[l]\n        else:\n            r -= 1\n            right_max = max(right_max, height[r])\n            water += right_max - height[r]\n    return water\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    height = [int(x) for x in lines[1:1+n]]\n    print(trap(height))\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static int trap(int[] height) {\n        if (height.length == 0) return 0;\n        int l = 0, r = height.length - 1;\n        int leftMax = height[l], rightMax = height[r], water = 0;\n        while (l < r) {\n            if (leftMax < rightMax) {\n                l++;\n                leftMax = Math.max(leftMax, height[l]);\n                water += leftMax - height[l];\n            } else {\n                r--;\n                rightMax = Math.max(rightMax, height[r]);\n                water += rightMax - height[r];\n            }\n        }\n        return water;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] height = new int[n];\n        for (int i = 0; i < n; i++) height[i] = sc.nextInt();\n        System.out.println(trap(height));\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint trap(const vector<int>& height) {\n    if (height.empty()) return 0;\n    int l = 0, r = (int)height.size() - 1;\n    int leftMax = height[l], rightMax = height[r], water = 0;\n    while (l < r) {\n        if (leftMax < rightMax) {\n            l++;\n            leftMax = max(leftMax, height[l]);\n            water += leftMax - height[l];\n        } else {\n            r--;\n            rightMax = max(rightMax, height[r]);\n            water += rightMax - height[r];\n        }\n    }\n    return water;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> height(n);\n    for (int i = 0; i < n; i++) cin >> height[i];\n    cout << trap(height) << endl;\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "12\n0 1 0 2 1 0 1 3 2 1 2 1",
                "expected_output": "6",
                "is_sample": True,
                "explanation": "6 units of rain water are trapped.",
                "order": 1,
            },
            {
                "input_data": "6\n4 2 0 3 2 5",
                "expected_output": "9",
                "is_sample": True,
                "explanation": "9 units of rain water are trapped.",
                "order": 2,
            },
            {
                "input_data": "3\n3 0 3",
                "expected_output": "3",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
        ],
    },
    {
        "title": "Median of Two Sorted Arrays",
        "slug": "median-of-two-sorted-arrays",
        "difficulty": "hard",
        "category": "Binary Search",
        "order": 12,
        "description": "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.\n\nPrint the median formatted to 1 decimal place (e.g. 2.0 or 2.5).",
        "input_format": "The first line contains M and N.\nThe second line contains M space-separated integers for nums1.\nThe third line contains N space-separated integers for nums2.",
        "output_format": "Print the median formatted as a float with 1 decimal place.",
        "constraints": "nums1.length == m\nnums2.length == n\n0 <= m <= 1000\n0 <= n <= 1000\n1 <= m + n <= 2000",
        "starter_code": {
            "python": "import sys\n\ndef find_median_sorted_arrays(nums1, nums2):\n    # Write your solution here\n    merged = sorted(nums1 + nums2)\n    k = len(merged)\n    if k % 2 == 1:\n        return float(merged[k // 2])\n    else:\n        return (merged[k // 2 - 1] + merged[k // 2]) / 2.0\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    m, n = int(lines[0]), int(lines[1])\n    nums1 = [int(x) for x in lines[2:2+m]]\n    nums2 = [int(x) for x in lines[2+m:2+m+n]]\n    med = find_median_sorted_arrays(nums1, nums2)\n    print(f\"{med:.1f}\")\n\nif __name__ == '__main__':\n    main()\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        int[] merged = new int[nums1.length + nums2.length];\n        System.arraycopy(nums1, 0, merged, 0, nums1.length);\n        System.arraycopy(nums2, 0, merged, nums1.length, nums2.length);\n        Arrays.sort(merged);\n        int k = merged.length;\n        if (k % 2 == 1) return merged[k / 2];\n        return (merged[k / 2 - 1] + merged[k / 2]) / 2.0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int m = sc.nextInt();\n        int n = sc.nextInt();\n        int[] a = new int[m];\n        for (int i = 0; i < m; i++) a[i] = sc.nextInt();\n        int[] b = new int[n];\n        for (int i = 0; i < n; i++) b[i] = sc.nextInt();\n        double med = findMedianSortedArrays(a, b);\n        System.out.printf(Locale.US, \"%.1f\\n\", med);\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <iomanip>\nusing namespace std;\n\ndouble findMedianSortedArrays(vector<int>& a, vector<int>& b) {\n    vector<int> merged = a;\n    merged.insert(merged.end(), b.begin(), b.end());\n    sort(merged.begin(), merged.end());\n    int k = merged.size();\n    if (k % 2 == 1) return merged[k / 2];\n    return (merged[k / 2 - 1] + merged[k / 2]) / 2.0;\n}\n\nint main() {\n    int m, n;\n    if (!(cin >> m >> n)) return 0;\n    vector<int> a(m), b(n);\n    for (int i = 0; i < m; i++) cin >> a[i];\n    for (int i = 0; i < n; i++) cin >> b[i];\n    cout << fixed << setprecision(1) << findMedianSortedArrays(a, b) << endl;\n    return 0;\n}\n"
        },
        "test_cases": [
            {
                "input_data": "2 1\n1 3\n2",
                "expected_output": "2.0",
                "is_sample": True,
                "explanation": "Merged array = [1,2,3], median is 2.0.",
                "order": 1,
            },
            {
                "input_data": "2 2\n1 2\n3 4",
                "expected_output": "2.5",
                "is_sample": True,
                "explanation": "Merged array = [1,2,3,4], median is (2+3)/2 = 2.5.",
                "order": 2,
            },
            {
                "input_data": "0 1\n\n1",
                "expected_output": "1.0",
                "is_sample": False,
                "explanation": "",
                "order": 3,
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seeds the database with 12 canonical coding problems across Easy, Medium, and Hard."

    def handle(self, *args, **options):
        self.stdout.write("Seeding coding problems...")
        created_count = 0
        updated_count = 0

        for p_data in PROBLEMS_DATA:
            test_cases = p_data.pop("test_cases", [])
            problem, created = CodingProblem.objects.update_or_create(
                slug=p_data["slug"],
                defaults=p_data,
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

            # Delete old test cases and recreate cleanly
            problem.test_cases.all().delete()
            for tc in test_cases:
                CodingTestCase.objects.create(
                    problem=problem,
                    input_data=tc["input_data"],
                    expected_output=tc["expected_output"],
                    is_sample=tc.get("is_sample", False),
                    explanation=tc.get("explanation", ""),
                    order=tc.get("order", 0),
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded coding problems! Created: {created_count}, Updated: {updated_count}. Total: {len(PROBLEMS_DATA)}"
            )
        )
