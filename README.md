# Calorie Counter Chatbot

This is a Lex based chatbot that will calculate calories made by trips to different fast food restaurants. It is enabled from a [FB Messenger Chatbot](https://www.facebook.com/fastfoodcaloriecounter/) that can be accessed from the Facebook Page, or through the Messenger App on your phone.

**Table of Contents**

- [How does this use the NLU models from Lex?](#using-nlu-models)
- [What are the lambda functions called by the bot?](#rules-logic-in-lambda)
- [Where does it get its data from?](#data-lookup-tables)
- [What does the deployment model look like?](#deployment-pipeline)
- [What is the website code for?](#website-in-progress)

## Using NLU Models
This bot uses AWS Lex - a service that contains the intelligence to be able to decipher user requests and trigger intents based on data provided in the models.

Currently there are twelve different intents that the NLU process sorts into.
- EndConversation (Built-in intent - uses AWS sample utterances like - Stop)
- FoodTypeOptions (Sample utterance - What are my food options?)
- GetCalories (Sample utterance - How many calories in a Big Mac?)
- GetMexicanFoodCalories (Sample utterance - How many calories in a Chicken Burrito?)
- GetNuggetsCalories (Sample utterance - How many calories in 20 Chicken Nuggets?)
- GetPizzaCalories (Sample utterance - How many calories in 2 slices of Pepperoni Pizza at Papa Johns?)
- HelpRequest (Built-in intent - uses AWS sample utterances like - Help)
- Introduction (Sample utterances - Hello, Get Started, Send Message)
- MoreDetails (Sample utterance - More details. Note: this can only be invoked after prior requests are made in the conversation as it's reading data from the session).
- Thanks (Sample utterances - Thanks, Goodbye, Bye)
- WhatPizzaTypes (Sample utterance - What types of pizza are there?)
- WhichRestaurants (Sample utterance - List of restaurants.)

## Rules logic in lambda
All of the logic in formulating responses to different intents is processed in a series of lambda functions. Which lambda function to invoke is managed within Lex, and set at the intent level. This enables modularity to be built within the application, keeping the functions lightweight.

Here is an overview of each function.

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

1) Create a zip file on the host that acts as the build server. It's here where both the source code and data files are manipulated.
2) Upload the zip file to an s3 bucket using the proper AWS CLI commands.
3) Update the existing lambda function with the new package, and using the AWS CLI command, provide the location of the zip file that contains the build package.

This process is repeated for each of the lambda functions that are called by Lex.

## Website in progress
As part of the initial effort, I was attempting to get this chatbot published to the slack store. As part of that, I needed to build a website for public support of the app. It's a work in progress, and called caloriecountbot.com. It's hosted by s3, and the source is located in the /website folder.

