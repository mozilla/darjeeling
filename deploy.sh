#!/usr/bin/env bash

TIMESTAMP=$(date)

echo 'Pushing to production ...'

echo 'Updating database and minifying assets ...'

grunt minify

echo 'Writing to deploy log ...'

echo $TIMESTAMP >> deploy.log
