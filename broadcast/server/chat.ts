/**
 * Chat between the director and the camera operators: a short in-memory history,
 * who is typing, and questions the director sends to some operators with answer
 * buttons (one tap instead of typing on a phone while filming).
 */

export type Question = {
  /** Who should answer. */
  to: string[];
  /** The answer buttons, e.g. ["Yes", "No"]. */
  options: string[];
  /** Answer per client that has answered; may be changed. */
  answers: Record<string, string>;
};

export type ChatMessage = { id: number; from: string; text: string; at: number; question?: Question };

const HISTORY = 200;
const MAX_LENGTH = 500;
const MAX_OPTIONS = 4;
const MAX_OPTION_LENGTH = 24;
/** A client that stops sending typing updates counts as no longer typing after this. */
const TYPING_TIMEOUT_MS = 4000;

type Options = {
  onMessage: (message: ChatMessage) => void;
  /** A message changed, e.g. a question got an answer. */
  onUpdate: (message: ChatMessage) => void;
  onTyping: (clients: string[]) => void;
};

export function createChat({ onMessage, onUpdate, onTyping }: Options) {
  const history: ChatMessage[] = [];
  const typing = new Map<string, Timer>();
  let nextId = 1;

  function setTyping(from: string, isTyping: boolean) {
    const wasTyping = typing.has(from);
    clearTimeout(typing.get(from));
    if (isTyping) typing.set(from, setTimeout(() => setTyping(from, false), TYPING_TIMEOUT_MS));
    else typing.delete(from);
    if (wasTyping !== isTyping) onTyping([...typing.keys()]);
  }

  /** Adds a message; returns an error message if it was rejected. */
  function add(from: string, raw: string, question?: Question): string | null {
    const text = raw.trim();
    if (!text) return "message is empty";
    if (text.length > MAX_LENGTH) return `message must be at most ${MAX_LENGTH} characters`;
    const message: ChatMessage = { id: nextId++, from, text, at: Date.now(), ...(question && { question }) };
    history.push(message);
    if (history.length > HISTORY) history.shift();
    setTyping(from, false);
    onMessage(message);
    return null;
  }

  return {
    history: () => history,
    typing: () => [...typing.keys()],
    setTyping,

    post: (from: string, text: string) => add(from, text),

    /** Sends `text` to `to` with answer buttons; returns an error message if it was rejected. */
    ask(from: string, text: string, to: string[], options: string[]): string | null {
      const buttons = options.map((option) => option.trim()).filter(Boolean);
      if (to.length === 0) return "choose who should answer";
      if (buttons.length === 0 || buttons.length > MAX_OPTIONS) return `give 1 to ${MAX_OPTIONS} answers`;
      if (buttons.some((option) => option.length > MAX_OPTION_LENGTH)) {
        return `answers must be at most ${MAX_OPTION_LENGTH} characters`;
      }
      return add(from, text, { to: [...new Set(to)], options: buttons, answers: {} });
    },

    /** Records `from`'s answer to question `id`; returns an error message if it was rejected. */
    answer(from: string, id: number, option: string): string | null {
      const message = history.find((candidate) => candidate.id === id);
      const question = message?.question;
      if (!message || !question) return "this question is no longer available";
      if (!question.to.includes(from)) return "this question isn't for you";
      if (!question.options.includes(option)) return `answer must be one of: ${question.options.join(", ")}`;
      question.answers[from] = option;
      onUpdate(message);
      return null;
    },
  };
}
