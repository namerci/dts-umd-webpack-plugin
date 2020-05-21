import { join } from 'path';
import { gatherAllDefinitionFiles } from './collectImportAndExports';
import { writeDefinitionFile } from './writeDefinitionFile';
import { existsSync, unlinkSync } from 'fs';
import { getTsConfig, TsConfig } from './getTsConfig';

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

export class DefinitionBundlePlugin {
    options: Options;

    constructor(properties: PluginOptions) {
        this.options = {
            dir: properties.dir || 'src',
            output: properties.output || './',
            moduleName: properties.moduleName || 'MyLib',
            entry: properties.entry || 'index.ts',
            cleanDts: properties.cleanDts,
            tsConfig: getTsConfig(),
        }
    }

    apply(compiler: any) {
        this.options.output = join(getWebpackOutputPath(compiler), this.options.output);

        compiler.plugin('done', () => {
            const definitions = gatherAllDefinitionFiles(this.options.dir, this.options.tsConfig);

            writeDefinitionFile(definitions, this.options).then(() => {
                if (this.options.cleanDts) {
                    definitions.forEach(definition => {
                        const path = join(this.options.dir, definition.path);

                        // remove only .d.ts if source exist
                        if (existsSync(path.replace('.d.ts', '.ts'))) {
                            unlinkSync(join(this.options.dir, definition.path));
                        }
                    })
                }
            });
        });
    }
}

function getWebpackOutputPath(compiler: any) {
    const conf = compiler.options || {};
    return compiler.outputPath || (conf.output && conf.output.path);
}
