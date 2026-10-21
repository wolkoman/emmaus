// WebSocket client shared by all pages; reconnects forever. Messages: server/protocol.ts.
//
//   const connection = connect({
//     client: "cam1", // optional: join the chat as this id
//     on: { state: ({ state }) => …, chatMessage: ({ message }) => … }, // one handler per message type
//     onStatus: (connected) => …,
//   });
//   connection.set("live", { mode: "on" });

export function connect({ client, on = {}, onStatus = () => {} }) {
  const query = client ? `?client=${encodeURIComponent(client)}` : "";
  const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws${query}`;
  const handlers = { error: ({ error }) => console.warn("server:", error), ...on };
  let ws;

  function open() {
    ws = new WebSocket(url);
    ws.onopen = () => onStatus(true);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handlers[message.type]?.(message);
    };
    ws.onclose = () => {
      onStatus(false);
      setTimeout(open, 1000);
    };
  }

  function send(message) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
    else handlers.error({ error: "not connected to the server" });
  }

  open();

  return {
    /** Changes fields of one state section. */
    set: (section, patch) => send({ type: "set", section, patch }),
    chat: (text) => send({ type: "chat", text }),
    ask: (text, to, options) => send({ type: "ask", text, to, options }),
    answer: (id, option) => send({ type: "answer", id, option }),
    typing: (typing) => send({ type: "typing", typing }),
    /** Subscriptions don't survive a reconnect: call this again from onStatus(true). */
    programPicture: (enabled) => send({ type: "programPicture", enabled }),
  };
}
