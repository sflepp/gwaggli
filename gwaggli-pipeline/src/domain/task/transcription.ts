import {EventSystem, PipelineEventType} from "@gwaggli/events";
import {VoiceActivationDataAvailable} from "@gwaggli/events/dist/events/pipeline-events";
import {transcribeUsingWhisper} from "../../integration/replicate/whisper";
import openAi from "../../integration/openai/open-ai-client";
import {Buffer} from "buffer";
import {Readable} from "stream";

export const registerReplicateWhisper = (eventSystem: EventSystem) => {
    eventSystem.on<VoiceActivationDataAvailable>(PipelineEventType.VoiceActivationDataAvailable, async (event) => {

        const generator = transcribeUsingWhisper(event.audio);

        for await (const transcriptionEvent of generator) {

            if (transcriptionEvent.status === 'succeeded' && transcriptionEvent.output !== undefined) {
                eventSystem.dispatch({
                    type: PipelineEventType.TranscriptionComplete,
                    subsystem: "pipeline",
                    sid: event.sid,
                    timestamp: Date.now(),
                    trackId: event.trackId,
                    language: transcriptionEvent.output.detected_language,
                    text: transcriptionEvent.output.transcription,
                });
            } else {
                eventSystem.dispatch(
                    {
                        type: PipelineEventType.TranscriptionProcessing,
                        subsystem: "pipeline",
                        sid: event.sid,
                        timestamp: Date.now(),
                        trackId: event.trackId,
                        status: transcriptionEvent.status,
                    }
                )
            }
        }
    });
}

export const registerOpenaiWhisper = (eventSystem: EventSystem) => {
    eventSystem.on<VoiceActivationDataAvailable>(PipelineEventType.VoiceActivationDataAvailable, async (event) => {
        const audioFile = Readable.from(Buffer.from(event.audio, 'base64')) as any
        audioFile.path = 'in-memory.wav'; // workaround, see https://github.com/openai/openai-node/issues/77

        const language = 'de'

        const transcription = await openAi.createTranscription(audioFile, 'whisper-1', undefined, undefined, undefined, language)

        eventSystem.dispatch({
            type: PipelineEventType.TranscriptionComplete,
            subsystem: "pipeline",
            sid: event.sid,
            timestamp: Date.now(),
            trackId: event.trackId,
            language: language,
            text: transcription.data.text,
        });
    });
}

export const registerTranscription = (eventSystem: EventSystem) => {
    registerOpenaiWhisper(eventSystem);
}