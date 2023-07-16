import {WaveData} from "../../data/wave-data";

export interface VoiceActivationAlgorithm {
    isActive(): boolean;
    currentLevel(): number;
    next(sample: Buffer): WaveData | undefined;
}