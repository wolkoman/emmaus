/**
 * Connection to an ATEM switcher over its control port (UDP 9910, no OBS
 * plugin needed): reports which input is on program and which on preview, so
 * the camera pages show the right tally. Reconnects until the ATEM answers.
 * Video still comes through the capture card; only the control data comes from
 * here.
 * Library: https://github.com/Steffylicious/atem-connection
 */
import { Atem } from "atem-connection";

const DEFAULT_PORT = 9910;

export type Tally = "off" | "preview" | "program";

type Options = {
  /** The ATEM's address on the streaming Mac's network. */
  address: string;
  port?: number;
  /** ATEM input per camera id, e.g. `{ cam1: 1, cam2: 2 }`. */
  inputs: Record<string, number>;
  onConnected: (connected: boolean) => void;
  /** Camera id → tally, whenever the ATEM's program or preview changes. */
  onTally: (tally: Record<string, Tally>) => void;
};

/** The tally per camera, from the input on each of the switcher's two buses. */
export function tallyFrom(
  { programInput, previewInput }: { programInput: number; previewInput: number },
  inputs: Record<string, number>,
): Record<string, Tally> {
  return Object.fromEntries(
    Object.entries(inputs).map(([cam, input]) => [
      cam,
      programInput === input ? "program" : previewInput === input ? "preview" : "off",
    ]),
  );
}

export function connectAtem({ address, port = DEFAULT_PORT, inputs, onConnected, onTally }: Options) {
  const atem = new Atem();

  // Mix effect 1 is the switcher's main program bus, which is what "on air" means here.
  function report() {
    const program = atem.state?.video.mixEffects[0];
    if (!program) return;
    onTally(tallyFrom(program, inputs));
  }

  atem.on("connected", () => {
    console.log(`ATEM connected at ${address}`);
    onConnected(true);
    report();
  });

  // The library reconnects by itself; meanwhile nobody is on air.
  atem.on("disconnected", () => {
    onConnected(false);
    onTally(Object.fromEntries(Object.keys(inputs).map((cam) => [cam, "off"])));
  });

  atem.on("stateChanged", report);
  atem.on("error", (error) => console.warn(`ATEM: ${error}`));

  atem.connect(address, port).catch((error) => console.warn(`ATEM: ${(error as Error)?.message ?? error}`));
}
