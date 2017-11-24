#!/bin/bash
# command to extract current information about the bot including intents 

# aws cli command to get all of the intents currently used by the bot in PROD environment
aws lex-models get-bot --name FastFoodChecker --version-or-alias PROD > botData.json
