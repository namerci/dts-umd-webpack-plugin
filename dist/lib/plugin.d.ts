import { TsConfig } from './getTsConfig';
interface PluginOptions {
    dir: string;
    entry: string;
    output?: string;
    moduleName?: string;
    cleanDts: boolean;
}
export interface Options {
    dir: string;
    moduleName: string;
    output: string;
    entry: string;
    cleanDts: boolean;
    tsConfig: TsConfig;
}
export declare class DefinitionBundlePlugin {
    options: Options;
    constructor(properties: PluginOptions);
    apply(compiler: any): void;
}
export {};
