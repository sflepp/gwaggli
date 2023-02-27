import {EventSystem} from "@gwaggli/events";
import {registerAudioBuffering} from "./domain/task/audio-buffering";
import {
    registerVoiceActivation
} from "./domain/task/voice-activation";
import {registerTranscription} from "./domain/task/transcription";
import {
    registerTextToSpeech
} from "./domain/task/text-to-speech";
import {registerChatStyleTextCompletion, registerSuggestionStyleTextCompletion} from "./domain/task/text-completion";

export const registerChatPipeline = (eventSystem: EventSystem) => {
    registerAudioBuffering(eventSystem);
    registerVoiceActivation(eventSystem);
    registerTranscription(eventSystem);
    registerChatStyleTextCompletion(eventSystem);
    registerTextToSpeech(eventSystem);
}


export const registerSuggestionPipeline = (eventSystem: EventSystem) => {
    registerAudioBuffering(eventSystem)
    registerVoiceActivation(eventSystem)
    registerTranscription(eventSystem)
    registerSuggestionStyleTextCompletion(eventSystem)
}