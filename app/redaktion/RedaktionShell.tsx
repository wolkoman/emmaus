import { Links } from "@/app/(shared)/Links";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { AppShell } from "@/components/intern/AppShell";
import {
  AppSidebarLayout,
  AppSidebarSection,
} from "@/components/intern/AppSidebar";
import { AppSidebarSegmentLink } from "@/components/intern/AppSidebarSegmentLink";
import { fetchPaperProjects } from "@/domain/paper/paper-repo";
import { CpPersonCompetences } from "@/util/cockpit.generated";
import { ReactNode } from "react";
import { PiNewspaperClipping } from "react-icons/pi";

/**
 * Redaktion as a two-pane app (like Resourcen): the Emmausbote issues in the
 * sidebar, the chosen project on the right. Rendered by the (app) layout, so
 * it stays while switching projects. The pages themselves handle login and
 * the Editor competence; without it the sidebar just stays empty.
 */
export async function RedaktionShell(props: { children: ReactNode }) {
  const person = await resolveUserFromServer();
  const isEditor = !!person?.competences.includes(CpPersonCompetences.Editor);
  const projects = isEditor ? await fetchPaperProjects() : [];

  return (
    <AppShell title="Redaktion">
      <AppSidebarLayout
        sidebar={
          <AppSidebarSection title="Projekte">
            {projects.map((project) => (
              <AppSidebarSegmentLink
                key={project._id}
                href={Links.ProjektplattformProjekt(project._id)}
                segment={project._id}
                icon={<PiNewspaperClipping />}
              >
                {project.name}
              </AppSidebarSegmentLink>
            ))}
          </AppSidebarSection>
        }
      >
        {props.children}
      </AppSidebarLayout>
    </AppShell>
  );
}
