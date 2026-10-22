"use client";

import { SanitizeHTML, sanitizeOptions } from "@/components/SanitizeHtml";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas-pro";
import { useEffect, useRef, useState } from "react";
import { PiDownload } from "react-icons/pi";
import sanitize from "sanitize-html";
import { articleIcon, TILE_ICONS } from "../tileIcons";
import type { InstagramContentIcon, InstagramContentSection } from "./types";

interface ContentChunk {
  id: string;
  title: string;
  text: string;
  icon?: InstagramContentIcon;
  variant: NonNullable<InstagramContentSection["variant"]>;
  isFirstChunk: boolean;
}

const STYLE_CONFIG = {
  // Instagram portrait post dimensions (3:4)
  pageWidth: 1080,
  pageHeight: 1440,
  paddingX: 96,
  paddingTop: 96,
  paddingBottom: 96,

  // Layout classes
  pageContainer:
    "relative h-[1440px] w-[1080px] overflow-hidden bg-emmaus/10 transition-colors",
  contentContainer: "relative z-10 flex flex-col gap-12 px-24 py-24",
  contentContainerTest: "z-10 flex flex-col gap-12 px-24", // No vertical padding for test
  articleContainer: "flex flex-col gap-6",
  noticeContainer: "flex flex-col border-2 border-emmaus rounded-xl p-8",
  imageContainer: "flex flex-col",
  articlesWrapper: "flex flex-col gap-12",
  headingRow: "flex items-center gap-3",

  // Typography
  titleFirst: "text-5xl font-semibold",
  titleContinuation: "left-0 top-0 w-full text-[32px] opacity-50",
  articleText: "text-[32px] leading-normal",
  articleTextSerif: "font-['Source_Serif_4'] text-[32px] leading-normal",
  imageText: "ig-image",
  noticeText: "text-[36px] leading-normal text-center",

  // Colors & backgrounds
  pageBackground: "bg-emmaus/10",
  testBackground: "bg-white",

  // Debug styling
  debugContainer:
    "position:fixed;top:50px;left:50px;border:3px solid red;z-index:9999;background:white",
  debugHeader:
    "position:absolute;top:-40px;left:0;background:red;color:white;padding:5px;font-size:14px;font-weight:bold;width:100%",
} as const;

const PAGE_CONFIG = {
  ...STYLE_CONFIG,
  contentHeight:
    STYLE_CONFIG.pageHeight -
    STYLE_CONFIG.paddingTop -
    STYLE_CONFIG.paddingBottom,
  initialDelay: 500,
} as const;

async function findLargestFittingPrefix(
  maxCount: number,
  fits: (count: number) => Promise<boolean>,
): Promise<number> {
  let low = 1;
  let high = maxCount;
  let fittedCount = 0;

  while (low <= high) {
    const count = Math.floor((low + high) / 2);
    if (await fits(count)) {
      fittedCount = count;
      low = count + 1;
    } else {
      high = count - 1;
    }
  }

  return fittedCount;
}

const CAROUSEL_GRADIENT =
  "linear-gradient(90deg, #f5faf9 0%, #e8f2f1 22%, #fff8f3 48%, #edf5f4 72%, #f9fbfa 100%)";

interface CarouselRing {
  id: string;
  centerX: number;
  centerY: number;
  diameter: number;
  borderColor: string;
  borderWidth: number;
}

function carouselRings(totalPages: number): CarouselRing[] {
  const verticalPositions = [180, 1180, 300, 1080];
  const diameters = [1120, 880, 1040, 960];

  return Array.from({ length: totalPages + 1 }, (_, boundary) => {
    const centerX =
      boundary * STYLE_CONFIG.pageWidth + ((boundary % 3) - 1) * 140;
    const centerY = verticalPositions[boundary % verticalPositions.length];
    const diameter = diameters[boundary % diameters.length];
    const accent = boundary % 2 === 0;

    return [
      {
        id: `${boundary}-outer`,
        centerX,
        centerY,
        diameter,
        borderColor: accent
          ? "rgba(58, 114, 118, 0.42)"
          : "rgba(255, 138, 68, 0.34)",
        borderWidth: 2,
      },
      {
        id: `${boundary}-inner`,
        centerX,
        centerY,
        diameter: diameter - 300,
        borderColor: "rgba(58, 114, 118, 0.2)",
        borderWidth: 1,
      },
    ];
  }).flat();
}

