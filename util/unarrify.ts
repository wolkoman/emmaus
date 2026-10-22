export type Unarrify<T> = T extends (infer U)[] ? U : T;
