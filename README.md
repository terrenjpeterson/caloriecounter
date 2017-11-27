# Calorie Counter Chatbot

This is a Lex based chatbot that will calculate calories made by trips to different fast food restaurants. It is enabled from a [FB Messenger Chatbot](https://www.facebook.com/fastfoodcaloriecounter/) that can be accessed from the Facebook Page, or through the Messenger App on your phone.

**Table of Contents**

- [How does this use the NLU models from Lex?](#using-nlu-models)
- [What custom slots are used by the NLU?](#custom-slots)
- [How can multiple slots be used in a single intent?](#multiple-slots-in-a-single-intent)
- [What are the lambda functions called by the bot?](#rules-logic-in-lambda)
- [Where does it get its data from?](#data-lookup-tables)
- [How do you create large custom slots?](#large-custom-slots)
- [How does information get shared between intents?](#sharing-session-data-between-intents)
- [What does the deployment model look like?](#deployment-pipeline)
- [Does a bot have a personality?](#add-personality-to-the-bot)
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
- MoreDetails (Sample utterance - More details. Note: this can only be invoked after prior requests are made in the conversation as it's reading data from the session).
- DailyIntakeAnalysis (Sample utterance - analyze my meal. Similar to more details, this uses session data, so must follow one of the prior requests.
- WhatPizzaTypes (Sample utterance - What types of pizza are there?)
- WhichRestaurants (Sample utterance - List of restaurants.)

Then there are intents that form the 'personality' of the bot. These were created based on real user usage, and prevent the generic error message from being used to respond.
- EndConversation (Built-in intent - uses AWS sample utterances like - Stop)
- Introduction (Sample utterances - Hello, Get Started, Send Message)
- Thanks (Sample utterances - Thanks, Goodbye, Bye)
- Complement (Sample utterances - I love you)
- Critic (Sample utterances - U suck)
- Shock (Sample utterances - wow, ouch)
- MyName (Sample utterances - what is your name)
- HelpRequest (Built-in intent - uses AWS sample utterances like - Help)

Within each of the intents, sample utterances are provided that construct the potential sentances that a user may provide. The value of the slot (i.e. Large Fry) gets passed to the lambda function as a unique attribute.

You can get the summary information from the AWS CLI by executing the following command.

```sh
aws lex-models get-bot --name FastFoodChecker --version-or-alias PROD
```

## Custom Slots
It is a combination of the sample utterances and slots that determine which intent the NLU models will invoke. These are maintained in Lex, and are used for training the models. 

Currently, here are the custom slots that are used by the intents.
- FoodOptions (sample values: Big Mac, Smokehouse Brisket Sandwich, etc. This has hundreds of entries, and is generated from the foods.json data object).
- DrinkOptions (sample values: Water, Iced Tea, Large Diet Lemonade, etc. This has many entries, and is generated from the drinks.json data object).
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

## Multiple Slots in a Single Intent

Usability of a chatbot requires natural interaction to occur with a user. One key concept is around how to incorporate multiple slots into a single intent.
For example, a user could ask "How many calories in a Big Mac, Fries, and a Coke?" That is three different items that each need to be parsed out.
Within this chatbot, the main processing has many different slots that map into intents. For example, here are the slots that map into the GetCalories intent.

![](https://s3.amazonaws.com/fastfoodchatbot/media/slotsExample.png)

There are a couple of items to note in this.

1) In the example request above, the NLU models would parse the data from the utterance into three different slots (Food, Extra, and Drink).

2) The slot order doesn't matter to the parsing, but it does drive what would be the next response (slot 1 - Which Restaurant are you at?)

3) There are two slots that aren't required in this intent - Ketchup and PacketsKetchup. This optional information is asked for if fries is asked for as a side item. This is driven by the code in the Lambda function that is invoked in the Validation code hook.

## Rules logic in lambda
All of the logic in formulating responses to different intents is processed in a series of lambda functions. Which lambda function to invoke is managed within Lex, and set at the intent level. This enables modularity to be built within the application, keeping the functions lightweight.

There are two different spots within Lex that can invoke a lambda function. The first is through basic validation, and the attribute name that identifies it is called invocationSource. 
There are two potential values for this - DialogCodeHook and FulfillmentCodeHook. Here is where these Lambda functions are specified in the Lex Bot.

![](https://s3.amazonaws.com/fastfoodchatbot/media/lambdaHooks.png)

The first dropdown is the Validation, and calls the lambda function every time the bot is called. The attribute that it passes is called DialogCodeHook.
The second dropdown is the Fulfillment, and only called once the mandatory slots have been completed, and the validation from the initial call is complete.
This allows for the functions to be different, enabling better scalability in building the bot.

Here is an overview of each function currently written.

1) lambda.js - the main function that handles the basic validation for queries, sourced only in DialogCodeHook mode.

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

## Large Custom Slots

Managing large custom slots can be difficult, particularly if the data is dynamic. The main food lookup has several hundred unique values in it, and growing based on user usage.
The process for creating this slot has been automated, and the data for the custom slot is taken from the [foods.json](https://github.com/terrenjpeterson/caloriecounter/blob/master/src/data/foods.json) data object.
This is done through the AWS CLI that can load these directly from the command line. All of the files are contained in the [slots}(https://github.com/terrenjpeterson/caloriecounter/tree/master/src/slots) directory for reference. 
Here are the steps used to create.

1) The foods.json data object is passed to a lambda function called convertFoodsObjForSlot.
2) The function sorts through the data, eliminates duplicates, then the data is formatted into a simple array with just the entree names.
3) The array is returned and then passed into the AWS CLI using the [put-slot-type](https://docs.aws.amazon.com/cli/latest/reference/lex-models/put-slot-type.html) command.
4) The model is then manually rebuilt via the console and deployed just like any other training activity.

The syntax looks like this.

```sh
# foods.json is the data object that will be passed to the lambda function
request=$(<foods.json)

# invoke the lambda function from the command line and write the output to output.json
aws lambda invoke --function-name convertFoodsObjForSlot --payload "$request" output.json

data=$(<output.json)

# invoke lex to create a new version of the FoodEntreeNames custom slot using the data from output.json
aws lex-models put-slot-type --name FoodEntreeNames --checksum <enter latest checksum here> --enumeration-values "$data" >> sysout.txt

```
Also, the checksum value is from the prior deployment of the custom slot. I can't find any CLI command that retreives this if you lose it, so a workaround is to just create a new slot name and deploy a new unique name, then change the intent to use it.
When invoking the CLI, saving it to sysout.txt helps as you will be saving the logs that contain the console output.

## Sharing Session Data between Intents

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
# this creates the build package as a zip file containing the code and relevant data objects
zip -r foodbot.zip lambda.js data/restaurants.json data/foods.json data/drinks.json

# this CLI command copies the build package to an s3 bucket for staging
aws s3 cp foodbot.zip s3://fastfoodchatbot/binaries/

# this CLI command takes the package from the s3 bucket, and overlays the lambda function 'myCalorieCounterGreen'
aws lambda update-function-code --function-name myCalorieCounterGreen --s3-bucket fastfoodchatbot --s3-key binaries/foodbot.zip

# this CLI command invokes the lambda function with the data object  read into request, and writes out a response to the testOutput data object.
aws lambda invoke --function-name myCalorieCalculatorGreen --payload "$request" testOutput.json
```

1) Create a zip file on the host that acts as the build server. It's from the build server where both the source code and data files are manipulated. The datafiles are then read locally, and whenever they change, a new deployment is created.
2) Upload the zip file to an s3 bucket using the proper AWS CLI commands.
3) Update the existing lambda function with the new package, and using the AWS CLI command, provide the location of the zip file that contains the build package.
4) Execute a test of the lambda function directly with valid sample data. The response object is returned and written to the console as well as a local file.

This process is repeated for each of the lambda functions that are called by Lex. This includes having at least one test condition for each lambda function to ensure that the deployment was done correctly. 

## Add Personality to the Bot

One of the topics in bot design is around having a personality. Something to consider when designing the intents is what are all of the possible questions that a user may ask.
This should include off-topic questions, such as 'what is your name' or emotional responses like 'oh-no' or 'you suck'.
These are easy to code - usually just a simple request-response with no slots involved, and does tend to make the dialogs more natural.

For an example, here is a brief response coded in the [misc.js](https://github.com/terrenjpeterson/caloriecounter/blob/master/src/misc.js) function that responds to if someone asks what the bots name is.
In the models, an utterance of 'what is your name' resolves to this intent.

```sh

if (intentName === 'MyName') {
    console.log("user requested bot name");
    return getBotName(intentRequest, callback);
}
...
function getBotName(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var botResponse = "My name is Chuck. I'm a chatbot that helps people sort out " +
	"fast food options. Talking about food all day makes me hungry!!!";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: botResponse }));
}

```

## Website in progress
As part of the initial effort, I was attempting to get this chatbot published to the slack store. As part of that, I needed to build a website for public support of the app. It's a work in progress, and called caloriecountbot.com. It's hosted by s3, and the source is located in the /website folder.

