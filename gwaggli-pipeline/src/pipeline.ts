import AWS from "aws-sdk";
import {
    AudioStream,
    StartStreamTranscriptionCommand,
    TranscribeStreamingClient
} from "@aws-sdk/client-transcribe-streaming";
import {AudioData, AudioDataRingBuffer} from "./audio-data";

const Lame = require("node-lame").Lame;

interface VoiceActivationResult {
    audio: AudioData
    start: number
}

interface TranscriptionResult {
    transcript: string
    audio: AudioData
}

interface ConversationResult {

    character: string
    audio: AudioData
    transcript: string
}

export async function conversationPipeline(audioStream: AudioData) {
    console.log("Starting conversation pipeline...")

    const voiceActivationChunks = registerVoiceActivationTask(audioStream);

    registerPersistAudioChunkTask(voiceActivationChunks);

    const transcriptions = registerTranscriptionTask(voiceActivationChunks);
    const conversationChunks = registerConversationProcessingTask(transcriptions)

    for await (const conversationChunk of conversationChunks) {
        console.log("Conversation chunk: " + conversationChunk.transcript)
    }
}

export async function* registerVoiceActivationTask(audioStream: AudioData): AsyncGenerator<VoiceActivationResult> {

    console.log("Registering voice activation task...")

    const activationSize = 0.25 * audioStream.getConfig().sampleRate * audioStream.getConfig().bytesPerSample
    const deactivationSize = 2 * audioStream.getConfig().sampleRate * audioStream.getConfig().bytesPerSample

    console.log("Activation size: " + activationSize + " bytes, deactivation size: " + deactivationSize + " bytes")

    const loudnessThreshold = 200;

    let currentHead = 0;
    let lastHead = 0;

    let currentSegment: VoiceActivationResult | undefined = undefined

    while (!audioStream.isClosed()) {
        await new Promise(resolve => setTimeout(resolve, 500))

        currentHead = audioStream.currentHead();

        if (audioStream.currentHead() < Math.max(activationSize, deactivationSize)) {
            console.log("Waiting for audio stream to fill up... Current head time: " + currentHead + "")
            continue;
        }

        // Voice is currently disabled, check when to activate
        if (currentSegment === undefined) {
            const loudness = audioStream.averageLoudness(currentHead - activationSize, activationSize, 0.5);

            if (loudness > loudnessThreshold) {
                console.log("Loudness is high enough, starting voice activated segment")

                currentSegment = {
                    start: lastHead,
                    audio: new AudioDataRingBuffer(audioStream.getConfig())
                }

                yield currentSegment;
            }
        }

        // voice is currently enabled, check when to deactivate
        if (currentSegment !== undefined) {
            currentSegment.audio.write(audioStream.read(lastHead, currentHead - lastHead))

            if (currentHead - currentSegment.start > deactivationSize) {
                const loudness = audioStream.averageLoudness(currentHead - deactivationSize, deactivationSize, 0.5);

                if (loudness < loudnessThreshold) {
                    console.log("Loudness is low enough, ending voice activated segment")
                    currentSegment.audio.close();
                    currentSegment = undefined;
                }
            }
        }

        lastHead = currentHead;
    }

    console.log("Audio stream closed, ending voice activation stream")
}

export async function registerPersistAudioChunkTask(voiceActivatedSegments: AsyncGenerator<VoiceActivationResult>) {
    console.log("Registering persist audio chunk task...")

    const chunkSize = 16_000;

    for await (const segment of voiceActivatedSegments) {
        console.log("Start writing audio chunk to file...")
        let offset = 0;
        let buffer = Buffer.from([]);

        while (!segment.audio.isClosed()) {
            if (offset + chunkSize > segment.audio.currentHead()) {
                await new Promise(resolve => setTimeout(resolve, 10))
                continue;
            }
            
            buffer = Buffer.concat([buffer, segment.audio.read(offset, chunkSize)])
            offset += chunkSize;
        }
        
        console.log(buffer.length)
            

        const encoder = new Lame({
            "output": "./generated/voice-activation/audio-" + new Date().getTime() + ".mp3",
            bitrate: 16,
            bitwidth: 16,
            raw: true,
            mode: 'm'
            
        }).setBuffer(buffer);
        
        await encoder.encode();
        
        console.log("Completed writing audio chunk to file.")
    }
}

export async function* registerTranscriptionTask(voiceActivatedSegments: AsyncGenerator<VoiceActivationResult>): AsyncGenerator<TranscriptionResult> {

    console.log("Registering transcription task...")

    const config = AWS.config.loadFromPath('.aws/config.json')

    const transcribeClient = new TranscribeStreamingClient({
        // @ts-ignore
        credentials: config.credentials,
        region: config.region
    });

    for await (const segment of voiceActivatedSegments) {
        console.log("Start transcription task for audio chunk...")

        const audioStream = createAudioStream(segment, 8000);

        const command = new StartStreamTranscriptionCommand({
            LanguageCode: "en-US",
            MediaEncoding: segment.audio.getConfig().mediaFormat,
            MediaSampleRateHertz: segment.audio.getConfig().sampleRate,
            AudioStream: audioStream,
        });

        const data = await transcribeClient.send(command);

        for await (const event of data.TranscriptResultStream || []) {

            if (event.TranscriptEvent?.Transcript?.Results === undefined) {
                console.warn("No transcribe results found")
                continue;
            }

            if (event.TranscriptEvent.Transcript.Results.length === 0) {
                console.warn("No transcribe results found")
                continue;
            }

            if (event.TranscriptEvent.Transcript.Results[0].IsPartial) {
                console.log("Partial transcript found, skipping...")
                continue;
            }

            if (event.TranscriptEvent.Transcript.Results[0].Alternatives === undefined
                || event.TranscriptEvent.Transcript.Results[0].Alternatives.length === 0
                || event.TranscriptEvent.Transcript.Results[0].Alternatives[0].Transcript === undefined) {
                console.warn("No transcript found")
                continue;
            }

            console.log("Transcription complete, yielding results...")

            yield {
                transcript: event.TranscriptEvent.Transcript.Results[0].Alternatives[0].Transcript,
                audio: segment.audio,
            }
        }

        console.log("Completed transcription task for audio chunk...")
    }
}

async function* createAudioStream(segment: VoiceActivationResult, chunkSize: number): AsyncIterable<AudioStream> {
    const audio = segment.audio;

    let head = 0;
    while (!audio.isClosed()) {
        if (head + chunkSize > audio.currentHead()) {
            await new Promise(resolve => setTimeout(resolve, 10))
            continue;
        }

        const chunk = audio.read(head, chunkSize);
        head += chunkSize;

        yield {
            AudioEvent: {
                AudioChunk: chunk
            }
        }
    }
}


async function* registerConversationProcessingTask(transcriptions: AsyncGenerator<TranscriptionResult>) {
    console.log("Registering conversation processing task...")

    for await (const transcript of transcriptions) {
        yield {
            character: 'customer',
            audio: transcript.audio,
            transcript: transcript.transcript
        }
    }
}