export declare function getTsConfig(): TsConfig;
export interface TsConfig {
    compilerOptions?: {
        paths?: TsPathAlias;
    };
}
export interface TsPathAlias {
    [key: string]: string[];
}
