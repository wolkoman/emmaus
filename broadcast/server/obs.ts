/**
 * Connection to OBS's built-in WebSocket server (obs-websocket 5, Tools →
 * WebSocket Server Settings): switches the program scene, reports every scene
 * change (including ones made by hand in OBS) and takes snapshots of the
 * program. Reconnects until OBS runs.
 * Protocol: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md
 */
import { createHash } from "node:crypto";

const OP = { hello: 0, identify: 1, identified: 2, event: 5, request: 6, response: 7 } as const;
const SUBSCRIBE_SCENES = 1 << 2;
const RECONNECT_MS = 2000;
const REQUEST_TIMEOUT_MS = 5000;

type Options = {
  url: string;
  password: string;
  onConnected: (connected: boolean) => void;
  onScene: (sceneName: string) => void;
};

export function connectObs({ url, password, onConnected, onScene }: Options) {
  let ws: WebSocket;
  let ready = false;
  let programScene: string | null = null;
  let nextId = 1;
  const pending = new Map<string, { resolve: (data: any) => void; reject: (error: Error) => void }>();

  function send(op: number, d: object) {
    ws.send(JSON.stringify({ op, d }));
  }

  function request(requestType: string, requestData?: object): Promise<any> {
    if (!ready) return Promise.reject(new Error("OBS is not connected"));
    const requestId = String(nextId++);
    send(OP.request, { requestType, requestId, requestData });
    return new Promise((resolve, reject) => {
      pending.set(requestId, { resolve, reject });
      setTimeout(() => {
        if (pending.delete(requestId)) reject(new Error(`OBS did not answer ${requestType}`));
      }, REQUEST_TIMEOUT_MS);
    });
  }

  async function onMessage({ op, d }: { op: number; d: any }) {
    if (op === OP.hello) {
      send(OP.identify, {
        rpcVersion: 1,
        authentication: d.authentication && authenticate(password, d.authentication),
        eventSubscriptions: SUBSCRIBE_SCENES,
      });
    } else if (op === OP.identified) {
      ready = true;
      console.log("OBS connected");
      onConnected(true);
      programScene = (await request("GetCurrentProgramScene")).sceneName;
      onScene(programScene!);
    } else if (op === OP.event && d.eventType === "CurrentProgramSceneChanged") {
      programScene = d.eventData.sceneName;
      onScene(programScene!);
    } else if (op === OP.response) {
      const call = pending.get(d.requestId);
      pending.delete(d.requestId);
      if (d.requestStatus.result) call?.resolve(d.responseData ?? {});
      else call?.reject(new Error(d.requestStatus.comment ?? `OBS refused ${d.requestType}`));
    }
  }

  function open() {
    ws = new WebSocket(url);
    ws.onmessage = (event) => onMessage(JSON.parse(String(event.data))).catch(console.error);
    ws.onclose = (event) => {
      if (ready) console.log("OBS disconnected");
      ready = false;
      programScene = null;
      onConnected(false);
      for (const call of pending.values()) call.reject(new Error("OBS disconnected"));
      pending.clear();
      // 4009 = authentication failed; retrying with the same password can't help.
      if (event.code === 4009) {
        console.error("OBS rejected the password: fix OBS_WEBSOCKET_PASSWORD and restart the server");
        return;
      }
      setTimeout(open, RECONNECT_MS);
    };
  }

  open();

  return {
    /** Resolves once OBS has started switching (the transition is running). */
    setScene: (sceneName: string) => request("SetCurrentProgramScene", { sceneName }),

    /** A JPEG of the program scene as a data URL, scaled to fit width × height (aspect ratio kept). */
    async programSnapshot({ width, height, quality }: { width: number; height: number; quality: number }) {
      if (!programScene) throw new Error("OBS is not connected");
      const { imageData } = await request("GetSourceScreenshot", {
        sourceName: programScene,
        imageFormat: "jpg",
        imageWidth: width,
        imageHeight: height,
        imageCompressionQuality: quality,
      });
      const image = String(imageData);
      return image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
    },
  };
}

function authenticate(password: string, { salt, challenge }: { salt: string; challenge: string }) {
  const sha256 = (text: string) => createHash("sha256").update(text).digest("base64");
  return sha256(sha256(password + salt) + challenge);
}
