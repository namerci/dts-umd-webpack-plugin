"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
function extractExportPath(source) {
    var matches = source.match(/ from ['"](.+)['"]/g);
    var importFuncMatches = source.match(/ import\((.+)\)/g);
    var paths = [];
    if (matches && matches.length) {
        matches.forEach(function (match) {
            var m = match.match(/ from ['"](.+)['"]/);
            if (m) {
                paths.push(m[1]);
            }
        });
    }
    if (importFuncMatches && importFuncMatches.length) {
        importFuncMatches.forEach(function (match) {
            var m = match.match(/ import\(['"](.+)['"]\)/);
            if (m) {
                paths.push(m[1]);
            }
        });
    }
    return paths;
}
function resolveAlias(filePath, importPath, aliases) {
    if (!aliases) {
        return path_1.join(path_1.dirname(filePath), importPath);
    }
    var keys = Object.keys(aliases);
    if (!keys.length) {
        return path_1.join(path_1.dirname(filePath), importPath);
    }
    return keys.reduce(function (p, key) {
        var from = stripWildcard(key);
        var target = aliases[key];
        if (Array.isArray(target)) {
            return target.reduce(function (f, t) { return f.replace(from, stripWildcard(t)); }, p);
        }
        return p.replace(from, stripWildcard(target));
    }, importPath);
}
function stripWildcard(path) {
    return path.replace('/*', '');
}
function convertDefinitionToSource(definitionContent) {
    return definitionContent.replace(/declare /g, '');
}
function resolvePath(sourcePath, destPath, rootDir, aliases) {
    if (aliases === void 0) { aliases = {}; }
    var path = destPath;
    if (path.startsWith('./')) {
        return path_1.join(path_1.dirname(sourcePath), destPath);
    }
    if (path.startsWith('@')) {
        path = resolveAlias(sourcePath, destPath, aliases);
        return appendIndexIfDirectory(rootDir, path);
    }
    path = path_1.join(path_1.dirname(sourcePath), path);
    return appendIndexIfDirectory(rootDir, path);
}
function appendIndexIfDirectory(rootDir, path) {
    var rootPath = path_1.join(rootDir, path);
    if (fs_1.existsSync(rootPath)) {
        var stats = fs_1.lstatSync(rootPath);
        if (stats.isDirectory()) {
            path = path_1.join(path, 'index');
        }
    }
    return path;
}
function gatherAllDefinitionFiles(rootDir, tsConfig) {
    var files = walkSync(rootDir);
    return files.filter(isDefinitionFile).map(function (file) {
        var source = convertDefinitionToSource(fs_1.readFileSync(file).toString());
        var path = path_1.relative(rootDir, file);
        var imports = extractExportPath(source)
            .filter(Boolean)
            .map(function (p) {
            var _a, _b;
            console.log({
                path: path,
                p: p,
                rootDir: rootDir,
                replaceTo: resolvePath(path, p, rootDir, (_a = tsConfig.compilerOptions) === null || _a === void 0 ? void 0 : _a.paths)
            });
            return {
                path: p,
                replaceTo: resolvePath(path, p, rootDir, (_b = tsConfig.compilerOptions) === null || _b === void 0 ? void 0 : _b.paths)
            };
        });
        return { path: path, source: source, imports: imports };
    });
}
exports.gatherAllDefinitionFiles = gatherAllDefinitionFiles;
function walkSync(dir, filelist) {
    if (filelist === void 0) { filelist = []; }
    var files = fs_1.readdirSync(dir);
    files.forEach(function (file) {
        var path = path_1.join(dir, file);
        if (fs_1.statSync(path).isDirectory()) {
            filelist = walkSync(path, filelist);
        }
        else {
            filelist.push(path);
        }
    });
    return filelist;
}
function isDefinitionFile(path) {
    return path.endsWith('.d.ts');
}
