import EventEmitter from "events";
import {Buffer} from "buffer";
import {report} from "./reporter";
import * as fs from "fs";

const crypto = require('crypto');
import WebSocket from 'ws';
import {Configuration, OpenAIApi} from "openai";
import {textToSpeech} from "./text-to-speech";
import { WaveData } from "./domain/wave-data";

interface VoiceActivationStartEvent {
    waveData: WaveData;
    startTime: number;
}

interface VoiceActivationEndEvent {
    waveData: WaveData;
    startTime: number;
    endTime: number;
}

interface WhisperTranscribeEvent {
    language: string;
    segments: {
        avg_logprob: number;
        compression_ratio: number;
        end: number;
        id: number;
        no_speech: number;
        seek: number;
        start: number;
        text: string;
        tokens: number[]
    }[];
    text: string;
}

interface Gpt3TextCompletionEvent {
    language: string;
    prompt: string;
    answer: string;
}

export interface ConversationChunkEvent {
    language: string;
    prompt: string;
    answer: string;
    fileName: string;
}

export const reportAudioChunk = (pipeline: EventEmitter, audioChunk: Buffer) => {
    pipeline.emit("audio-chunk", audioChunk);
}

export const reportStreamEnd = (pipeline: EventEmitter) => {
    pipeline.emit("stream-end");
}

export const reportError = (pipeline: EventEmitter, error: any) => {
    pipeline.emit("connection-error", error);
}

export const registerPipeline = (pipeline: EventEmitter) => {
    registerBuffering(pipeline);
    registerVoiceActivation(pipeline);
    registerSliceVoiceActivation(pipeline);
    registerPersistChunks(pipeline);
    registerWhisperTranscribe(pipeline);
    registerGpt3CompletionProcessing(pipeline);
    registerPollyTextToSpeech(pipeline);
}

export const registerBuffering = (pipeline: EventEmitter) => {
    let waveData: WaveData;

    pipeline.on("audio-chunk", (audioChunk: Buffer) => {
        if (waveData === undefined) {
            waveData = new WaveData(audioChunk)
        } else {
            waveData = waveData.merge(new WaveData(audioChunk));
        }

        pipeline.emit("wave-data", waveData);
    });
}

export const registerVoiceActivation = (pipeline: EventEmitter) => {

    let currentVoiceActivationStart: VoiceActivationStartEvent | undefined;

    pipeline.on("wave-data", (waveData: WaveData) => {
        let windowDuration = 2000; // milliseconds

        const start = Math.max(waveData.getDuration() - windowDuration, 0);
        const end = waveData.getDuration()

        const samples = [];
        for (let i = start; i <= end; i += 10) {
            const loudness = waveData.getLoudnessAt(i)
            samples.push(loudness);
        }

        const averageLoudness = samples.reduce((a, b) => a + b, 0) / samples.length;

        report({
            type: "progress",
            message: "Average loudness",
            data: averageLoudness,
        })

        if (!currentVoiceActivationStart && averageLoudness > 500) {
            currentVoiceActivationStart = {
                waveData,
                startTime: start,
            }

            report({
                type: "progress",
                message: "Voice activation start",
                data: currentVoiceActivationStart,
            })

            pipeline.emit("start-voice-activation", currentVoiceActivationStart);
        }

        if (currentVoiceActivationStart && averageLoudness < 100) {
            const currentVoiceActivationEnd = {
                waveData,
                startTime: currentVoiceActivationStart.startTime,
                endTime: end,
            }

            report({
                type: "progress",
                message: "Voice activation end",
                data: currentVoiceActivationEnd,
            })

            pipeline.emit("end-voice-activation", currentVoiceActivationEnd);

            currentVoiceActivationStart = undefined;
        }
    });
}

export const registerSliceVoiceActivation = (pipeline: EventEmitter) => {
    pipeline.on("end-voice-activation", (voiceActivationEnd: VoiceActivationEndEvent) => {
        const waveData = voiceActivationEnd.waveData;
        const startTime = voiceActivationEnd.startTime;
        const startIndex = waveData.getByteIndexAtTime(startTime);
        const endTime = voiceActivationEnd.endTime;
        const endIndex = waveData.getByteIndexAtTime(endTime);

        const waveDataChunk = waveData.slice(startIndex, endIndex);

        pipeline.emit("voice-activated-chunk", waveDataChunk);
    });
}

export const registerPersistChunks = (pipeline: EventEmitter) => {
    pipeline.on("voice-activated-chunk", (waveData: WaveData) => {
        report({
            type: "progress",
            message: "Persisting chunk",
            data: waveData,
        })

        const hash = crypto
            .createHash('sha256')
            .update(waveData.buffer)
            .digest('hex');

        const fileName = `audio-${new Date().getTime()}-${hash}.wav`
        const path = `../gwaggli-whisper/data/${fileName}`;

        fs.writeFileSync(path, waveData.buffer);

        pipeline.emit("persisted-wav", fileName);
    });
}

export const registerWhisperTranscribe = (pipeline: EventEmitter) => {
    pipeline.on("persisted-wav", (fileName: string) => {
        const whisperWS = new WebSocket("ws://localhost:8765");

        whisperWS.addEventListener("open", () => {
            whisperWS.send(fileName);
        });

        whisperWS.addEventListener("message", (event: any) => {
            const data = JSON.parse(event.data) as WhisperTranscribeEvent

            report({
                type: "progress",
                message: "Transcription result from whisper...",
                data,
            });

            pipeline.emit("transcription-result", data);
            whisperWS.close();
        });
    })
}

export const registerGpt3CompletionProcessing = (pipeline: EventEmitter) => {

    const openAiConfig = JSON.parse(fs.readFileSync(".openai/config.json", "utf8"));

    const configuration = new Configuration({
        apiKey: openAiConfig.apiKey,
    })

    const openAi = new OpenAIApi(configuration);

    pipeline.on("transcription-result", async (transcription: WhisperTranscribeEvent) => {
        const prompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly. The assistant can speak all sorts of languages.

            Human: Hello, who are you?
            AI: I am very good today, may I introduce me to you: I am an assistant that can help you with all sorts of things.
            Human: ${transcription.text}
            AI: `


        const response = await openAi.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 0.6,
            max_tokens: 500,
        });

        const data = response.data

        report({
            type: "progress",
            message: "OpenAI response...",
            data,
        })

        const answer = response.data.choices[0].text || '';

        const event: Gpt3TextCompletionEvent = {
            language: transcription.language,
            prompt: transcription.text,
            answer: answer
        }

        pipeline.emit("gpt3-response", event);
    });
}

export const registerPollyTextToSpeech = (pipeline: EventEmitter) => {
    pipeline.on("gpt3-response", async (gpt3Event: Gpt3TextCompletionEvent) => {
        const fileName = await textToSpeech(gpt3Event.answer, speakerForLanguage(gpt3Event.language));

        const event: ConversationChunkEvent = {
            ...gpt3Event,
            fileName: fileName
        }

        pipeline.emit("text-to-speech", event);
    })
}

const speakerForLanguage = (language: string) => {
    switch (language) {
        case 'de':
            return "Daniel"
        case 'en':
            return "Matthew"
        default:
            return "Matthew"
    }
}