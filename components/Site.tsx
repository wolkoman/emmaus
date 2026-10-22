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
}) {
  return (
    <>
      <div
        style={{ minHeight: "100vh" }}
        className="flex flex-col justify-between"
      >
        <div className="flex grow flex-col items-stretch">
          <LiveLanguageBanner />
          {(props.navbar ?? true) && (
            <>
              <Responsive>
                <TopBar />
              </Responsive>
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
        {(props.footer ?? true) && <Footer />}
      </div>
    </>
  );
}
