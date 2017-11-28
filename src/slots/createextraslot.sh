#!/bin/bash
# building customized slots using lambda functions

# read in test data required for a food validation request
echo 'begin building entree food customized slot'
cd ../data
request=$(<foods.json)
cd ../slots
#echo $request
echo 'read foods.json data object'

# invoke the lambda function and pass the foods data object
aws lambda invoke --function-name convertExtraObjForSlot --payload "$request" output.json

# copy the array to an s3 bucket if needed for reference
aws s3 cp output.json s3://fastfoodchatbot/data/

# read response file into local variable then print on the console
response=$(<output.json)
echo $response

# read the data object returned from the function call and use it to load the custom slot
data=$(<output.json)
# need to automate reading the checksum in
# aws lex-models get-slot-type --name ExtraItems --slot-type-version '$LATEST'
checksum='b95178ac-4b4a-44ee-9101-d048f9ba8ad7'
aws lex-models put-slot-type --name ExtraItems --checksum "$checksum" --enumeration-values "$data" > sysoutextra.json
echo 'complete building slot'
