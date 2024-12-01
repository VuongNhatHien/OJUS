export interface UserInterface {
  user_id: number;
  email: string;
  full_name: string;
  username: string;
}

export interface ContributionInterface {
  problemId: number;
  title: string;
  description: string;
  isActive: boolean;
  difficulty: number;
  tags: string;
  timeLimit: number;
  memoryLimit: number;
}

export interface ResponseInterface {
  name: string;
  message: string;
}

export interface GetAllContributionInterface extends ResponseInterface {
  data: {
    contributions: ContributionInterface[];
  };
}

export interface ProblemInterface {
  problemId: number;
  title: string;
  description: string;
  status: number;
  userStatus: boolean;
  difficulty: number;
  tags: string;
  timeLimit: number;
  memoryLimit: number;
  authorId: number;
  fileId: number;
}

export interface GetAllProblemsInterface extends ResponseInterface {
  data: {
    problems: ProblemInterface[];
  };
}
