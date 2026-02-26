import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import nextEnv from "@next/env";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const { loadEnvConfig } = nextEnv;

export async function POST(request: Request) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());

  console.log("Received data:", data);

  try {
    const files = await createAudioFileFromText(
      String(data.singleWords) === "true",
      data.userInput as string,
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Audio file(s) generated successfully.",
        files,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to create audio file(s)." },
      { status: 500 },
    );
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = resolve(__dirname, "../..");

loadEnvConfig(projectDir);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error(
    "Missing ELEVENLABS_API_KEY. Add it to .env.local at the project root.",
  );
}

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

type GeneratedAudioFile = {
  fileName: string;
  base64Audio: string;
};

export async function createAudioFileFromText(
  singleWords: boolean,
  text: string,
) {
  const generatedFiles: GeneratedAudioFile[] = [];
  const usedNames = new Set<string>();

  if (singleWords) {
    const words = text
      .split(" ")
      .map((word) => word.trim())
      .filter(Boolean);

    for (const word of words) {
      const audio = await elevenlabs.textToSpeech.convert(
        "ZMs9a3j1SLzirC7aygJQ",
        {
          modelId: "eleven_v3",
          text: word,
          outputFormat: "mp3_44100_128",
          voiceSettings: {
            stability: 0,
            similarityBoost: 0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      );

      generatedFiles.push(await generateFile(word, audio, usedNames));
    }
  } else {
    const audio = await elevenlabs.textToSpeech.convert(
      "ZMs9a3j1SLzirC7aygJQ",
      {
        modelId: "eleven_v3",
        text,
        outputFormat: "mp3_44100_128",

        voiceSettings: {
          stability: 0,
          similarityBoost: 0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
    );

    generatedFiles.push(await generateFile(text, audio, usedNames));
  }

  return generatedFiles;
}

function sanitizeFileStem(text: string) {
  const stem = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");

  if (!stem) {
    return "audio";
  }

  return stem.slice(0, 64);
}

function buildUniqueFileName(stem: string, usedNames: Set<string>) {
  let candidate = `${stem}.mp3`;
  let i = 2;

  while (usedNames.has(candidate)) {
    candidate = `${stem}-${i}.mp3`;
    i += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

async function generateFile(
  text: string,
  audio: ReadableStream<Uint8Array>,
  usedNames: Set<string>,
) {
  const arrayBuffer = await new Response(audio).arrayBuffer();
  const fileName = buildUniqueFileName(sanitizeFileStem(text), usedNames);

  return {
    fileName,
    base64Audio: Buffer.from(arrayBuffer).toString("base64"),
  };
}
