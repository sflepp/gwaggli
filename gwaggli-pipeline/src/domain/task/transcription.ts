import {EventSystem, PipelineEventType} from "@gwaggli/events";
import {VoiceActivationDataAvailable} from "@gwaggli/events/dist/events/pipeline-events";
import {transcribeUsingWhisper} from "../../integration/replicate/whisper";

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

export const registerTranscription = (eventSystem: EventSystem) => {
    registerReplicateWhisper(eventSystem);
}