// Chat panel for the control page and the camera pages: messages, input, "… is typing".
//
//   const chat = mountChat(element, { me: "cam1", clients, connection, aliasOf, onMention, onQuestion, onChange });
//   (`clients()` returns everyone in the chat, for @-completion; `actions` are extra buttons next to Send)
//   then feed it the server's messages:
//     chatHistory → chat.setMessages(messages)   chatMessage → chat.add(message)
//     chatUpdate  → chat.update(message)         typing      → chat.setTyping(clients)
//     state       → chat.refresh()  (names may change)

const TYPING_RESEND_MS = 2000; // the server forgets "typing" after 4 s without an update

const style = document.createElement("style");
style.textContent = `
  .chat { display: flex; flex-direction: column; min-height: 0; }
  .chat-messages { flex: 1; overflow-y: auto; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .chat-messages li { padding: 8px 12px; border-radius: 10px; background: #23272d; max-width: 85%; }
  .chat-messages li.mine { align-self: flex-end; background: #1f3b5a; }
  .chat-messages li.tagged { outline: 2px solid #f5a623; }
  .chat-meta { display: block; font-size: 12px; color: #9aa0a8; margin-bottom: 2px; }
  .chat-meta b { color: #e8e8ea; }
  .chat-messages p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  .chat-messages p strong { color: #f5a623; }
  .chat-question { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px; }
  .chat-question span { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: #33383f; color: #9aa0a8; overflow-wrap: anywhere; }
  .chat-question span.answered { background: #24543a; color: #e8e8ea; }
  .chat-question button { font: inherit; font-size: 13px; padding: 4px 10px; border-radius: 6px; border: 1px solid #3a3f46; background: #2a2e34; color: inherit; }
  .chat-question button.chosen { background: #24543a; border-color: #2f7a52; }
  .chat-typing { min-height: 20px; font-size: 13px; color: #9aa0a8; padding: 4px 2px; }
  .chat-form { display: flex; gap: 8px; position: relative; }
  .chat-suggest { position: absolute; left: 0; right: 0; bottom: calc(100% + 6px); margin: 0; padding: 4px; list-style: none; background: #23272d; border: 1px solid #3a3f46; border-radius: 8px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.4); }
  .chat-suggest li { padding: 8px 10px; border-radius: 6px; cursor: pointer; }
  .chat-suggest li[aria-selected="true"] { background: #1f3b5a; }
  .chat-suggest small { margin-left: 8px; color: #9aa0a8; }
  .chat-form input { flex: 1; min-width: 0; font: inherit; font-size: 16px; padding: 10px 12px; border-radius: 8px; border: 1px solid #3a3f46; background: #16181c; color: inherit; }
  .chat-form button { font: inherit; padding: 10px 16px; border-radius: 8px; border: 1px solid #3a3f46; background: #2a2e34; color: inherit; }
`;
document.head.append(style);

