import {EventSystem, PipelineEventType} from "@gwaggli/events";
import {TextCompletionFinish, TextToVoiceFinish} from "@gwaggli/events/dist/events/pipeline-events";
import fs from "fs";
import {Buffer} from "buffer";
import {textToSpeech} from "../../integration/aws/aws-client";

export const registerPollyTextToSpeech = (eventSystem: EventSystem) => {
    eventSystem.on<TextCompletionFinish>(PipelineEventType.TextCompletionFinish, async (event) => {
        const voiceId = speakerForLanguage(event.language)
        const audio = await textToSpeech(event.text, speakerForLanguage(event.language));

        eventSystem.dispatch({
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

export const registerTextToSpeechPersist = (eventSystem: EventSystem) => {
    eventSystem.on<TextToVoiceFinish>(PipelineEventType.TextToVoiceFinish, async (event) => {
        const fileName = `${event.voiceId}_${new Date().getTime()}.wav`
        const path = `generated/voices/${fileName}`

        fs.writeFile(path, Buffer.from(event.audio, 'base64'), (err) => {

            eventSystem.dispatch({
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

export const registerTextToSpeech = (eventSystem: EventSystem) => {
    registerPollyTextToSpeech(eventSystem);
    registerTextToSpeechPersist(eventSystem);
}

const speakerForLanguage = (language: string) => {
    switch (language) {
        case 'de':
        case 'german':
            return "Daniel"
        case 'en':
        case 'english':
            return "Matthew"
        default:
            return "Matthew"
    }
}
