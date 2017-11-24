#!/bin/bash
# building customized slots using lambda functions

# read in test data required for a drink validation request
echo 'begin building entree drink customized slot'
cd ../data
request=$(<drinks.json)
cd ../slots
echo 'read drinks.json data object'

# invoke the lambda function and pass the foods data object
aws lambda invoke --function-name generateDrinkSlot --payload "$request" outputdrinks.json

# copy the array to an s3 bucket if needed for reference
aws s3 cp outputdrinks.json s3://fastfoodchatbot/data/

# read response file into local variable then print on the console
response=$(<outputdrinks.json)

# read the data object returned from the function call and use it to load the custom slot
data=$(<outputdrinks.json)
# bc8c1fcb-c9cd-4e7d-b89c-13f2e043a269
aws lex-models put-slot-type --name DrinkOptions --checksum bc8c1fcb-c9cd-4e7d-b89c-13f2e043a269 --enumeration-values "$data" >> sysoutdrinks.txt
echo 'complete building drinks slot'
