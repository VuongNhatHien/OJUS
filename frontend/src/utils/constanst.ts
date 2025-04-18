export const storageKeyMap = {
  token: "token",
};

export const difficultyMapping: Record<number, string> = {
  1: "Bronze",
  2: "Platinum",
  3: "Master",
};

export interface Tag {
  label: string;
  selected: boolean;
}

export const TagListInit: Tag[] = [
  { label: "Array", selected: false },
  { label: "String", selected: false },
  { label: "Hash Table", selected: false },
  { label: "Dynamic Programming", selected: false },
  { label: "Math", selected: false },
  { label: "Sorting", selected: false },
  { label: "Greedy", selected: false },
  { label: "Depth-First Search", selected: false },
  { label: "Database", selected: false },
  { label: "Binary Search", selected: false },
  { label: "Matrix", selected: false },
  { label: "Tree", selected: false },
  { label: "Breadth-First Search", selected: false },
];

export const LanguageList = ["C++", "C", "Java", "Python", "Javascript"];

export const language_FE_to_BE_map: Record<string, string> = {
  Python: "py",
  "C++": "cpp",
  C: "c",
  Java: "java",
  Javascript: "js",
};

export const language_BE_to_FE_map: Record<string, string> = {
  py: "Python",
  cpp: "C++",
  c: "C",
  java: "Java",
  js: "Javascript",
};

export const languageEditorMap: Record<string, string> = {
  Python: "python",
  "C++": "cpp",
  C: "c",
  Java: "java",
  Javascript: "javascript",
};

export const verdict = {
  AC: "Accepted",
  WA: "Wrong answer",
  TLE: "Time limit exceeded",
  RE: "Runtime error",
  CE: "Compile error",
};

export const verdictMap: Record<string, string> = {
  OK: verdict.AC,
  WRONG_ANSWER: verdict.WA,
  TIME_LIMIT_EXCEEDED: verdict.TLE,
  RUNTIME_ERROR: verdict.RE,
  COMPILE_ERROR: verdict.CE,
};
