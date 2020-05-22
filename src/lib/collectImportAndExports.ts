import { readFileSync, readdirSync, statSync, existsSync, lstatSync } from 'fs';
import { join, relative, dirname } from 'path';
import { TsConfig, TsPathAlias } from './getTsConfig';

export interface DefinitionFile {
    path: string,
    source: string;
    imports: Import[]
}

interface Import {
    path: string;
    replaceTo: string;
}

function extractExportPath(source: string): string[] {
    const matches = source.match(/ from ['"](.+)['"]/g);
    const importFuncMatches = source.match(/ import\((.+)\)/g);
    const paths: string[] = [];

    if (matches && matches.length) {
        matches.forEach(match => {
            const m = match.match(/ from ['"](.+)['"]/);

            if(m) {
                paths.push(m[1]);
            }
        });
    }

    if (importFuncMatches && importFuncMatches.length) {
        importFuncMatches.forEach(match => {
            const m = match.match(/ import\(['"](.+)['"]\)/);

            if(m) {
                paths.push(m[1]);
            }
        });
    }

    return paths;
}

function resolveAlias(filePath: string, importPath: string, aliases?: TsPathAlias): string {
    if (!aliases) {
        return join(dirname(filePath), importPath);
    }

    const keys = Object.keys(aliases);
    if (!keys.length) {
        return join(dirname(filePath), importPath);
    }

    return keys.reduce((p, key) => {
        const from = stripWildcard(key);
        const target = aliases[key];

        if (Array.isArray(target)) {
            return target.reduce((f, t) => f.replace(from, stripWildcard(t)), p)
        }

        return p.replace(from, stripWildcard(target));
    }, importPath);
}

function stripWildcard(path: string): string {
    return path.replace('/*', '');
}

function convertDefinitionToSource(definitionContent: string): string {
    return definitionContent.replace(/declare /g, '')
}

function resolvePath(sourcePath: string, destPath: string, rootDir: string, aliases: TsPathAlias = {}): string {
    let path = destPath;

    if(path.startsWith('./')) {
        return join(dirname(sourcePath), destPath)
    }

    if(path.startsWith('@')) {
        path = resolveAlias(sourcePath, destPath, aliases);

        return appendIndexIfDirectory(rootDir, path);
    }

    path = join(dirname(sourcePath), path);

    return appendIndexIfDirectory(rootDir, path);
}

function appendIndexIfDirectory(rootDir: string, path: string): string {
    const rootPath = join(rootDir, path);

    if (existsSync(rootPath)) {
        const stats = lstatSync(rootPath);

        if(stats.isDirectory()) {
            path = join(path, 'index');
        }
    }

    return path;
}

export function gatherAllDefinitionFiles(rootDir: string, tsConfig: TsConfig): DefinitionFile[] {
    const files = walkSync(rootDir);

    return files.filter(isDefinitionFile).map(file => {
        const source: string = convertDefinitionToSource(readFileSync(file).toString());
        const path: string = relative(rootDir, file);
        const imports: any[] = extractExportPath(source)
            .filter(Boolean)
            .map(p => {
                return {
                    path: p,
                    replaceTo: resolvePath(path, p, rootDir, tsConfig.compilerOptions?.paths)
                }
            });

        return { path, source, imports };
    });
}

function walkSync (dir: string, filelist: string[] = []) {
    const files = readdirSync(dir);

    files.forEach(file => {
        const path = join(dir, file);

        if (statSync(path).isDirectory()) {
            filelist = walkSync(path, filelist);
        } else {
            filelist.push(path);
        }
    });

    return filelist;
}

function isDefinitionFile(path: string): boolean {
    return path.endsWith('.d.ts');
}
