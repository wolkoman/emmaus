/**
 * Connection to an ATEM switcher over its control port (UDP 9910, no OBS
 * plugin needed): reports which input is on program and which on preview, so
 * the camera pages show the right tally. Reconnects until the ATEM answers.
 * Video still comes through the capture card; only the control data comes from
 * here.
 * Library: https://github.com/Steffylicious/atem-connection
 */
import { Atem } from "atem-connection";
import { createSocket } from "node:dgram";
import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";

const DEFAULT_PORT = 9910;
/** What an ATEM answers to; it introduces itself to whoever sends this. */
const HELLO = Buffer.from([
  0x10, 0x14, 0x53, 0xab, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00,
]);

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

type LocalNetwork = { name: string; address: string; netmask: string; family: string | number; internal: boolean };

/** The Mac's own networks, physical interfaces (en0, en1, …) before VPNs and virtual ones. */
function localNetworks(): LocalNetwork[] {
  const all = Object.entries(networkInterfaces()).flatMap(([name, addresses]) =>
    (addresses ?? []).map(({ address, netmask, family, internal }) => ({ name, address, netmask, family, internal })),
  );
  const usable = all.filter(
    (network) =>
      network.family === "IPv4" &&
      !network.internal &&
      network.netmask !== "255.255.255.255" &&
      !network.address.startsWith("169.254."),
  );
  const physical = usable.filter((network) => network.name.startsWith("en"));
  return physical.length > 0 ? physical : usable;
}

const ipv4ToInt = (ip: string) => ip.split(".").reduce((value, part) => (value << 8) + Number(part), 0) >>> 0;
const intToIpv4 = (value: number) => [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");

/** Every host of a network, without its network and broadcast addresses. */
function hostsOf({ address, netmask }: LocalNetwork, limit = 1022): string[] {
  const mask = ipv4ToInt(netmask);
  const base = (ipv4ToInt(address) & mask) >>> 0;
  const broadcast = (base | (~mask >>> 0)) >>> 0;
  const hosts: string[] = [];
  for (let host = base + 1; host < broadcast && hosts.length < limit; host++) hosts.push(intToIpv4(host));
  return hosts;
}

/**
 * Looks for an ATEM in the Mac's own networks by sending the hello packet the
 * library uses to every host and waiting for an answer. The ATEM's address
 * then need not be configured, and survives a changed DHCP lease.
 */
export async function findAtem(timeoutMs = 1500): Promise<string | null> {
  const hosts = localNetworks().flatMap((network) => hostsOf(network));
  if (hosts.length === 0) return null;

  const socket = createSocket("udp4");
  return new Promise((resolve) => {
    let found: string | null = null;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      socket.close();
      resolve(found);
    };
    socket.on("message", (_message, rinfo) => {
      found ??= rinfo.address;
      finish();
    });
    socket.on("error", finish);
    socket.bind(() => {
      for (const host of hosts) socket.send(HELLO, DEFAULT_PORT, host, () => {});
      setTimeout(finish, timeoutMs);
    });
  });
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
