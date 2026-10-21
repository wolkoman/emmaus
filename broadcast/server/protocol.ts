/**
 * WebSocket messages between the server and its browser clients. Every message
 * is JSON with a `type`. The browser side is `public/overlay-client.js`.
 *
 * A client joins the chat by connecting to `/ws?client=<id>` (`director`,
 * `cam1` … `cam4`); without an id it only receives the state (overlays).
 */
import type { ChatMessage } from "./chat";
import type { Patch, State } from "./store";

/** Client → server. */
export type ClientMessage =
  /** Change fields of one section; the same as `GET /api/<section>/set?field=value`. */
  | { type: "set"; section: string; patch: Patch }
  /** Send a chat message (chat clients only). */
  | { type: "chat"; text: string }
  /** Ask some chat clients a question with answer buttons (director only). */
  | { type: "ask"; text: string; to: string[]; options: string[] }
  /** Answer a question addressed to this client; answering again changes the answer. */
  | { type: "answer"; id: number; option: string }
  /** Start or stop showing "… is typing" (chat clients only); expires by itself. */
  | { type: "typing"; typing: boolean }
  /** Start or stop receiving the program picture (chat clients only). */
  | { type: "programPicture"; enabled: boolean };

/** Server → client. */
export type ServerMessage =
  /** The complete state; sent on connect and after every change. */
  | { type: "state"; state: State }
  /** A message of this client was rejected. */
  | { type: "error"; error: string }
  /** The recent chat (to chat clients on connect). */
  | { type: "chatHistory"; messages: ChatMessage[] }
  /** A new chat message; questions carry a `question` with recipients, options and answers. */
  | { type: "chatMessage"; message: ChatMessage }
  /** A chat message changed (a question got an answer); replaces the one with the same id. */
  | { type: "chatUpdate"; message: ChatMessage }
  /** Who is typing right now. */
  | { type: "typing"; clients: string[] }
  /** A small snapshot of what is on air (JPEG data URL), about once a second while subscribed. */
  | { type: "programPicture"; image: string; at: number };

export function encode(message: ServerMessage) {
  return JSON.stringify(message);
}

/** Parses a client message; returns an error message if it isn't one. */
export function decode(raw: string): ClientMessage | string {
  let message: Record<string, unknown>;
  try {
    message = JSON.parse(raw) ?? {};
  } catch {
    return "invalid JSON";
  }
  switch (message.type) {
    case "set":
      if (typeof message.section === "string") return { type: "set", section: message.section, patch: message.patch as Patch };
      return 'expected {"type":"set","section":…,"patch":{…}}';
    case "chat":
      if (typeof message.text === "string") return { type: "chat", text: message.text };
      return 'expected {"type":"chat","text":…}';
    case "ask": {
      const { text, to, options } = message;
      const strings = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string");
      if (typeof text === "string" && strings(to) && strings(options)) {
        return { type: "ask", text, to: to as string[], options: options as string[] };
      }
      return 'expected {"type":"ask","text":…,"to":[…],"options":[…]}';
    }
    case "answer":
      if (typeof message.id === "number" && typeof message.option === "string") {
        return { type: "answer", id: message.id, option: message.option };
      }
      return 'expected {"type":"answer","id":…,"option":…}';
    case "typing":
      return { type: "typing", typing: message.typing === true };
    case "programPicture":
      return { type: "programPicture", enabled: message.enabled === true };
    default:
      return `unknown message type "${message.type}"`;
  }
}
