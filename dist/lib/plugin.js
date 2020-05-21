"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var collectImportAndExports_1 = require("./collectImportAndExports");
var writeDefinitionFile_1 = require("./writeDefinitionFile");
var fs_1 = require("fs");
var getTsConfig_1 = require("./getTsConfig");
var DefinitionBundlePlugin = /** @class */ (function () {
    function DefinitionBundlePlugin(properties) {
        this.options = {
            dir: properties.dir || 'src',
            output: properties.output || './',
            moduleName: properties.moduleName || 'MyLib',
            entry: properties.entry || 'index.ts',
            cleanDts: properties.cleanDts,
            tsConfig: getTsConfig_1.getTsConfig(),
        };
    }
    DefinitionBundlePlugin.prototype.apply = function (compiler) {
        var _this = this;
        this.options.output = path_1.join(getWebpackOutputPath(compiler), this.options.output);
        compiler.plugin('done', function () {
            var definitions = collectImportAndExports_1.gatherAllDefinitionFiles(_this.options.dir, _this.options.tsConfig);
            writeDefinitionFile_1.writeDefinitionFile(definitions, _this.options).then(function () {
                if (_this.options.cleanDts) {
                    definitions.forEach(function (definition) {
                        var path = path_1.join(_this.options.dir, definition.path);
                        // remove only .d.ts if source exist
                        if (fs_1.existsSync(path.replace('.d.ts', '.ts'))) {
                            fs_1.unlinkSync(path_1.join(_this.options.dir, definition.path));
                        }
                    });
                }
            });
        });
    };
    return DefinitionBundlePlugin;
}());
exports.DefinitionBundlePlugin = DefinitionBundlePlugin;
function getWebpackOutputPath(compiler) {
    var conf = compiler.options || {};
    return compiler.outputPath || (conf.output && conf.output.path);
}
