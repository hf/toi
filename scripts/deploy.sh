#!/bin/bash

DIR=`dirname "$0"`

echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc

yarn install --pure-lockfile
yarn build

bash $DIR/package-version.sh @toi/toi packages/toi
TOI_VERSION=$?

bash $DIR/package-version.sh @toi/toix packages/toix
TOIX_VERSION=$?

if [ "1" -eq "$TOI_VERSION" ] || [ "1" -eq "$TOIX_VERSION" ]
then
  echo "Packages are already published."
  exit 0
fi

cd packages/toi

npm publish --access public

cd ../toix

npm publish --access public
