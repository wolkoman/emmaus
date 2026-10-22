export type InstagramContentIcon =
  | { kind: "article"; name?: string }
  | {
      kind: "tile";
      name: "EVENTS" | "EVANGELIEN" | "GEBETSANLIEGEN";
    };

export interface InstagramContentSection {
  id: string;
  title: string;
  text: string;
  icon?: InstagramContentIcon;
  variant?: "default" | "notice" | "image";
}
