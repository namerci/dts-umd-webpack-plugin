import { TsConfig } from './getTsConfig';
export interface DefinitionFile {
    path: string;
    source: string;
    imports: Import[];
}
interface Import {
    path: string;
    replaceTo: string;
}
export declare function gatherAllDefinitionFiles(rootDir: string, tsConfig: TsConfig): DefinitionFile[];
export {};
