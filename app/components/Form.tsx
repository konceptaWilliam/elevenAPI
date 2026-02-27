"use client";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const buffer = new ArrayBuffer(binary.length) as ArrayBuffer;
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function downloadToDefaultLocation(fileName: string, fileBytes: Uint8Array) {
  const blobBytes = new Uint8Array(fileBytes);
  const blob = new Blob([blobBytes.buffer], { type: "audio/mpeg" });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}

export default function Form() {
  const [singleWords, setSingleWords] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [tryggveOrJoy, setTryggveOrJoy] = useState("tryggve");

  const [isBusy, setIsBusy] = useState(false);
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [selectedDirectoryName, setSelectedDirectoryName] = useState("");

  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [currentFile, setCurrentFile] = useState<GeneratedAudioFile | null>(
    null,
  );
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  useEffect(() => {
    return () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
    };
  }, [currentAudioUrl]);

  async function chooseDirectory() {
    if (!("showDirectoryPicker" in window)) {
      setResultMessage("Din webblasare stodjer inte mappval.");
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
      setResultMessage("Mappval avbrots.");
    }
  }

  async function onDirectoryButtonClick() {
    if (directoryHandle) {
      setDirectoryHandle(null);
      setSelectedDirectoryName("");
      setResultMessage("Custom directory togs bort. Sparar i standardplats.");
      return;
    }

    await chooseDirectory();
  }

  async function fetchSingleAudio(text: string) {
    const formData = new FormData();
    formData.append("singleWords", "false");
    formData.append("userInput", text);
    formData.append("tryggveOrJoy", tryggveOrJoy);

    const response = await fetch("/api/submit", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as SubmitResponse;

    if (!data.ok || !data.files || data.files.length === 0) {
      throw new Error("Failed to create audio");
    }

    return data.files[0];
  }

  async function generateForItem(text: string) {
    setIsBusy(true);

    try {
      const file = await fetchSingleAudio(text);
      const fileBytes = base64ToUint8Array(file.base64Audio);
      const blobBytes = new Uint8Array(fileBytes);
      const blob = new Blob([blobBytes.buffer], { type: "audio/mpeg" });
      const previewUrl = URL.createObjectURL(blob);

      setCurrentAudioUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return previewUrl;
      });

      setCurrentFile(file);
      setResultMessage("");
    } catch {
      setCurrentFile(null);
      setResultMessage("Nagot gick fel nar ljudet skulle skapas.");
    } finally {
      setIsBusy(false);
    }
  }

  async function goToNextItem(saveCurrent: boolean) {
    const nextIndex = (currentIndex ?? 0) + 1;
    const nextSavedCount = saveCurrent ? savedCount + 1 : savedCount;

    if (nextIndex >= queue.length) {
      setCurrentIndex(null);
      setCurrentFile(null);
      setCurrentAudioUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return null;
      });
      setQueue([]);
      setSavedCount(nextSavedCount);

      const totalSkipped = skippedCount + (saveCurrent ? 0 : 1);
      setResultMessage(
        `Klart. Sparade ${nextSavedCount} fil(er), skippade ${totalSkipped} fil(er).`,
      );
      setIsBusy(false);
      return;
    }

    if (saveCurrent) {
      setSavedCount(nextSavedCount);
    }

    setCurrentIndex(nextIndex);
    await generateForItem(queue[nextIndex]);
  }

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedInput = userInput.trim();
    if (!normalizedInput) {
      setResultMessage("Skriv in text innan du genererar.");
      return;
    }

    const items = singleWords
      ? normalizedInput
          .split(" ")
          .map((word) => word.trim())
          .filter(Boolean)
      : [normalizedInput];

    if (items.length === 0) {
      setResultMessage("Hittade inga ord att generera.");
      return;
    }

    setQueue(items);
    setCurrentIndex(0);
    setCurrentFile(null);
    setSavedCount(0);
    setSkippedCount(0);
    setResultMessage("");

    await generateForItem(items[0]);
  }

  async function onApproveCurrent() {
    if (!currentFile || isBusy) {
      return;
    }

    setIsBusy(true);

    try {
      const fileBytes = base64ToUint8Array(currentFile.base64Audio);

      if (directoryHandle) {
        const fileHandle = await directoryHandle.getFileHandle(
          currentFile.fileName,
          {
            create: true,
          },
        );
        const writable = await fileHandle.createWritable();
        await writable.write(fileBytes);
        await writable.close();
      } else {
        downloadToDefaultLocation(currentFile.fileName, fileBytes);
      }

      await goToNextItem(true);
    } catch {
      setResultMessage("Kunde inte spara filen.");
      setIsBusy(false);
    }
  }

  async function onRegenerateCurrent() {
    if (isBusy || currentIndex === null) {
      return;
    }

    await generateForItem(queue[currentIndex]);
  }

  async function onSkipCurrent() {
    if (isBusy || currentIndex === null) {
      return;
    }

    setIsBusy(true);
    setSkippedCount((value) => value + 1);
    await goToNextItem(false);
  }

  return (
    <div className="flex flex-row gap-2">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Textarea
          className="w-100"
          name="userInput"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={
            singleWords
              ? "Skriv in ett eller flera ord separerade med mellanslag.."
              : "Skriv in full text.."
          }
        />

        <div id="switch-container" className="flex flex-col">
          <label htmlFor="single-word">
            {singleWords ? "Enstaka ord" : "Full text"}
          </label>
          <input type="hidden" name="singleWords" value={String(singleWords)} />
          <Switch
            id="single-word"
            onClick={() => setSingleWords(!singleWords)}
          />
        </div>

        <RadioGroup
          value={tryggveOrJoy}
          onValueChange={setTryggveOrJoy}
          defaultValue="tryggve"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tryggve" id="r1" />
            <label htmlFor="r1">Tryggve</label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="joy" id="r2" />
            <label htmlFor="r2">Joy</label>
          </div>
        </RadioGroup>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={onDirectoryButtonClick}>
            {directoryHandle ? "Ta bort custom directory" : "Välj directory"}
          </Button>
          <span className="text-sm">
            {selectedDirectoryName ? "Toppen!" : "/Downloads/ per default"}
          </span>
        </div>

        <Button type="submit" disabled={isBusy}>
          Generera röst
        </Button>
        {resultMessage ? (
          <p className="text-sm animate-pulse">{resultMessage}</p>
        ) : null}
      </form>
      {currentIndex !== null ? (
        <div className="flex flex-col gap-3 rounded p-3">
          <p className="text-sm">
            ({currentIndex + 1}/{queue.length}):{" "}
            <strong>{queue[currentIndex]}</strong>
          </p>
          {currentAudioUrl ? <audio controls src={currentAudioUrl} /> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onApproveCurrent}
              disabled={!currentFile || isBusy}
              className="bg-green-400"
            >
              Den är bra!
            </Button>
            <Button
              type="button"
              onClick={onRegenerateCurrent}
              disabled={isBusy}
            >
              Ge mig en ny.
            </Button>
            <Button
              type="button"
              onClick={onSkipCurrent}
              disabled={isBusy}
              className="bg-red-400"
            >
              Skippa det här ordet..
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
