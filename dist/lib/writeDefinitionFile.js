"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var fs_1 = require("fs");
var typescript_formatter_1 = require("typescript-formatter");
function writeDefinitionFile(definitions, options) {
    var definitionSource = writeDefinitions(definitions, options.moduleName);
    var mainModuleSource = writeMainModule(options.moduleName, options.entry);
    var outputDir = path_1.join(options.output, options.moduleName);
    return Promise.all([
        formatAndSave(mainModuleSource, outputDir, 'index.d.ts'),
        formatAndSave(definitionSource, outputDir, options.moduleName + ".d.ts"),
    ]);
}
exports.writeDefinitionFile = writeDefinitionFile;
function formatAndSave(source, dir, filename) {
    if (!fs_1.existsSync(dir)) {
        fs_1.mkdirSync(dir, { recursive: true });
    }
    return typescript_formatter_1.processString('', source, {}).then(function (res) {
        fs_1.writeFileSync(path_1.join(dir, filename), res.message);
    });
}
function writeMainModule(moduleName, entry) {
    return "\n        /// <reference path='./" + moduleName + ".d.ts' />\n    \n        import __module = require('" + moduleName + "/" + removeExtension(entry) + "');\n        export = __module;\n        export as namespace " + moduleName + ";\n        \n        declare global {\n            var " + moduleName + ": typeof __module;\n        }\n    ";
}
function writeDefinitions(definitions, moduleName) {
    var contents = definitions.map(function (definition) {
        var modulePath = removeExtension(path_1.join(moduleName, definition.path));
        var source = definition.imports.reduce(function (source, path) {
            var importModulePath = path_1.join(moduleName, path.replaceTo);
            return source.replace(path.path, importModulePath);
        }, definition.source);
        return declareModule(modulePath, source);
    });
    return contents.join('\n');
}
function declareModule(modulePath, source) {
    return "\n    declare module '" + modulePath + "' {\n        " + source + "\n    }\n    ";
}
function removeExtension(path) {
    return path
        .replace('.d.ts', '')
        .replace('.ts', '');
}
