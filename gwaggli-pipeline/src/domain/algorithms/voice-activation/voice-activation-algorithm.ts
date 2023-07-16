import {WaveData} from "../../data/wave-data";

export interface VoiceActivationAlgorithm {
    currentLevel(): number;
    next(sample: Buffer): WaveData | undefined;
}