// https://github.com/awsdocs/aws-doc-sdk-examples/tree/main/javascriptv3/example_code/cross-services/transcribe-streaming-app

import {AudioStream, TranscribeStreamingClient} from "@aws-sdk/client-transcribe-streaming";
import {StartStreamTranscriptionCommand} from "@aws-sdk/client-transcribe-streaming";
import {Buffer} from "buffer";
import AWS from "aws-sdk";

const SAMPLE_RATE = 16000;

interface TranscriptionResult {
    transcript: string
    isPartial: boolean
}

export async function* transcribe(audioStream: AsyncGenerator<AudioStream>): AsyncGenerator<TranscriptionResult> {
    const config = AWS.config.loadFromPath('.aws/config.json')
    
    const transcribeClient = new TranscribeStreamingClient({
        // @ts-ignore
        credentials: config.credentials,
        region: config.region
    });

    const command = new StartStreamTranscriptionCommand({
        LanguageCode: "de-DE",
        MediaEncoding: "pcm",
        MediaSampleRateHertz: SAMPLE_RATE,
        AudioStream: audioStream,
    });
    const data = await transcribeClient.send(command);

    for await (const event of data.TranscriptResultStream || []) {

        if (event.TranscriptEvent?.Transcript?.Results === undefined) {
            console.warn("No transcribe results found")
            continue;
        }

        for (const result of event.TranscriptEvent.Transcript.Results) {
            
            if (result.Alternatives === undefined || result.Alternatives[0].Items === undefined) {
                console.warn("No transcribe result alternatives found")
                continue;
            }
            
            if (result.Alternatives[0].Transcript !== undefined && result.IsPartial !== undefined) {
                yield {
                    transcript: result.Alternatives[0].Transcript,
                    isPartial: result.IsPartial
                }
            }
        }
    }
}

export async function* websocketAudioStreamGenerator(ws: WebSocket): AsyncGenerator<AudioStream> {

    const data: Buffer[] = [];
    let connectionOpen = true;

    ws.addEventListener("message", (event: MessageEvent<Buffer>) => {
        console.log("Received audio chunk from websocket (size: " + event.data.length + " bytes)")
        data.push(event.data)
    })

    ws.addEventListener("close", () => {
        connectionOpen = false;
    })

    ws.addEventListener("error", () => {
        connectionOpen = false;
    })

    while (connectionOpen) {
        const buffer = data.shift()

        if (buffer === undefined) {
            await new Promise(resolve => setTimeout(resolve, 100))
            continue;
        }

        yield {
            AudioEvent: {
                AudioChunk: buffer,
            },
        }
    }
}
