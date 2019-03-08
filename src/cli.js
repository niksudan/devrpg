#!/usr/bin/env node

var path = require('path');

require('ts-node').register();
require(path.resolve(__dirname, './index.ts'));
