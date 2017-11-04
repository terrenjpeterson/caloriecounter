#!/bin/bash
# create build package for Lex chatbot, stage in s3 bucket, and deploy package.

# create temp zip file with all the json data objects
zip -r foodbot.zip lambda.js data/foods.json data/drinks.json package.json
zip -r pizzabot.zip pizza.js data/pizzas.json

# copy the build file and source files to a staging bucket in case need for research
aws s3 cp lambda.js s3://fastfoodchatbot/binaries/
aws s3 cp pizza.js s3://fastfoodchatbot/binaries/
aws s3 cp foodbot.zip s3://fastfoodchatbot/binaries/
aws s3 cp pizzabot.zip s3://fastfoodchatbot/binaries/

aws s3 cp data/foods.json s3://fastfoodchatbot/data/
aws s3 cp data/drinks.json s3://fastfoodchatbot/data/
aws s3 cp data/pizzas.json s3://fastfoodchatbot/data/

# cleanup temporary file
echo 'removed temp files'
rm foodbot.zip
rm pizzabot.zip

# update the lambda function with the binaries that have been staged
aws lambda update-function-code --function-name myCalorieCounterGreen --s3-bucket fastfoodchatbot --s3-key binaries/foodbot.zip
aws lambda update-function-code --function-name myPizzaCalorieCounterGreen --s3-bucket fastfoodchatbot --s3-key binaries/pizzabot.zip
echo 'new version has been deployed'

# read in test data required for a basic food request
cd testing
request=$(<request.json)
cd ..

# invoke the new lambda function
aws lambda invoke --function-name myCalorieCounterGreen --payload "$request" testOutput.json

# read response file into local variable then print on the console
response=$(<testOutput.json)
echo $response

# read in test data required for the second request
cd testing
request=$(<pizzaRequest.json)
cd ..

# invoke the new lambda function
aws lambda invoke --function-name myPizzaCalorieCounterGreen --payload "$request" testOutput.json

# read response file into local variable then print on the console
response=$(<testOutput.json)
echo $response

# clean-up any temporary data
#aws s3 rm foodbot.zip s3://fastfoodchatbot/binaries/
rm testOutput.json

# wrap-up
echo 'completed new deployment'
