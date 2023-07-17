import {EventSystem} from "@gwaggli/events";
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
import {registerKnowledgeLoader} from "./domain/task/knowledge-loader";

import fs from "fs";

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

const pipelineConfig = (JSON.parse(fs.readFileSync("./config.json", "utf-8"))) as PipelineConfig

export const registerChatPipeline = (eventSystem: EventSystem) => {
    registerVoiceActivation(eventSystem, pipelineConfig.chat);
    registerTranscription(eventSystem);
    registerChatStyleTextCompletion(eventSystem);
    registerTextToSpeech(eventSystem);
    registerKnowledgeLoader(eventSystem);
}


export const registerCopilotPipeline = (eventSystem: EventSystem) => {
    registerVoiceActivation(eventSystem, pipelineConfig.copilot)
    registerTranscription(eventSystem)
    registerCopilotStyleTextCompletion(eventSystem)
}

export const registerAdvisoryPipeline = (eventSystem: EventSystem) => {
    registerVoiceActivation(eventSystem, pipelineConfig.advisory)
    registerTranscription(eventSystem)
    registerAdvisoryProcessing(eventSystem)
    registerTextToSpeech(eventSystem)
}

export const registerDebugPipeline = (eventSystem: EventSystem) => {
    registerKnowledgeLoader(eventSystem);
}