#/bin/bash

DIR=$(dirname $(readlink -f $0))

PACKAGE=$1

if [ "$TRAVIS_PULL_REQUEST" != "false" ]
then
  echo "Looking for changes in package $PACKAGE for range $TRAVIS_COMMIT_RANGE"

  git diff --name-only "$TRAVIS_COMMIT_RANGE" | egrep -q "^packages/$PACKAGE/"
  CHANGES=$?

  if [ "$CHANGES" != "0" ]
  then
    echo "No changes detected in package $PACKAGE"
  else
    bash "$DIR/package-version.sh" "@toi/$PACKAGE" "packages/$PACKAGE"
    EXCODE=$?
    echo "Exit with $EXCODE"
    exit $EXCODE
  fi
fi