function PageVisuals(props: { pageIndex: number; totalPages: number }) {
  const pageOffset = props.pageIndex * STYLE_CONFIG.pageWidth;
  const carouselWidth = props.totalPages * STYLE_CONFIG.pageWidth;
  const pageEnd = pageOffset + STYLE_CONFIG.pageWidth;
  const rings = carouselRings(props.totalPages).filter(
    (ring) =>
      ring.centerX + ring.diameter / 2 >= pageOffset &&
      ring.centerX - ring.diameter / 2 <= pageEnd,
  );

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: CAROUSEL_GRADIENT,
          backgroundPosition: `${-pageOffset}px 0`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${carouselWidth}px ${STYLE_CONFIG.pageHeight}px`,
        }}
      />
      {rings.map((ring) => (
        <div
          key={ring.id}
          className="absolute rounded-full border-solid"
          style={{
            borderColor: ring.borderColor,
            borderWidth: ring.borderWidth,
            height: ring.diameter,
            left: ring.centerX - pageOffset - ring.diameter / 2,
            top: ring.centerY - ring.diameter / 2,
            width: ring.diameter,
          }}
        />
      ))}
    </div>
  );
}

function headingHtml(title: string, className: string, iconSize: number) {
  if (!title) return "";
  return `<div class="${STYLE_CONFIG.headingRow}"><span style="display:block;width:${iconSize}px;height:${iconSize}px;flex:0 0 ${iconSize}px"></span><div class="${className}">${title}</div></div>`;
}

function contentIcon(icon?: InstagramContentIcon) {
  if (!icon) return undefined;
  return icon.kind === "article"
    ? articleIcon(icon.name)
    : TILE_ICONS[icon.name];
}

export default function InstagramPages({
  title,
  issueName,
  filenamePrefix,
  sections,
}: {
  title: string;
  issueName: string;
  filenamePrefix: string;
  sections: InstagramContentSection[];
}) {
  // State management
  const [pages, setPages] = useState<ContentChunk[][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for DOM manipulation
  const titlePageRef = useRef<HTMLDivElement>(null);
  const articlePageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Wait for two animation frames so the browser commits a full layout + paint.
  const nextPaint = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

  // Make sure all webfonts (e.g. Source Serif 4) are fully loaded before
  // html2canvas clones the DOM. If fonts aren't ready, the captured image
  // falls back to default styles and looks "unstyled".
  const ensureFontsReady = async () => {
    if (typeof document === "undefined") return;
    const fonts = (
      document as Document & { fonts?: { ready: Promise<unknown> } }
    ).fonts;
    if (fonts?.ready) {
      try {
        await fonts.ready;
      } catch {
        // ignore
      }
    }
  };

  // Wait until every <img> inside the container has finished loading (or
  // failed). Base64 data-URI images decode asynchronously, so without this the
  // overflow measurement and html2canvas capture happen before the image has
  // any height, dropping it from the generated page.
  const waitForImages = (container: HTMLElement) =>
    Promise.all(
      Array.from(container.querySelectorAll("img")).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            // Safety timeout so a never-loading image can't hang generation.
            setTimeout(done, 3000);
          }),
      ),
    ).then(() => undefined);

  const downloadPageAsImage = async (
    pageElement: HTMLDivElement,
    filename: string,
  ) => {
    try {
      // Re-confirm fonts + layout right before each capture; this prevents the
      // intermittent "unstyled HTML" output from html2canvas.
      await ensureFontsReady();
      // Base64 images decode asynchronously; capture only once they're ready,
      // otherwise html2canvas renders the page with blank/missing images.
      await waitForImages(pageElement);
      await nextPaint();

      // Pin the capture region to the Instagram post canvas. Without this,
      // html2canvas occasionally falls back to the element's content size
      // for pages with little content (and decorative circles that overflow
      // the clipping box bleed into the captured width).
      const canvas = await html2canvas(pageElement, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: STYLE_CONFIG.pageWidth,
        height: STYLE_CONFIG.pageHeight,
        windowWidth: STYLE_CONFIG.pageWidth,
        windowHeight: STYLE_CONFIG.pageHeight,
      });

      return new Promise<void>((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          resolve();
        }, "image/png");
      });
    } catch (error) {
      console.error("Error downloading page:", error);
    }
  };

  const downloadAllPages = async () => {
    // Make sure webfonts are ready before we start the batch.
    await ensureFontsReady();
    await nextPaint();

    // Download title page
    if (titlePageRef.current) {
      await downloadPageAsImage(
        titlePageRef.current,
        `${filenamePrefix}-title.png`,
      );
      await delay(800);
    }

    // Download all article pages
    for (const [i, pageElement] of articlePageRefs.current.entries()) {
      if (pageElement) {
        await downloadPageAsImage(
          pageElement,
          `${filenamePrefix}-page-${i + 2}.png`,
        );
        await delay(800);
      }
    }
  };

  // Split the article HTML into the "words" the pagination loop fills a page
  // with, while keeping each <img> tag as a single atomic token. Splitting on
  // spaces alone would tear an image's `<img` and `src="..."` apart and the
  // tag would never render.
  const tokenizeArticleText = (text: string): string[] => {
    const withBreaks = text.replaceAll("<br/>", " <br/> ");
    const imgTagRegex = /<img\b[^>]*>/gi;
    const tokens: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const pushWords = (segment: string) => {
      for (const word of segment.split(" ")) {
        if (word) tokens.push(word);
      }
    };

    while ((match = imgTagRegex.exec(withBreaks)) !== null) {
      pushWords(withBreaks.slice(lastIndex, match.index));
      tokens.push(match[0]);
      lastIndex = imgTagRegex.lastIndex;
    }
    pushWords(withBreaks.slice(lastIndex));

    return tokens;
  };

  /**
   * Simple incremental page filling with overflow detection
   */
  const splitSectionsIntoPages = async () => {
    await new Promise((resolve) =>
      setTimeout(resolve, PAGE_CONFIG.initialDelay),
    );

    const { container: testContainer, updateDebug } = createTestContainer();
    const allPages: ContentChunk[][] = [];
    let currentPageChunks: ContentChunk[] = [];

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];
      updateDebug(
        `Section ${sectionIndex + 1}/${sections.length}: ${section.title}`,
      );

      const words = tokenizeArticleText(section.text);
      let wordIndex = 0;
      let isFirstChunk = true;

      while (wordIndex < words.length) {
        const fittedCount = await findLargestFittingPrefix(
          words.length - wordIndex,
          async (count) => {
            const testChunk: ContentChunk = {
              id: `${section.id}-${sectionIndex}`,
              title:
                isFirstChunk || !section.title
                  ? section.title
                  : `Fortsetzung: ${section.title}`,
              text: words.slice(wordIndex, wordIndex + count).join(" "),
              icon: section.icon,
              variant: section.variant ?? "default",
              isFirstChunk,
            };
            await addContentToContainer(testContainer, [
              ...currentPageChunks,
              testChunk,
            ]);
            return !checkOverflow(testContainer);
          },
        );

        if (fittedCount === 0 && currentPageChunks.length > 0) {
          allPages.push(currentPageChunks);
          currentPageChunks = [];
          continue;
        }

        const chunkWordCount = Math.max(fittedCount, 1);
        currentPageChunks.push({
          id: `${section.id}-${sectionIndex}`,
          title:
            isFirstChunk || !section.title
              ? section.title
              : `Fortsetzung: ${section.title}`,
          text: words.slice(wordIndex, wordIndex + chunkWordCount).join(" "),
          icon: section.icon,
          variant: section.variant ?? "default",
          isFirstChunk,
        });
        wordIndex += chunkWordCount;
        isFirstChunk = false;

        if (wordIndex < words.length) {
          allPages.push(currentPageChunks);
          currentPageChunks = [];
        }
      }
    }

    if (currentPageChunks.length > 0) allPages.push(currentPageChunks);

    updateDebug(`✅ Complete! Generated ${allPages.length} pages`);
    await delay(0);
    testContainer.parentElement?.remove();
    setPages(allPages);
    setIsLoading(false);
  };

  const createTestContainer = (): {
    container: HTMLDivElement;
    updateDebug: (info: string) => void;
  } => {
    const testPage = document.createElement("div");
    testPage.style.cssText = `${STYLE_CONFIG.debugContainer};width:${STYLE_CONFIG.pageWidth}px;height:${PAGE_CONFIG.contentHeight}px`;
    testPage.className = `relative ${STYLE_CONFIG.pageBackground}`;

    // Add debug header
    const debugHeader = document.createElement("div");
    debugHeader.style.cssText = STYLE_CONFIG.debugHeader;
    debugHeader.textContent = "🐛 DEBUG: Test Container";
    testPage.appendChild(debugHeader);

    const contentContainer = document.createElement("div");
    contentContainer.className = STYLE_CONFIG.contentContainerTest;
    testPage.appendChild(contentContainer);
    document.body.appendChild(testPage);

    const updateDebug = (info: string) => {
      debugHeader.textContent = `🐛 DEBUG: ${info}`;
    };

    return { container: contentContainer, updateDebug };
  };

  const checkOverflow = (container: HTMLDivElement): boolean => {
    return container.scrollHeight > PAGE_CONFIG.contentHeight;
  };

  const addContentToContainer = async (
    container: HTMLDivElement,
    chunks: ContentChunk[],
  ) => {
    container.innerHTML = `<div class="${STYLE_CONFIG.articlesWrapper}">${chunks
      .map((chunk) => {
        const containerClass =
          chunk.variant === "notice"
            ? STYLE_CONFIG.noticeContainer
            : chunk.variant === "image"
              ? STYLE_CONFIG.imageContainer
              : STYLE_CONFIG.articleContainer;
        const textClass =
          chunk.variant === "notice"
            ? STYLE_CONFIG.noticeText
            : chunk.variant === "image"
              ? STYLE_CONFIG.imageText
              : STYLE_CONFIG.articleTextSerif;
        return `
      <div class="${containerClass}">
        ${headingHtml(chunk.title, !chunk.isFirstChunk ? STYLE_CONFIG.titleContinuation : STYLE_CONFIG.titleFirst, chunk.isFirstChunk ? 48 : 32)}
        <div class="${textClass} custom-html ig-html">${sanitize(chunk.text, sanitizeOptions)}</div>
      </div>
    `;
      })
      .join("")}</div>`;

    await waitForImages(container);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && sections.length > 0) {
      // Kick off pagination + actively force the Source Serif 4 weights we
      // actually use to download. Without this, html2canvas may capture a
      // page before the font is ready, producing an "unstyled HTML" image.
      const w = window as Window & {
        document: Document & {
          fonts?: {
            load: (font: string) => Promise<unknown>;
            ready: Promise<unknown>;
          };
        };
      };
      const fonts = w.document.fonts;
      if (fonts?.load) {
        Promise.all([
          fonts.load("400 32px 'Source Serif 4'"),
          fonts.load("600 32px 'Source Serif 4'"),
          fonts.load("700 96px 'Source Serif 4'"),
        ]).catch(() => {
          // ignore — fall back to document.fonts.ready below
        });
      }

      splitSectionsIntoPages();
    }
  }, [sections]);

  // Show loading state while processing
  if (isLoading) {
    return (
      <div
        className={`flex h-[1440px] w-[1080px] ${STYLE_CONFIG.testBackground}`}
      >
        <div
          className={`relative h-[1440px] w-[1080px] overflow-hidden ${STYLE_CONFIG.pageBackground}`}
        >
          <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div
              className={`p-4 text-center ${STYLE_CONFIG.articleText} text-emmaus font-semibold`}
            >
              Processing...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button onClick={downloadAllPages}>
        <PiDownload />
        Download
      </Button>

      {/* Generated pages container */}
      <div className="flex flex-col bg-white">
        {/* Title Page */}
        <div ref={titlePageRef} className={STYLE_CONFIG.pageContainer}>
          <PageVisuals pageIndex={0} totalPages={pages.length + 1} />
          <div
            className="absolute z-10 flex flex-col items-center"
            style={{
              top: "50%",
              left: "50%",
              transform: "translateX(-50%) translateY(-50%)",
            }}
          >
            <div
              className="text-emmaus text-center text-5xl"
              style={{ paddingBottom: "50px" }}
            >
              Monatsblatt Digital
            </div>
            {/* Shadow layers for html2canvas compatibility */}
            <div className="relative h-[520px] w-[760px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-emmaus px-10 text-center font-['Source_Serif_4'] text-[96px] leading-none font-bold whitespace-pre-line">
                  {title}
                </div>
              </div>
            </div>
            <div className="text-emmaus mt-8 p-4 text-center text-5xl">
              {issueName}
            </div>
          </div>
          <div className="text-emmaus absolute right-0 bottom-0 z-20 p-12 text-8xl">
            →
          </div>
        </div>

        {/* Article Pages */}
        {pages.map((pageChunks, pageIndex) => (
          <div
            key={`page-${pageIndex}`}
            ref={(el) => {
              articlePageRefs.current[pageIndex] = el;
            }}
            className={STYLE_CONFIG.pageContainer}
          >
            <PageVisuals
              pageIndex={pageIndex + 1}
              totalPages={pages.length + 1}
            />
            <div className={STYLE_CONFIG.contentContainer}>
              {pageChunks.map((chunk) => {
                const Icon = contentIcon(chunk.icon);
                const containerClass =
                  chunk.variant === "notice"
                    ? STYLE_CONFIG.noticeContainer
                    : chunk.variant === "image"
                      ? STYLE_CONFIG.imageContainer
                      : STYLE_CONFIG.articleContainer;
                const textClass =
                  chunk.variant === "notice"
                    ? STYLE_CONFIG.noticeText
                    : chunk.variant === "image"
                      ? STYLE_CONFIG.imageText
                      : STYLE_CONFIG.articleTextSerif;

                return (
                  <div key={chunk.id} className={containerClass}>
                    {!!chunk.title && (
                      <div className={STYLE_CONFIG.headingRow}>
                        {Icon && (
                          <Icon
                            aria-hidden
                            className={
                              chunk.isFirstChunk
                                ? "size-12 shrink-0"
                                : "size-8 shrink-0 opacity-50"
                            }
                          />
                        )}
                        <div
                          className={
                            !chunk.isFirstChunk
                              ? STYLE_CONFIG.titleContinuation
                              : STYLE_CONFIG.titleFirst
                          }
                        >
                          {chunk.title}
                        </div>
                      </div>
                    )}
                    <div className={textClass}>
                      <SanitizeHTML html={chunk.text} className="ig-html" />
                    </div>
                  </div>
                );
              })}
            </div>
            {pageIndex !== pages.length - 1 && (
              <>
                <div className="text-emmaus absolute right-0 bottom-0 z-20 p-12 text-8xl">
                  →
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
