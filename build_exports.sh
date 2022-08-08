#!/bin/sh

cat common.js | awk -f build_exports.awk > EXPORT_common.js


echo "EXPORT_ versions of common js files created!!!"
