import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { DefinitionFile } from './collectImportAndExports';
import { processString } from 'typescript-formatter';
import { Options } from './plugin';

export function writeDefinitionFile(definitions: DefinitionFile[], options: Options): Promise<any> {
    const definitionSource = writeDefinitions(definitions, options.moduleName);
    const mainModuleSource = writeMainModule(options.moduleName, options.entry);
    const outputDir = join(options.output, options.moduleName);

    return Promise.all([
        formatAndSave(mainModuleSource, outputDir, 'index.d.ts'),
        formatAndSave(definitionSource, outputDir, `${options.moduleName}.d.ts`),
    ]);
}

function formatAndSave(source: string, dir: string, filename: string) {
    if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true});
    }

    return processString('', source, {} as any).then(res => {
        writeFileSync(join(dir, filename), res.message);
    })
}

function writeMainModule(moduleName: string, entry: string) {

    return `
        /// <reference path='./${moduleName}.d.ts' />
    
        import __module = require('${moduleName}/${removeExtension(entry)}');
        export = __module;
        export as namespace ${moduleName};
        
        declare global {
            var ${moduleName}: typeof __module;
        }
    `
}

function writeDefinitions(definitions: DefinitionFile[], moduleName: string) {
    const contents = definitions.map(definition => {
        const modulePath = removeExtension(join(moduleName, definition.path));

        const source = definition.imports.reduce((source, path) => {
            const importModulePath = join(moduleName, path.replaceTo);

            return source.replace(path.path, importModulePath);
        }, definition.source);

        return declareModule(modulePath, source);
    });

    return contents.join('\n');
}


function declareModule(modulePath: string, source: string) {
    return `
    declare module '${modulePath}' {
        ${source}
    }
    `
}

function removeExtension(path: string) {
    return path
        .replace('.d.ts', '')
        .replace('.ts', '')
}
