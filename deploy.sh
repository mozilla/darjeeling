#!/usr/bin/env bash

TIMESTAMP=$(date)

echo 'Pushing to production ...'

echo 'Updating database ...'

curl 'http://localhost:'${PORT:-3000}'/fetch'

sleep 15

echo 'Minifying assets ...'

grunt minify

echo 'Writing to deploy log ...'

echo $TIMESTAMP >> deploy.log
