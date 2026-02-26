import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as dotenv from "dotenv";
import { writeFile } from "fs/promises";

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

async function createAudioFileFromText(singleWords: boolean, text: string) {
  if (singleWords) {
    const words = text.split(" ");
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
      await generateFile(word, audio);
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
    await generateFile(text, audio);
  }
}

async function generateFile(text: string, audio: ReadableStream<Uint8Array>) {
  const trimmedText = text
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "");
  const fileName = `${trimmedText}.mp3`;

  const arrayBuffer = await new Response(audio).arrayBuffer();
  await writeFile(fileName, Buffer.from(arrayBuffer));
  return fileName;
}


createAudioFileFromText(true, "Hejsan. Jag heter Tryggve");