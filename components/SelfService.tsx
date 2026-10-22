"use client";

import React, { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { Loading } from "./Loading";
import { PiResizeBold } from "react-icons/pi";

type SSProps<S> = {
  name: keyof S;
  form: readonly [S, Dispatch<SetStateAction<S>>];
};
type SSType = Record<string, any>;

export function Field(props: { children: ReactNode; label: string }) {
  return (
    <div className="my-2">
      <div className="text-sm">{props.label}</div>
      {props.children}
    </div>
  );
}

export function SelfServiceInput<S extends SSType>(
  props: {
    type?: string;
    input?: "textarea";
    disabled?: boolean;
    placeholder?: string;
  } & SSProps<S>,
) {
  const Tag = props.input ?? "input";
  return (
    <Tag
      {...(Tag === "input" ? { type: props.type } : {})}
      placeholder={props.placeholder}
      disabled={props.disabled}
      value={props.form[0][props.name]}
      onChange={({ target }) =>
        props.form[1]((rest) => ({ ...rest, [props.name]: target.value }))
      }
      className={`rounded bg-white font-semibold focus:border-black/50 ${props.disabled ? "" : "border border-neutral-200 px-2 py-1"} w-full outline-none ${props.input === "textarea" && "h-36"}`}
    />
  );
}

export function SelfServiceImageSizeToggle<S extends SSType>(
  props: {
    disabled?: boolean;
  } & SSProps<S>,
) {
  const sizes = [120, 180];
  const currentSize = props.form[0][props.name];
  const nextSize =
    sizes[
      ((sizes.findIndex((size) => size == currentSize) ?? sizes[0]) + 1) %
        sizes.length
    ];
  return (
    <div
      className="grid w-12 cursor-pointer place-items-center rounded border border-l-0 border-neutral-200"
      onClick={() =>
        props.form[1]((rest) => ({ ...rest, [props.name]: nextSize }))
      }
    >
      <PiResizeBold />
    </div>
  );
}

export type SelfServiceFile = {
  id: string;
  index: number;
  name: string;
  result: string;
  finished: boolean;
};

export function SelfServiceFileUpload<S extends SSType>(
  props: SSProps<S> & { accept?: string },
) {
  const [fileList, setFileList] = [
    props.form[0][props.name] as SelfServiceFile[],
    (fn: (files: SelfServiceFile[]) => SelfServiceFile[]) =>
      props.form[1]((rest) => ({
        ...rest,
        [props.name]: fn(rest[props.name] as SelfServiceFile[]),
      })),
  ] as const;

  const onDelete = (fileUrl: string) => {
    setFileList((list) => list.filter((file) => file.result !== fileUrl));
    return fetch(
      `https://api.eni.wien/files-v0/delete.php?file=${fileUrl.split("/").at(-1)}`,
      { method: "POST" },
    );
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const id = Math.random().toString();
    const fileList = e.target.files;
    const files = fileList ? [...fileList] : [];
    const data = new FormData();
    files.forEach((file, i) => {
      data.append(`file-${i}`, file, file.name);
      setFileList((fileList) => [
        ...fileList,
        { id, index: i, name: file.name, result: "", finished: false },
      ]);
    });
    fetch("https://api.emmaus.wien/files-v0/upload.php", {
      method: "POST",
      body: data,
    })
      .then((res) => res.json())
      .then((data) => {
        setFileList((files) =>
          files.map((file) =>
            file.id === id
              ? {
                  ...file,
                  finished: true,
                  result: `https://api.emmaus.wien/files-v0/uploads/${data[file.index]}`,
                }
              : file,
          ),
        );
      })
      .catch((err) => {
        setFileList((files) => files.filter((file) => file.id !== id));
        console.error(err);
      });
  };

  let uploadEverywhere = fileList.length == 0;
  return (
    <label
      htmlFor={uploadEverywhere ? "dropzone-file" : ""}
      className={`relative flex h-44 flex-col overflow-hidden rounded border border-neutral-200 ${uploadEverywhere ? "cursor-pointer hover:bg-black/[2%]" : ""}`}
    >
      {uploadEverywhere ? (
        <div className="flex h-full flex-col items-center justify-center">
          <svg
            aria-hidden="true"
            className="mb-3 h-10 w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
          <div className="">Hochladen</div>
        </div>
      ) : (
        <div className="flex min-h-full flex-col">
          {fileList
            .filter((file) => file.finished)
            .map((file) => (
              <FileItem
                key={file.id}
                name={file.name}
                link={file.result}
                onDelete={() => onDelete(file.result)}
              />
            ))}
          {fileList
            .filter((file) => !file.finished)
            .map((file) => (
              <FileItem key={file.id} name={file.name} />
            ))}
          {fileList.some((file) => !file.finished) && (
            <div className="absolute left-0 top-0 w-full">
              <Loading noPadding={true} />
            </div>
          )}
          <div className="grow" />
          <label htmlFor="dropzone-file">
            <div className="absolute bottom-0 right-0 cursor-pointer rounded-tl border-l border-t border-neutral-200 bg-white px-2 py-1">
              Hochladen
            </div>
          </label>
        </div>
      )}
      <input
        id="dropzone-file"
        type="file"
        className="hidden"
        accept={props.accept}
        onChange={handleFileChange}
        multiple
      />
    </label>
  );
}

function FileItem(props: {
  name: string;
  link?: string;
  onDelete?: () => void;
}) {
  const Content = () => (
    <div className="flex justify-between border-b border-neutral-200 px-2 py-1">
      <div className="truncate">{props.name}</div>
      <div
        className="rounded px-3 hover:bg-red-700 hover:text-white"
        onClick={(e) => {
          e.stopPropagation();
          props.onDelete?.();
        }}
      >
        X
      </div>
    </div>
  );
  return props.link ? (
    <div
      onClick={() => {
        window.open(props.link);
      }}
      className="cursor-pointer hover:bg-black/5"
    >
      <Content />
    </div>
  ) : (
    <div className="animate-pulse">
      <Content />
    </div>
  );
}
