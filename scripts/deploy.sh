#!/bin/bash

echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc

yarn install --pure-lockfile
yarn build

./package-version @toi/toi packages/toi
./package-version @toi/toix packages/toix

cd packages/toi

npm publish --access public

cd ../toix

npm publish --access public
