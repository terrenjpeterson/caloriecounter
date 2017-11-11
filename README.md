# Calorie Counter Chatbot

This is a Lex based chatbot that will calculate calories made by trips to different fast food restaurants.

**Table of Contents**

- [How does this use the NLU models from Lex?](#using-nlu-models)
- [What are the lambda functions called by the bot?](#rules-logic-in-lambda)
- [Where does it get its data from?](#data-lookup-tables)
- [What does the deployment model look like?](#deployment-pipeline)
- [What is the website code for?](#website-in-progress)

## Using NLU Models
This bot uses AWS Lex - a service that contains the intelligence to be able to decipher user requests and trigger intents based on data provided in the models.

## Rules logic in lambda
All of the logic in formulating responses to different intents is processed in a series of lambda functions.

1) lambda.js - the main function that handles the basic validation for queries, sourced by DialogCodeHook.

2) calculate.js - calculating the response for the actual calories in a meal is handled by this funciton, and is sourced by a FulfillmentCodeHook.

3) pizza.js - handles intents around calculating calories in a pizza, including the intent - WhatPizzaTypes.

## Data lookup tables
The core functionality of this bot is to be able to answer queries of how many calories are in different meals. While the slots that Lex uses are helpful in training the NLU models, they don't have the ability to serve as lookup files. 
That's where the json objects come in that are stored in the /src/data/ folder.

## Deployment pipeline
Modifying Lex is done completely through the console. The lambda functions that serve the business logic are hosted in AWS lambda, and are deployed from an EC2 host.

The full deployment script is /src/build.sh but a quick overview can be found in the following three instructions.

```sh
zip -r foodbot.zip lambda.js data/restaurants.json data/foods.json data/drinks.json
aws s3 cp foodbot.zip s3://fastfoodchatbot/binaries/
aws lambda update-function-code --function-name myCalorieCounterGreen --s3-bucket fastfoodchatbot --s3-key binaries/foodbot.zip
```

First, create a zip file on the host that acts as the build server. It's here where both the source code and data files are manipulated.
Next, upload the zip file to an s3 bucket using the proper AWS CLI commans.
Finally, update the existing lambda function with the new package, and using the AWS CLI command, provide the location of the zip file that contains the build package.

## Website in progress
As part of the initial effort, I was attempting to get this chatbot published to the slack store. As part of that, I needed to build a website for public support of the app. It's a work in progress, and called caloriecountbot.com. It's hosted by s3, and the source is located in the /website folder.

