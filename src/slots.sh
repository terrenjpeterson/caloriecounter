#!/bin/bash
# building customized slots using lambda functions

# read in test data required for a food validation request
echo 'begin building entree food customized slot'
cd data
request=$(<foods.json)
cd ..
#echo $request
echo 'read foods.json data object'

# invoke the lambda function and pass the foods data object
aws lambda invoke --function-name convertFoodsObjForSlot --payload "$request" output.json

aws s3 cp output.json s3://fastfoodchatbot/data/

# read response file into local variable then print on the console
response=$(<output.json)
echo $response
echo 'build slot complete'

#aws lex-models put-slot-type --name foodEntreeNames
