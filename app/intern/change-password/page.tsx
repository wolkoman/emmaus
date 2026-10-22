import { Links } from "@/app/(shared)/Links";
import { redirect } from "next/navigation";

export default function ChangePasswordPage() {
  redirect(Links.Sicherheit);
}
