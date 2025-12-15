export enum ProblemType {
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
}

export interface MathProblem {
  id: string;
  num1: number;
  num2: number;
  type: ProblemType;
  answer: number;
  // For pedagogical breakdown
  // e.g., 8 + 5. 
  // splitPart1: 2 (to make 10)
  // splitPart2: 3 (remainder)
  splitPart1: number;
  splitPart2: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export enum Step {
  MAKE_TEN = 'MAKE_TEN', // How many to get to 10?
  ADD_REMAINDER = 'ADD_REMAINDER', // How many left?
  FINAL_ANSWER = 'FINAL_ANSWER', // Total?
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}