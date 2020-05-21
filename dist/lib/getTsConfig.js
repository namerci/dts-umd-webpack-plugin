"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
function getTsConfig() {
    if (fs_1.existsSync('tsconfig.json')) {
        return JSON.parse(fs_1.readFileSync('tsconfig.json').toString());
    }
    return {};
}
exports.getTsConfig = getTsConfig;
