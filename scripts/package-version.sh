#!/bin/bash

PACKAGE_NAME=$1
PACKAGE_PATH=$2

DIR=`dirname $0`

NPM_VERSION=`npm view "$PACKAGE_NAME" version`

node "$DIR/compare-version.js" "$PACKAGE_PATH/package.json" "$NPM_VERSION"
