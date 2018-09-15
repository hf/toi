#!/bin/bash

DIR=$(dirname $(readlink -f $0))

echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > $HOME/.npmrc

bash $DIR/package-version.sh @toi/toi packages/toi
TOI_VERSION=$?

bash $DIR/package-version.sh @toi/toix packages/toix
TOIX_VERSION=$?

if [ "0" -eq "$TOI_VERSION" ]
then
  cd packages/toi
  npm publish --access public
  EXCODE=$?
  cd ../..

  if [ "$EXCODE" != "0" ]
  then
    echo "Unable to publish @toi/toi"
    exit $EXCODE
  fi
else
  echo "Package @toi/toi is already published."
fi

if [ "0" -eq "$TOIX_VERSION" ]
then
  cd packages/toix
  npm publish --access public
  EXCODE=$?
  cd ../..

  if [ "$EXCODE" != "0" ]
  then
    echo "Unable to publish @toi/toix"
    exit $EXCODE
  fi
else
  echo "Package @toi/toix is already published."
fi

