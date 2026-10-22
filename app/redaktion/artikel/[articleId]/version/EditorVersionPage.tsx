"use client";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import { CpPaperTexts } from "@/util/cockpit.generated";

export function EditorVersionPage(props: { versions: CpPaperTexts[] }) {
  const [open, setOpen] = useState<string>();
  return (
    <>
      {props.versions.map((version) => (
        <motion.div
          key={version._id}
          className={`rounded-md border border-neutral-200 px-4 py-2 ${open !== version._id && "cursor-pointer"}`}
          onClick={() => setOpen(version._id)}
        >
          <div>{new Date(version._created * 1000).toLocaleString("de-AT")}</div>
          <AnimatePresence>
            {open === version._id && (
              <motion.div
                initial={{ height: 0 }}
                exit={{ height: 0 }}
                animate={{ height: "auto" }}
                className="mt-2 overflow-hidden whitespace-pre-wrap"
              >
                {version.text}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </>
  );
}