export function mountChat(
  root,
  { me, clients, connection, aliasOf, actions = [], onMention = () => {}, onQuestion = () => {}, onChange = () => {} },
) {
  root.classList.add("chat");
  root.innerHTML = `
    <ol class="chat-messages"></ol>
    <div class="chat-typing" aria-live="polite"></div>
    <form class="chat-form">
      <ul class="chat-suggest" role="listbox" hidden></ul>
      <input maxlength="500" autocomplete="off" enterkeyhint="send" placeholder="Message, @ to notify someone" />
      <button>Send</button>
    </form>`;
  const list = root.querySelector(".chat-messages");
  const typingLine = root.querySelector(".chat-typing");
  const input = root.querySelector("input");
  root.querySelector(".chat-form").append(...actions);
  let messages = [];
  let typingClients = [];
  let lastTypingSent = 0;

  // --- Names and @tags ---

  function label(id) {
    if (id === "director") return "Regie";
    const alias = aliasOf(id);
    return alias ? `${alias} (${id})` : id;
  }

  /** Whether `text` tags `id` as @cam1, @<alias> or, for the director, @Regie. */
  function tags(text, id) {
    const names = [id, aliasOf(id), id === "director" && "Regie"].filter(Boolean);
    return names.some((name) => new RegExp(`@${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, "iu").test(text));
  }

  // --- Rendering ---

  function renderMessage(message) {
    const li = document.createElement("li");
    li.classList.toggle("mine", message.from === me);
    li.classList.toggle("tagged", message.from !== me && tags(message.text, me));
    const time = new Date(message.at).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
    const meta = document.createElement("span");
    meta.className = "chat-meta";
    meta.append(Object.assign(document.createElement("b"), { textContent: label(message.from) }), ` ${time}`);
    const body = document.createElement("p");
    for (const part of message.text.split(/(@[\p{L}\p{N}_-]+)/u)) {
      body.append(part.startsWith("@") ? Object.assign(document.createElement("strong"), { textContent: part }) : part);
    }
    li.append(meta, body);
    if (message.question) li.append(renderQuestion(message));
    return li;
  }

  /** Who has answered what; whoever is asked can (re-)answer right here too. */
  function renderQuestion({ id, question }) {
    const row = document.createElement("div");
    row.className = "chat-question";
    if (question.to.includes(me)) {
      for (const option of question.options) {
        const button = Object.assign(document.createElement("button"), { type: "button", textContent: option });
        button.classList.toggle("chosen", question.answers[me] === option);
        button.onclick = () => connection.answer(id, option);
        row.append(button);
      }
    }
    for (const to of question.to.filter((id) => id !== me)) {
      const answer = question.answers[to];
      const chip = Object.assign(document.createElement("span"), {
        textContent: answer ? `${label(to)}: ${answer}` : `${label(to)}: no answer yet`,
      });
      chip.classList.toggle("answered", Boolean(answer));
      row.append(chip);
    }
    return row;
  }

  function render() {
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    list.replaceChildren(...messages.map(renderMessage));
    if (atBottom) list.scrollTop = list.scrollHeight;
    const others = typingClients.filter((id) => id !== me).map(label);
    typingLine.textContent = others.length ? `${others.join(", ")} ${others.length > 1 ? "are" : "is"} typing…` : "";
    onChange(messages);
  }

  // --- Input ---

  attachMentionCompletion(input, root.querySelector(".chat-suggest"), (query) =>
    clients()
      .filter((id) => id !== me)
      .map((id) => ({ id, name: id === "director" ? "Regie" : aliasOf(id) || id }))
      .filter(({ id, name }) => [id, name].some((word) => word.toLowerCase().startsWith(query.toLowerCase())))
      .map(({ id, name }) => ({ insert: name, hint: name === id ? "" : id })),
  );

  input.addEventListener("input", () => {
    if (!input.value) {
      connection.typing(false);
      lastTypingSent = 0;
    } else if (Date.now() - lastTypingSent > TYPING_RESEND_MS) {
      connection.typing(true);
      lastTypingSent = Date.now();
    }
  });

  root.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input.value.trim()) return;
    connection.chat(input.value);
    input.value = "";
    lastTypingSent = 0;
  });

  return {
    setMessages(next) {
      messages = next;
      render();
    },
    add(message) {
      messages = [...messages, message];
      render();
      if (message.question?.to.includes(me)) onQuestion(message, label(message.from));
      else if (message.from !== me && tags(message.text, me)) onMention(message, label(message.from));
    },
    update(message) {
      messages = messages.map((existing) => (existing.id === message.id ? message : existing));
      render();
    },
    setTyping(clients) {
      typingClients = clients;
      render();
    },
    refresh: render,
  };
}

/**
 * While the word at the cursor starts with @, lists matching people above the
 * input; arrow keys and Enter/Tab (or a click) insert one, Escape closes.
 * `candidates(query)` returns [{ insert: "Anna", hint: "cam1" }].
 */
function attachMentionCompletion(input, list, candidates) {
  let items = [];
  let active = 0;
  let mention = null; // { start, end } of "@query" in the input

  function close() {
    list.hidden = true;
    items = [];
  }

  function update() {
    const before = input.value.slice(0, input.selectionStart);
    const match = before.match(/@([\p{L}\p{N}_-]*)$/u);
    items = match ? candidates(match[1]) : [];
    if (items.length === 0) return close();
    mention = { start: before.length - match[0].length, end: input.selectionStart };
    active = Math.min(active, items.length - 1);
    list.replaceChildren(
      ...items.map(({ insert, hint }, i) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", i === active);
        li.append(`@${insert}`);
        if (hint) li.append(Object.assign(document.createElement("small"), { textContent: hint }));
        // mousedown, not click: keeps the focus in the input.
        li.addEventListener("mousedown", (event) => {
          event.preventDefault();
          choose(i);
        });
        return li;
      }),
    );
    list.hidden = false;
  }

  function choose(i) {
    const text = `@${items[i].insert} `;
    input.value = input.value.slice(0, mention.start) + text + input.value.slice(mention.end);
    const caret = mention.start + text.length;
    input.setSelectionRange(caret, caret);
    close();
  }

  input.addEventListener("input", () => {
    active = 0;
    update();
  });
  input.addEventListener("blur", close);
  input.addEventListener("keydown", (event) => {
    if (list.hidden) return;
    const moves = { ArrowDown: 1, ArrowUp: -1 };
    if (event.key in moves) {
      active = (active + moves[event.key] + items.length) % items.length;
      update();
    } else if (event.key === "Enter" || event.key === "Tab") {
      choose(active);
    } else if (event.key === "Escape") {
      close();
    } else {
      return;
    }
    event.preventDefault();
  });
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
