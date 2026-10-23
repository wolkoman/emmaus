import { ReactNode } from "react";
import Footer from "./Footer";
import { LiveLanguageBanner } from "./LiveLanguageBanner";
import TopBar from "./nav/TopBar";
import Responsive from "./Responsive";

export default function Site(props: {
  title?: string;
  children: ReactNode;
  responsive?: boolean;
  showTitle?: boolean;
  navbar?: boolean;
  footer?: boolean;
  /** Navbar overlays a dark hero image and the footer turns teal (used by /carlo). */
  dark?: boolean;
}) {
  return (
    <>
      <div
        style={{ minHeight: "100vh" }}
        className="flex flex-col justify-between"
      >
        <div className="relative flex grow flex-col items-stretch">
          <LiveLanguageBanner />
          {(props.navbar ?? true) && (
            <>
              {props.dark ? (
                <div className="absolute inset-x-0 top-0 z-30 bg-linear-to-b from-black/50 to-transparent text-white">
                  <Responsive>
                    <TopBar />
                  </Responsive>
                </div>
              ) : (
                <Responsive>
                  <TopBar />
                </Responsive>
              )}
              {props.showTitle && (
                <div className="mx-auto w-full max-w-5xl px-4">
                  <div className="my-6 text-4xl font-bold lg:my-12 print:hidden">
                    {props.title}
                  </div>
                </div>
              )}
            </>
          )}
          {(props.responsive ?? true) ? (
            <Responsive>{props.children}</Responsive>
          ) : (
            <>{props.children}</>
          )}
        </div>
        {(props.footer ?? true) && <Footer dark={props.dark} />}
      </div>
    </>
  );
}
