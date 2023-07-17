import { Advisory } from '../domain/model/advisory/advisory';

const inMemoryData: Advisory[] = [];

export class AdvisoryRepository {
    findById(id: string): Advisory | undefined {
        return copy(inMemoryData.find((advisory) => advisory.id === id));
    }

    findBySid(sid: string): Advisory | undefined {
        return copy(inMemoryData.find((advisory) => advisory.sids.includes(sid)));
    }

    save(advisory: Advisory): void {
        const advisoryCopy = copy(advisory);
        if (advisoryCopy === undefined) {
            return;
        }
        const index = inMemoryData.findIndex((a) => a.id === advisory.id);
        if (index === -1) {
            inMemoryData.push(advisoryCopy);
        } else {
            inMemoryData[index] = advisoryCopy;
        }
    }

    findAll(): Advisory[] {
        return inMemoryData;
    }
}

function copy<T>(obj: T | undefined): T | undefined {
    if (obj === undefined) {
        return undefined;
    }
    return JSON.parse(JSON.stringify(obj));
}

export const advisoryRepository = new AdvisoryRepository();
