# Calorie Counter Chatbot

This is a Lex based chatbot that will calculate calories made by trips to different fast food restaurants. It is enabled from a [FB Messenger Chatbot](https://www.facebook.com/fastfoodcaloriecounter/) that can be accessed from the Facebook Page, or through the Messenger App on your phone.

**Table of Contents**

- [How does this use the NLU models from Lex?](#using-nlu-models)
- [What custom slots are used by the NLU?](#custom-slots)
- [What are the lambda functions called by the bot?](#rules-logic-in-lambda)
- [Where does it get its data from?](#data-lookup-tables)
- [How does information get shared between intents?](#using-session-data)
- [What does the deployment model look like?](#deployment-pipeline)
- [What is the website code for?](#website-in-progress)

## Using NLU Models
This bot uses AWS Lex - a service that contains the intelligence to be able to decipher user requests and trigger intents based on data provided in the models. The intents then invoke lambda functions that contain business logic specific to the intent.
![](https://s3.amazonaws.com/fastfoodchatbot/media/LexArchitecture.png)

Currently there are many different intents that the NLU process sorts into.  Here are the "core functions" of the bot.
- FoodTypeOptions (Sample utterance - What are my food options?)
- GetCalories (Sample utterance - How many calories in a Big Mac?)
- GetMexicanFoodCalories (Sample utterance - How many calories in a Chicken Burrito?)
- GetNuggetsCalories (Sample utterance - How many calories in 20 Chicken Nuggets?)
- GetPizzaCalories (Sample utterance - How many calories in 2 slices of Pepperoni Pizza at Papa Johns?)

There are also intents that complement the core features.
- EndConversation (Built-in intent - uses AWS sample utterances like - Stop)
- HelpRequest (Built-in intent - uses AWS sample utterances like - Help)
- Introduction (Sample utterances - Hello, Get Started, Send Message)
- MoreDetails (Sample utterance - More details. Note: this can only be invoked after prior requests are made in the conversation as it's reading data from the session).
- Thanks (Sample utterances - Thanks, Goodbye, Bye)
- WhatPizzaTypes (Sample utterance - What types of pizza are there?)
- WhichRestaurants (Sample utterance - List of restaurants.)

Within each of the intents, sample utterances are provided that construct the potential sentances that a user may provide. The value of the slot (i.e. Large Fry) gets passed to the lambda function as a unique attribute.

## Custom Slots
It is a combination of the sample utterances and slots that determine which intent the NLU models will invoke. These are maintained in Lex, and are used for training the models. 

Currently, here are the custom slots that are used by the intents.
- FastFoodRestaurants (sample values: Chick-fil-A, McDonald's, Wendy's)
- FoodType (sample values: Burger, Salad, Chicken)
- ExtraItems (sample values: Large Fry, Sugar Cookie, Side Salad)
- MexicanFoodTypes (sample values: Burrito, Gordita, Soft Taco)
- Preparation (sample values: Grilled, Fried, Baked)
- Protein (sample values: Steak, Chicken, Black Bean)
- PizzaRestaurants (sample values: Dominos, Papa John's, Little Caesars)
- PizzaSize (sample values: Small, Medium, Large)
- PizzaType (sample values: Sausage, Pepperoni, Honolulu Hawaiian)

An item does not need to be specified in the slot for the NLU to place a value into it. However, if the data is sparse, it may degrade how the NLU interprets the user requests.

## Rules logic in lambda
All of the logic in formulating responses to different intents is processed in a series of lambda functions. Which lambda function to invoke is managed within Lex, and set at the intent level. This enables modularity to be built within the application, keeping the functions lightweight.

There are two different spots within Lex that can invoke a lambda function. The first is through basic validation, and the attribute name that identifies it is called invocationSource. There are two potential values for this - DialogCodeHook and FulfillmentCodeHook.

Here is an overview of each function currently written.

1) lambda.js - the main function that handles the basic validation for queries, sourced by DialogCodeHook.

2) calculate.js - calculating the response for the actual calories in a meal is handled by this funciton, and is sourced by a FulfillmentCodeHook.

3) pizza.js - handles intents around calculating calories in a pizza, including the intent - WhatPizzaTypes.

4) misc.js - handles simple intents like help, the introduction, and more details around a meal.

## Data lookup tables
The core functionality of this bot is to be able to answer queries of how many calories are in different meals. While the slots that Lex uses are helpful in training the NLU models, they don't have the ability to serve as lookup files. 
That's where the json objects come in that are stored in the [/src/data/](https://github.com/terrenjpeterson/caloriecounter/tree/master/src/data) folder.

Here is a sample of the format.
```sh
[
    {
        "restaurant":"Chipotle",
        "foodItems":[
            {"foodName":"Chicken Burrito", "foodType":"Burrito", "protein":"chicken", "calories":975},
            {"foodName":"Steak Burrito", "foodType":"Burrito", "protein":"steak", "calories":945},
            {"foodName":"Carnitas Burrito", "foodType":"Burrito", "protein":"carnitas", "calories":1005},
```

The lambda functions refer to these objects to respond to different queries, and to calculate calorie consumption for the user.

Each food item may be duplicated for different spellings and phrases used to retrieve. For example.

```sh
	    {"foodName":"Fries", "calories":340},
            {"foodName":"Fry", "calories":340},
            {"foodName":"Frys", "calories":340},
	    {"foodName":"French Fries", "calories":340},
            {"foodName":"French Fry", "calories":340},
	    {"foodName":"Medium Fries", "calories":340},
            {"foodName":"Medium Fry", "calories":340},
```

Given that the NLU models do not correct spelling provided by the user, it's up to the Lambda functions to handle this part of the logic.

## Using Session Data

The key to effective long-running conversations between a user and a bot is around managing context of the conversation.
For example, a dialog could go on for several minutes, and invoke many intents.

![](https://s3.amazonaws.com/fastfoodchatbot/media/LongChat.png)

Part of facilitating this is designing a flow of the conversation. Error messages should not be too abrupt, and should lead the user to an alternative query.
The intents should also pass data between one another. This can be accomplished by saving the session data when completing an intent.
This allows the next intent to retrieve the information and not require the user to repeat it with each request.

In the example above, the conversation begins with the user indicating which restaurant they are eating at. This gets persisted in the session by the FoodTypeOptions intent.
The dialog shifts to details of the meal, but the restaraunt name gets saved. Also, the initial response on the calorie count is brief, but offers a more detailed explainatin if the user says 'more details'.
Once again the data gets stored in the session data, and is passed back as part of the Lex framework. Here is example of one of the objects.

```sh
{
    "messageVersion": "1.0",
    "invocationSource": "FulfillmentCodeHook",
    "userId": "1712299768809980",
    "sessionAttributes": {
        "restaurantName": "Burger King",
        "foodName": "Whopper",
        "foodCalories": "660",
        "extraName": "Onion Rings",
        "extraCalories": "410",
        "drinkCalories": "310",
        "drinkName": "32 oz. Large Coke",
        "totalCalories": "1380"
    },
    "bot": {
        "name": "FastFoodChecker",
        "alias": "PROD",
        "version": "42"
    },
    "outputDialogMode": "Text",
    "currentIntent": {
        "name": "DailyIntakeAnalysis",
        "slots": {},
        "slotDetails": {},
        "confirmationStatus": "None"
    },
    "inputTranscript": "Analyze my meal"
}
```

The lambda functions in this bot are completely stateless, so any data from prior invocations must come through the request object.

## Deployment pipeline
Modifying Lex is done completely through the console. The lambda functions that serve the business logic are hosted in AWS lambda, and are deployed from an EC2 host.

The full deployment script is [/src/build.sh](https://github.com/terrenjpeterson/caloriecounter/blob/master/src/build.sh) but a quick overview can be found in the following instructions.

```sh
zip -r foodbot.zip lambda.js data/restaurants.json data/foods.json data/drinks.json

aws s3 cp foodbot.zip s3://fastfoodchatbot/binaries/

aws lambda update-function-code --function-name myCalorieCounterGreen --s3-bucket fastfoodchatbot --s3-key binaries/foodbot.zip

aws lambda invoke --function-name myCalorieCalculatorGreen --payload "$request" testOutput.json
```

1) Create a zip file on the host that acts as the build server. It's from the build server where both the source code and data files are manipulated. The datafiles are then read locally, and whenever they change, a new deployment is created.
2) Upload the zip file to an s3 bucket using the proper AWS CLI commands.
3) Update the existing lambda function with the new package, and using the AWS CLI command, provide the location of the zip file that contains the build package.
4) Execute a test of the lambda function directly with valid sample data. The response object is returned and written to the console as well as a local file.

This process is repeated for each of the lambda functions that are called by Lex. This includes having at least one test condition for each lambda function to ensure that the deployment was done correctly. 

## Website in progress
As part of the initial effort, I was attempting to get this chatbot published to the slack store. As part of that, I needed to build a website for public support of the app. It's a work in progress, and called caloriecountbot.com. It's hosted by s3, and the source is located in the /website folder.

