import * as fs from "fs";
import WebSocket from 'ws';
import {Configuration, OpenAIApi} from "openai";
import {textToSpeech} from "./text-to-speech-file";
import {WaveData} from "./domain/wave-data";
import {dispatch, on} from "./event-system/event-system";
import {
    AudioBufferUpdate,
    PipelineEventType, TextCompletionFinish, TextToVoiceFinish, TranscriptionComplete, VoiceActivationDataAvailable,
    VoiceActivationEnd, VoiceActivationPersist,
    VoiceActivationStart
} from "./event-system/events/pipeline-events";
import {AudioChunk, ClientEventType} from "./event-system/events/client-events";
import {Buffer} from "buffer";

const crypto = require('crypto');
const {v4: uuidv4} = require('uuid')

interface WhisperTranscribeEvent {
    trackId: string;
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

export const registerPipeline = () => {
    registerAudioBuffering();
    registerVoiceActivationDetection();
    registerVoiceActivationDataProcessing();
    registerVoiceActivationPersist();
    registerWhisperTranscribe();
    registerGpt3CompletionProcessing();
    registerPollyTextToSpeech();
    registerTextToSpeechPersist();
}

export const registerAudioBuffering = () => {
    let buffers: Map<string, WaveData> = new Map<string, WaveData>();

    on<AudioChunk>(ClientEventType.AudioChunk, (event) => {
        let existingChunk = buffers.get(event.sid);
        const newChunk = new WaveData(Buffer.from(event.audio, 'base64'));

        if (existingChunk === undefined) {
            existingChunk = newChunk;
        } else {
            existingChunk = existingChunk.merge(newChunk);
        }

        buffers.set(event.sid, existingChunk);

        dispatch({
            type: PipelineEventType.AudioBufferUpdate,
            subsystem: "pipeline",
            sid: event.sid,
            timestamp: Date.now(),
            audio: existingChunk.buffer.toString('base64')
        })
    });
}

export const registerVoiceActivationDetection = () => {
    const voiceActivation = new Map<string, VoiceActivationStart>()

    const voiceActivationStartLevel = 500;
    const voiceActivationEndLevel = 200;

    on<AudioBufferUpdate>(PipelineEventType.AudioBufferUpdate, (event) => {
        let windowDuration = 1000; // milliseconds

        const audio = new WaveData(Buffer.from(event.audio, 'base64'));

        const startMarker = Math.max(audio.getDuration() - windowDuration, 0);
        const endMarker = audio.getDuration()

        const samples = [];
        for (let i = startMarker; i <= endMarker; i += 10) {
            const loudness = audio.getLoudnessAt(i)
            samples.push(loudness);
        }

        const averageLoudness = samples.reduce((a, b) => a + b, 0) / samples.length;

        if (voiceActivation.has(event.sid)) {
            dispatch({
                type: PipelineEventType.VoiceActivationLevelUpdate,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                level: 100
            })
        } else {
            dispatch({
                type: PipelineEventType.VoiceActivationLevelUpdate,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                level: Math.round(averageLoudness / voiceActivationStartLevel * 100)
            })
        }

        if (!voiceActivation.has(event.sid) && averageLoudness > voiceActivationStartLevel) {

            const trackId = uuidv4();

            const voiceActivationStart: VoiceActivationStart = {
                type: PipelineEventType.VoiceActivationStart,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                trackId: trackId,
                startMarker: startMarker
            }

            voiceActivation.set(event.sid, voiceActivationStart)

            dispatch(voiceActivationStart)
        }

        if (voiceActivation.has(event.sid) && averageLoudness < voiceActivationEndLevel) {

            dispatch({
                type: PipelineEventType.VoiceActivationEnd,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                trackId: (voiceActivation.get(event.sid) as VoiceActivationStart).trackId,
                endMarker: endMarker
            })

            voiceActivation.delete(event.sid)
        }
    });
}

export const registerVoiceActivationDataProcessing = () => {

    let bufferedData: WaveData;
    const startEvents: VoiceActivationStart[] = []

    on<AudioBufferUpdate>(PipelineEventType.AudioBufferUpdate, (event) => {
        bufferedData = new WaveData(Buffer.from(event.audio, 'base64'));
    });

    on<VoiceActivationStart>(PipelineEventType.VoiceActivationStart, (startEvent) => {
        startEvents.push(startEvent);
    });

    on<VoiceActivationEnd>(PipelineEventType.VoiceActivationEnd, (endEvent) => {
        const startEvent = startEvents.find((startEvent) => startEvent.trackId === endEvent.trackId)

        if (startEvent) {
            const startIndex = bufferedData.getByteIndexAtTime(startEvent.startMarker);
            const endIndex = bufferedData.getByteIndexAtTime(endEvent.endMarker);

            const audio = bufferedData.slice(startIndex, endIndex);

            dispatch({
                type: PipelineEventType.VoiceActivationDataAvailable,
                subsystem: "pipeline",
                sid: startEvent.sid,
                timestamp: Date.now(),
                trackId: startEvent.trackId,
                audio: audio.buffer.toString('base64')
            })
        }
    });
}

export const registerVoiceActivationPersist = () => {
    on<VoiceActivationDataAvailable>(PipelineEventType.VoiceActivationDataAvailable, (event) => {
        const hash = crypto
            .createHash('sha256')
            .update(event.audio)
            .digest('hex');

        const fileName = `audio-${new Date().getTime()}-${hash}.wav`
        const path = `../gwaggli-whisper/data/${fileName}`;

        fs.writeFileSync(path, Buffer.from(event.audio, 'base64'));

        dispatch({
            type: PipelineEventType.VoiceActivationPersist,
            subsystem: "pipeline",
            sid: event.sid,
            timestamp: Date.now(),
            trackId: event.trackId,
            fileName: fileName
        });
    });
}

// ToDo: Invert dependency
export const registerWhisperTranscribe = () => {
    on<VoiceActivationPersist>(PipelineEventType.VoiceActivationPersist, (event) => {
        const whisperWS = new WebSocket("ws://localhost:8765");

        whisperWS.addEventListener("open", () => {
            whisperWS.send(JSON.stringify(event));
        });

        whisperWS.addEventListener("message", (whisperEvent: any) => {
            const data = JSON.parse(whisperEvent.data) as WhisperTranscribeEvent

            dispatch({
                type: PipelineEventType.TranscriptionComplete,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                trackId: event.trackId,
                language: data.language,
                text: data.text,
            });

            whisperWS.close();
        });
    });
}

export const registerGpt3CompletionProcessing = () => {

    const openAiConfig = JSON.parse(fs.readFileSync(".openai/config.json", "utf8"));

    const configuration = new Configuration({
        apiKey: openAiConfig.apiKey,
    })

    const openAi = new OpenAIApi(configuration);

    const history = new Map<string, {
        prompt: string,
        answer: string
    }[]>();


    on<TranscriptionComplete>(PipelineEventType.TranscriptionComplete, async (event) => {
        const currentHistory = history.get(event.sid) || [];
        const historyPrompt = currentHistory.map((historyEntry) => {
            return `Human: ${historyEntry.prompt}\nAI copilot: ${historyEntry.answer}\n`
        }).join("\n") || '';

        const prompt = "The following is a conversation with an AI text copilot on the side of a human. The AI copilot listens to the conversation and tries to give interesting, funny, smart and clever inputs, which the human can use to improve the conversation" +
            `${historyPrompt}\nHuman: ${event.text}\nAI copilot: `;

        console.log(prompt)


        try {
            const response = await openAi.createCompletion({
                model: "text-davinci-003",
                prompt: prompt,
                temperature: 0.6,
                max_tokens: 3000,
            });


            const answer = response.data.choices[0].text || '';

            history.set(event.sid, [...currentHistory, {
                prompt: event.text,
                answer: answer
            }]);

            dispatch({
                type: PipelineEventType.TextCompletionFinish,
                subsystem: "pipeline",
                sid: event.sid,
                timestamp: Date.now(),
                trackId: event.trackId,
                language: event.language,
                text: answer,
            });
        } catch (error) {
            console.log(error)
        }
    });
}

export const registerPollyTextToSpeech = () => {
    on<TextCompletionFinish>(PipelineEventType.TextCompletionFinish, async (event) => {
        const voiceId = speakerForLanguage(event.language)
        const audio = await textToSpeech(event.text, speakerForLanguage(event.language));

        dispatch({
            type: PipelineEventType.TextToVoiceFinish,
            subsystem: "pipeline",
            sid: event.sid,
            timestamp: Date.now(),
            trackId: event.trackId,
            language: event.language,
            voiceId: voiceId,
            audio: audio.buffer.toString('base64'),
        })
    });
}

export const registerTextToSpeechPersist = () => {
    on<TextToVoiceFinish>(PipelineEventType.TextToVoiceFinish, async (event) => {
        const fileName = `${event.voiceId}_${new Date().getTime()}.wav`
        const path = `generated/voices/${fileName}`

        fs.writeFile(path, Buffer.from(event.audio, 'base64'), (err) => {

            dispatch({
                type: PipelineEventType.VoicePersist,
                subsystem: "pipeline",
                timestamp: Date.now(),
                sid: event.sid,
                trackId: event.trackId,
                fileName: fileName,
            });

            if (err) {
                console.error(err);
            }
        });
    });
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
