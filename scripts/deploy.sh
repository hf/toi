#!/bin/bash

echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc

yarn install --pure-lockfile
yarn build

cd packages/toi

npm publish --access public

cd ../toix

npm publish --access public
