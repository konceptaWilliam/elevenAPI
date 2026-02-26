"use client";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import * as React from "react";

type GeneratedAudioFile = {
  fileName: string;
  base64Audio: string;
};

type SubmitResponse = {
  ok: boolean;
  message?: string;
  files?: GeneratedAudioFile[];
};

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export default function Form() {
  const [singleWords, setSingleWords] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [selectedDirectoryName, setSelectedDirectoryName] = useState("");

  async function chooseDirectory() {
    if (!("showDirectoryPicker" in window)) {
      setResultMessage("Din webblasare stödjer inte mappval.");
      return;
    }

    try {
      const handle = await (
        window.showDirectoryPicker as (options?: {
          mode?: "readwrite";
        }) => Promise<FileSystemDirectoryHandle>
      )({ mode: "readwrite" });
      setDirectoryHandle(handle);
      setSelectedDirectoryName(handle.name);
      setResultMessage("");
    } catch {
      setResultMessage("Mappval avbröts.");
    }
  }

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!directoryHandle) {
      setResultMessage("Välj mapp innan du genererar röst.");
      return;
    }

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const response = await fetch("/api/submit", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as SubmitResponse;

    if (!data.ok || !data.files) {
      setResultMessage("Nagot gick fel nar ljudfilerna skulle skapas.");
      return;
    }

    for (const file of data.files) {
      const fileHandle = await directoryHandle.getFileHandle(file.fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(base64ToUint8Array(file.base64Audio));
      await writable.close();
    }

    setResultMessage(
      `Klart. ${data.files.length} fil(er) sparades i ${selectedDirectoryName}.`,
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Textarea
        className="w-100"
        name="userInput"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder={
          singleWords
            ? "Skriv in ord separerade med mellanslag.."
            : "Skriv in full text.."
        }
      />

      <div id="switch-container" className="flex flex-col">
        <label htmlFor="single-word">
          {singleWords ? "Single words" : "Full text"}
        </label>
        <input type="hidden" name="singleWords" value={String(singleWords)} />
        <Switch id="single-word" onClick={() => setSingleWords(!singleWords)} />
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" onClick={chooseDirectory}>
          Välj directory
        </Button>
        <span className="text-sm">
          {selectedDirectoryName ? "Toppen!" : "/Downloads/ eller liknande..."}
        </span>
      </div>

      <Button type="submit">Generera röst</Button>
      {resultMessage ? <p className="text-sm">{resultMessage}</p> : null}
    </form>
  );
}
