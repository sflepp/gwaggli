import {EventSystem} from "@gwaggli/events";
import {registerAudioBuffering} from "./domain/task/audio-buffering";
import {
    registerVoiceActivation
} from "./domain/task/voice-activation";
import {registerTranscription} from "./domain/task/speech-to-text";
import {
    registerTextToSpeech
} from "./domain/task/text-to-speech";
import {
    registerChatStyleTextCompletion,
    registerCopilotStyleTextCompletion
} from "./domain/task/text-completion";
import {registerAdvisoryProcessing} from "./domain/task/advisory-processing";
const fs = require("fs")


export interface SubPipelineConfig {
    voiceActivationStartLevel: number;
    voiceActivationEndLevel: number;
    voiceActivationMaxLevel: number;
}
export interface PipelineConfig {
    copilot: SubPipelineConfig;
    chat: SubPipelineConfig;
    advisory: SubPipelineConfig;
}

const pipelineConfig = (JSON.parse(fs.readFileSync("./config.json"))) as PipelineConfig

export const registerChatPipeline = (eventSystem: EventSystem) => {
    registerAudioBuffering(eventSystem);
    registerVoiceActivation(eventSystem, pipelineConfig.chat);
    registerTranscription(eventSystem);
    registerChatStyleTextCompletion(eventSystem);
    registerTextToSpeech(eventSystem);
}


export const registerCopilotPipeline = (eventSystem: EventSystem) => {
    registerAudioBuffering(eventSystem)
    registerVoiceActivation(eventSystem, pipelineConfig.copilot)
    registerTranscription(eventSystem)
    registerCopilotStyleTextCompletion(eventSystem)
}

export const registerAdvisoryPipeline = (eventSystem: EventSystem) => {
    registerAudioBuffering(eventSystem)
    registerVoiceActivation(eventSystem, pipelineConfig.advisory)
    registerTranscription(eventSystem)
    registerAdvisoryProcessing(eventSystem)
    registerTextToSpeech(eventSystem)
}
