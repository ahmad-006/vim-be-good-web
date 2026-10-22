import type { Difficulty } from "../types/game";

export const DIFFICULTY_TIME_MAP: Record<Difficulty, number> = {
  noob: 100000,
  easy: 10000,
  medium: 8000,
  hard: 6000,
  nightmare: 4000,
  tpope: 2000,
};

export const DIFFICULTY_LIST: Difficulty[] = [
  "noob",
  "easy",
  "medium",
  "hard",
  "nightmare",
  "tpope",
];

export const EXTRA_SENTENCES = [
  "One is the best Prime Number",
  "If one is the best prime number then actually eleven is because it is two ones",
  "Brandon is the best One",
  "Jason is the best Eleven",
  "Who in the hell broke into my house and absconded with my coconut oil?",
  "VS code is for dinks and weiners",
  "I Twitch when I think about the Discord",
  "YouTube comment sections are almost always encouraging and uplifting",
  "Practice vim to be smothered and covered in coconut oil",
  "My dog is also my dawg",
  "In Russia car drive you",
  "I am more of a Thelma than a Louise",
  "Why are not there more coconut oil here?",
  "The internet is an amazing place full of interesting facts",
  "Did you know the internet crosses continental boundaries using a wire?!",
  "Keep calm and colon double you queue",
  "The cheese is old and moldy where is the bathroom?",
  "I cannot stop using Harry Potter similes please help",
  "Coconut oil is to oils what neovim is to text editors",
  "Where did you put my coconut oil Jalyssa?",
  "It is easier to win the world series if you cheat",
  "Do you even cargo tho?",
  "Don't order hashbrowns unless they are both smothered and covered",
  "Get my wife's name out of your mouth sir",
  "Hail to the Thief is the best Radiohead record and it is not close",
  "Actually I guess Kid A and Ok Computer have a case here",
  "There's a snake in my boot",
  "I am out of interesting facts to type here",
  "Teenage Dirtbag by Wheatus is an underappreciated song",
  "Others should contribute more sentences to be used in the game",
];

export const EXTRA_WORDS = [
  "aar",
  "bar",
  "car",
  "dar",
  "ear",
  "far",
  "gar",
  "har",
  "iar",
  "jar",
  "kar",
  "lar",
  "mar",
  "nar",
  "oar",
  "par",
  "qar",
  "rar",
  "sar",
  "tar",
  "uar",
  "var",
  "war",
  "xar",
  "yar",
  "zar",
];

export function getRandomSentence(): string {
  return EXTRA_SENTENCES[Math.floor(Math.random() * EXTRA_SENTENCES.length)];
}

export function getRandomWord(): string {
  return EXTRA_WORDS[Math.floor(Math.random() * EXTRA_WORDS.length)];
}

export function createEmptyLines(count: number): string[] {
  return Array.from({ length: count }, () => "");
}

export function trimLines(lines: string[]): string[] {
  return lines.map((l) => l.trim());
}

export function filterEmptyLines(lines: string[]): string[] {
  return lines.filter((l) => l.trim() !== "");
}
