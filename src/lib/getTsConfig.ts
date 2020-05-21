import {existsSync, readFileSync} from 'fs';

export function getTsConfig(): TsConfig {
    if(existsSync('tsconfig.json')) {
        return JSON.parse(readFileSync('tsconfig.json').toString());
    }

    return {};
}

export interface TsConfig {
    compilerOptions?: {
        paths?: TsPathAlias;
    }
}

export interface TsPathAlias {
    [key: string]: string[]
}
