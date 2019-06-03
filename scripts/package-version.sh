#!/bin/bash

PACKAGE_NAME=$1
PACKAGE_PATH=$2

DIR=$(dirname $(readlink -f $0))

NPM_VERSION=`npm view "$PACKAGE_NAME" version`
EXCODE=$?

if [ "0" -eq "$EXCODE" ]
then
  node "$DIR/compare-version.js" "$PACKAGE_PATH/package.json" "$NPM_VERSION"
  exit $?
else
  exit 0
fi
