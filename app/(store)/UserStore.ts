import { createLoadedStore } from "@/store/CreateLoadedStore";
import { createStore } from "zustand";
import { combine } from "zustand/middleware";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { CpPerson } from "@/util/cockpit.generated";
import loginOnServer from "@/domain/users/login";
import { verifyToken } from "@/domain/jsonwebtoken";

async function decodeJwt(
  jwt: string,
): Promise<{ person: CpPerson; exp: number }> {
  const payload = await verifyToken(jwt);

  if (typeof payload !== "object" || payload === null) {
    throw new TypeError("Invalid JWT payload structure");
  }
  // Only session tokens carry code "user"; old admin tokens have no person behind them.
  if (payload.code !== "user") throw new TypeError("Not a session token");
  return { person: payload as unknown as CpPerson, exp: payload.exp! };
}

export class InvalidCredentialsError extends Error {}

async function storeJwt(jwt: string) {
  const decoded = await decodeJwt(jwt);
  // Without an explicit expiry the cookie dies with the browser session.
  setCookie("JWT_EMMAUS", jwt, { expires: new Date(decoded.exp * 1000) });
  return decoded;
}

export const userStore = createStore(
  combine(
    {
      person: null as CpPerson | null,
      loaded: false,
      loading: false,
    },
    (set, get) => ({
      setJwt: async (jwt: string) => {
        if (get().loading) return;
        set((state) => ({ ...state, loading: true }));
        const { person } = await storeJwt(jwt);
        set({ person: person, loaded: true, loading: false });
      },
      login: (data: { username: string; password: string }) => {
        if (get().loading) return Promise.resolve();
        set((state) => ({ ...state, loading: true }));
        return loginOnServer(data.username, data.password)
          .then(async (jwt) => {
            if (jwt === null) throw new InvalidCredentialsError();
            const { person } = await storeJwt(jwt);
            set({ person: person, loaded: true, loading: false });
          })
          .catch((error) => {
            set({ loading: false });
            throw error;
          });
      },
      logout: () => {
        set((state) => ({ ...state, user: undefined, loaded: true }));
        deleteCookie("JWT_EMMAUS");
      },
      load: async () => {
        if (get().loaded) return;
        set({ loaded: true });
        const jwt = getCookie("JWT_EMMAUS");
        if (typeof jwt !== "string") {
          console.log("Cookie not found");
          return;
        }
        try {
          const { person } = await decodeJwt(jwt);
          set({ person: person, loaded: true });
        } catch {
          // Expired or invalid token: drop it so the user isn't half-logged-in.
          deleteCookie("JWT_EMMAUS");
        }
      },
    }),
  ),
);
export const useUserStore = createLoadedStore(userStore);
