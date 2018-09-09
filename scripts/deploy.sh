#!/bin/bash

DIR=`dirname "$0"`

bash $DIR/package-version.sh @toi/toi packages/toi
TOI_VERSION=$?

bash $DIR/package-version.sh @toi/toix packages/toix
TOIX_VERSION=$?

TOI_FAILED=0
TOIX_FAILED=0

if [ "0" -eq "$TOI_VERSION" ]
then
  cd packages/toi
  npm publish --access public
  cd ../..
else
  echo "Package @toi/toi is already published."
fi

if [ "0" -eq "$TOIX_VERSION" ]
then
  cd packages/toix
  npm publish --access public
  cd ../..
else
  echo "Package @toi/toix is already published."
fi

