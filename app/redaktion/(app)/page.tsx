import { Links } from "@/app/(shared)/Links";
import { fetchPaperProjects } from "@/domain/paper/paper-repo";
import { redirect } from "next/navigation";

// No overview page: open the issue with the latest deadline.
export default async function RedaktionPage() {
  const [latest] = await fetchPaperProjects();
  redirect(Links.ProjektplattformProjekt(latest._id));
}
