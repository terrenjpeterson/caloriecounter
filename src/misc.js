'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var foodChoices = require("data/foods.json");
var restaurants = require("data/restaurants.json");

// --------------- Helpers that build all of the responses -----------------------

function buttonResponse(sessionAttributes, message, buttonData) {
    console.log("processing:" + JSON.stringify(buttonData));
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
	    fulfillmentState: 'Fulfilled',
	    message: { contentType: 'PlainText', content: message },
            responseCard: {
                version: '1',
                contentType: 'application/vnd.amazonaws.card.generic',
                genericAttachments: [
                    {
                        title: 'Options:',
                        subTitle: 'Click button below or type response.',
                        buttons: buttonData,
                    },
                ],
            },
        },
    };
}

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function confirmIntent(sessionAttributes, intentName, slots, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// ---------------- Helper Functions --------------------------------------------------

function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

// this function is what builds the introduction
function getIntroduction(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    var message = "Hello, my name is Chuck. I am a chatbot that is an expert at fast food. " +
        "To get started, ask me something like 'How many calories in a Big Mac'.";

    var buttonData = [];
    buttonData.push({ "text":"Calories in a burger?", "value":"calories in a burger?" });
    buttonData.push({ "text":"Eating a pizza.", "value":"eating a pizza." });
    buttonData.push({ "text":"Panda Express", "value":"Panda Express" });

    callback(buttonResponse(sessionAttributes, message, buttonData));
}

// this function is what retrieves the restaurants that data is available for
function getRestaurants(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "Okay, here are the fast food restaurants that I have " +
        "info on. ";

    // cycle through all of the restaurant names that are listed as valid
    for (var i = 0; i < restaurants.length; i++) {
	if (restaurants[i].validRestaurant) {
            counterResponse = counterResponse + restaurants[i].restaurantName + ", ";
	}
    }

    counterResponse = counterResponse + "Say something like, 'Eating at McDonalds', to begin.";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
        
}

// this function calculates how much a given meal covers for daily calories
function getBasicDailyAnalysis(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const maleAverage = 2500;
    const femaleAverage = 2000;
    const sodiumIntake = 2300;

    // change response depending on if a prior food calculation was saved in the session
    if (intentRequest.sessionAttributes.totalCalories) {
    	const mealEstimate = sessionAttributes.totalCalories;
	const restaurantName = intentRequest.sessionAttributes.restaurantName;

    	var botResponse = "This meal of " + mealEstimate + " calories at " + restaurantName +
	    " is " + ((mealEstimate * 100) /maleAverage) + "% of a daily average male diet, or " +
	    ((mealEstimate * 100) /femaleAverage) + "% of a daily average female diet based on " +
	    "guidelines set by nutrition experts. ";

	if (intentRequest.sessionAttributes.chineseRestaurant) {
	    const sodiumEstimate = intentRequest.sessionAttributes.totalSodium;
	    botResponse = botResponse + "The American Heart Association recommends no more than " +
		sodiumIntake + " mg of sodium per day, and this meal is " +
		Math.round((sodiumEstimate * 100) /sodiumIntake) + "% of the daily amount.";
	} else {
	    botResponse = botResponse + "For a specific daily calorie intake estimate, say 'Customize'.";
	}

    	callback(close(sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: botResponse }));

    } else {
	var defaultResponse = "An average daily diet requires " + maleAverage + " calories " +
	    " for a male, and " + femaleAverage + " for a female. For how this compares to a " +
	    "fast food meal, please describe what you would eat. Start by saying something " +
	    "like, 'Eating at McDonalds.'";

        callback(close(sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: defaultResponse }));

    }

}

// this function is what builds the wrap-up of a conversation
function endConversation(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = 'Thanks for stoping by. I get off work at 5pm... on June 14, 2035! ';

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function is what builds the response to a deez nuts comment
function replyDeezNuts(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "LOL - well I'm not really trying to mess with them ;)";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function reacts to someone asking for a beer
function beerReply(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "Beer. Delicious beer. Sorry, I don't know about how many calories in it.";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function is used to give away prizes for contests
function drawingReply(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "Thanks for getting back to us. We will respond shortly.";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function reacts to someone paying a complement
function replyComplement(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "Awww - you're too kind!";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function reacts to someone being harsh or critical
function replyCritic(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "Sorry, I'm trying my best and will learn from my mistakes!";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function reacts to someone indicating that they will come back
function replyComingBack(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "Okay I.will.be.right.here! :)";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function reacts to someone indicating that they want a new restaurant
function resetRestaurant(intentRequest, callback) {
    const sessionAttributes = {};

    var counterResponse = "Got it. Which restaurant are you at now?";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function reacts to a pause in the conversation
function replyNextTopic(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "What's next? ";

    if (sessionAttributes.restaurantName) {
	counterResponse = counterResponse + "I assume you are still at " + 
	    sessionAttributes.restaurantName + ".";
    } else {
    	counterResponse = counterResponse + "Interested in getting a pizza?";
    }

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function is what builds the response to a request for what the bots name is
function getBotName(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var botResponse = "My name is Chuck. I'm a chatbot that helps people sort out " +
	"fast food options. Talking about food all day makes me hungry!!!";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: botResponse }));
}

// this function is what builds the response to a request for help
function getHelp(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "I'm Chuck, a chatbot that helps out on questions around " +
	"Fast Food, including how many calories are in different meals. " + 
        "To get started, just ask me a question like 'How many calories in a Big Mac?', " +
	"or 'Eating one slice of Pepperoni Pizza'. I will ask a few additional " +
        "questions and tell you what I know. For the latest list of fast food " +
        "restaurants I know about, just say 'List of restaurants.'";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
        
}

// this function is what calculates the BMR for a given user
function calculateBMR(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    const gender 	= intentRequest.currentIntent.slots.Gender;
    const age 		= intentRequest.currentIntent.slots.Age;
    const heightFeet 	= intentRequest.currentIntent.slots.HeightFeet;
    const heightInches 	= intentRequest.currentIntent.slots.HeightInches;
    const weightUnits 	= intentRequest.currentIntent.slots.WeightUnits;
    const weight 	= intentRequest.currentIntent.slots.Weight;

    var counterResponse = "Daily calorie intake for a " + age + " year old " + gender + ", weighing " +
	weight + " lbs, and is " + heightFeet + " ft " + heightInches + " inches tall is ";

    var bmr = 0;

    if (gender.toLowerCase() === "male") {
        // This is the male BMR calculation
        bmr = 66 + ( 6.2 * Number(weight)) + ( 12.7 * Number(heightFeet) * 12 ) + ( -6.76 * Number(age));
        if (intentRequest.currentIntent.slots.HeightInches) {
            if (heightInches !== "?") {
              	bmr = bmr + 12.7 * Number(heightInches);
            }
        }
    } else {
        // This is the female BMR calculation
        bmr = 655.1 + (4.35 * Number(weight)) + (4.7 * Number(heightFeet) * 12 ) + (- 4.7 * Number(age));
        if (intentRequest.currentIntent.slots.HeightInches) {
            if (heightInches !== "?") {
                bmr = bmr + 4.7 * Number(heightInches);
            }
        }
    }

    var dci = Math.round(bmr * 1.2);

    counterResponse = counterResponse + dci + " calories per day. This amount will increase if you are active " +
	"at work or exercise on a regular basis. ";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));

}

// this function is what builds the response to a shock message (i.e. wow)

function getShockResponse(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = "Well it could be worse, at least you haven't eaten this " +
	"meal yet...right? oh sorry :)";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));

}

// this function returns what healthy options exist at a particular restaurant

function getHealthyChoice(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    const restaurant = intentRequest.currentIntent.slots.Restaurant;
    var counterResponse = restaurant + " has ";

    if (restaurant === "Subway") {
	counterResponse = counterResponse + " healthy salads and sandwiches. ";
    } else if (restaurant === "McDonalds") {
	counterResponse = counterResponse + " grilled chicken sandwiches and salads. ";
    } else if (restaurant === "Panera") {
        counterResponse = counterResponse + " healthy soups, salads, and sandwiches. ";
    } else if (restaurant === "Burger King") {
        counterResponse = counterResponse + " a nice grilled chicken sandwich. ";
    } else if (restaurant === "Chick-fil-A") {
        counterResponse = counterResponse + " grilled chicken sandwiches and salads. ";
    } else if (restaurant === "Wendys") {
        counterResponse = counterResponse + " chicken sandwiches and a healthy fish sandwich. ";
    } else if (restaurant === "Arbys") {
        counterResponse = counterResponse + " roast beef and turkey sandwiches as well as salads. ";
    } else if (restaurant === "Hardees") {
        counterResponse = counterResponse + " charbroiled chicken and veggie sandwiches. ";
    } else if (restaurant === "Five Guys") {
        counterResponse = counterResponse + " veggie sandwiches, and little size burgers. Just stay away from the fries. ";
    } else if (restaurant === "Sonic") {
        counterResponse = counterResponse + " veggie burgers. ";
    }

    counterResponse = counterResponse + "Let me know if you want me to get more details.";

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
}

// this function returns the details of a recent meal request stored in session data

function getMealDetails(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var detailResponse = "";

    console.log("Session Attributes: " + JSON.stringify(intentRequest.sessionAttributes));

    if (sessionAttributes.foodName || sessionAttributes.extraName) {
	if (sessionAttributes.foodName) {
	    detailResponse = sessionAttributes.foodName + " is " + 
	        sessionAttributes.foodCalories + " calories. ";
	}
	if (sessionAttributes.sauceName) {
	    detailResponse = detailResponse + sessionAttributes.sauceName + " is " +
		sessionAttributes.sauceCalories + " calories. ";
	}
        if (sessionAttributes.extraName && !sessionAttributes.dressingName) {
            detailResponse = detailResponse + sessionAttributes.extraName + " is " +
                sessionAttributes.extraCalories + " calories. ";
        }
	if (sessionAttributes.dressingName) {
	    detailResponse = detailResponse + sessionAttributes.extraName + " is " +
		sessionAttributes.extraCalories + " calories and the " + sessionAttributes.dressingName +
		" Dressing adds " + sessionAttributes.dressingCalories + " calories. ";
	}
	if (sessionAttributes.drinkName) {
	    detailResponse = detailResponse + sessionAttributes.drinkName + " is " +
		sessionAttributes.drinkCalories + " calories. ";
	}
	if (sessionAttributes.extraName || sessionAttributes.drinkName || sessionAttributes.sauceName) {
	    detailResponse = detailResponse + "Total Calories are " + 
		sessionAttributes.totalCalories + ". ";
	}
	detailResponse = detailResponse + "To analyze this meal vs. your daily recommended " +
	    "calorie intake, please say 'analyze my meal'.";
    } else if (sessionAttributes.chineseRestaurant) {
	detailResponse = sessionAttributes.entreeName + " is " + sessionAttributes.entreeCalories + 
	    " calories, and " + sessionAttributes.entreeSodium + " mg of sodium. " +
	    sessionAttributes.sideName + " is " + sessionAttributes.sideCalories + 
	    " calories, and " + sessionAttributes.sideSodium + " mg of sodium. ";
	if (sessionAttributes.appetizerCalories) {
	    detailResponse = detailResponse + sessionAttributes.appetizerName + " is " + 
		sessionAttributes.appetizerCalories + 
		" calories, and " + sessionAttributes.appetizerSodium + " mg of sodium. ";
	}
	if (sessionAttributes.drinkName) {
	    detailResponse = detailResponse + "The " + sessionAttributes.drinkSize + " oz. " + 
		sessionAttributes.drinkName + " adds " + sessionAttributes.drinkCalories + " calories. ";
	}
	detailResponse = detailResponse + "Total Calories are " + sessionAttributes.totalCalories + 
	    " and sodium intake is " + sessionAttributes.totalSodium + ". " +
            "To analyze this meal vs. your daily recommended calorie intake, please say 'analyze my meal'.";
    } else {
	var detailResponse = "Sorry, first start by telling me more about the meal. " +
	    "For example, say something like Eating at Burger King.";
    }

    callback(close(sessionAttributes, 'Fulfilled',
	{ contentType: 'PlainText', content: detailResponse }));

}

// this function retrieves the food options for a given restaurant
function getFoodOptions(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var restaurant = intentRequest.currentIntent.slots.Restaurant;
    var foodType   = intentRequest.currentIntent.slots.FoodType;

    var botResponse = "Here are the types of " + foodType + " at " + restaurant + ". ";

    console.log("Attempting to retrieve types of " + foodType + " at " + restaurant + ".");

    // clean up different spellings of food types - including plural items
    if (foodType.toLowerCase() === "burritos") {
	foodType = "Burrito";
    } else if (foodType.toLowerCase() === "salads") {
	foodType = "Salad";
	console.log("corrected Salads to Salad for food lookup");
    } else if (foodType.toLowerCase() === "chalupas") {
	foodType = "Chalupa";
    } else if (foodType.toLowerCase() === "sandwiches") {
	foodType = "Sandwich";
    } else if (foodType.toLowerCase() === "burgers" ||
	       foodType.toLowerCase() === "whopper") {
	foodType = "Burger";
    }

    var foodItems = [];
    // find the restaurant food items for the restaurant provided
    for (var i = 0; i < foodChoices.length; i++) {
        if (restaurant.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            foodItems = foodChoices[i].foodItems;
	    restaurant = foodChoices[i].restaurant;
        } 
    }

    // go through the food items, and list those matching the food type
    var foodTypeMatch = false;
    var foodNameExample = "";

    for (var j = 0; j < foodItems.length; j++) {
	// first make sure a food type exists for the item
	if (foodItems[j].foodType) {
	    if (foodItems[j].foodType.toLowerCase() === foodType.toLowerCase()) {
		botResponse = botResponse + foodItems[j].foodName + ", ";
		foodNameExample = foodItems[j].foodName;
		foodTypeMatch = true;
	    }
	}
    }

    if (foodTypeMatch) {
	botResponse = botResponse + " Want calorie details? Say something like " +
	    "How many calories in a " + foodNameExample + " at " + restaurant + ".";
    } else {
	botResponse = "Sorry, I don't have information for types of " + foodType + " at " +
	    restaurant + ".";
    }

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: botResponse }));

}

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    // console.log(JSON.stringify(intentRequest, null, 2));
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    console.log("Data Provided: " + JSON.stringify(intentRequest));

    // Dispatch to the skill's intent handlers
    if (intentName === 'Introduction') {
        console.log("friendly introduction.");
        return getIntroduction(intentRequest, callback);
    } else if (intentName === 'WhichRestaurants') {
        console.log("list of restaurants requested.");
        return getRestaurants(intentRequest, callback);
    } else if (intentName === 'EndConversation') {
        console.log("wrap-up conversation requested.");
        return endConversation(intentRequest, callback);
    } else if (intentName === 'Thanks') {
        console.log("received thank you from user.");
        return endConversation(intentRequest, callback);
    } else if (intentName === 'HelpRequest') {
        console.log("user requested help.");
        return getHelp(intentRequest, callback);
    } else if (intentName === 'MoreDetails') {
	console.log("user requested details on meal");
	return getMealDetails(intentRequest, callback);
    } else if (intentName === 'Shock') {
	console.log("user uttered a shock response");
	return getShockResponse(intentRequest, callback);
    } else if (intentName === 'FoodTypeOptions') {
	console.log("user requested food types");
	return getFoodOptions(intentRequest, callback);
    } else if (intentName === 'DailyIntakeAnalysis') {
        console.log("user requested daily intake summary");
        return getBasicDailyAnalysis(intentRequest, callback);
    } else if (intentName === 'MyName') {
	console.log("user requested bot name");
	return getBotName(intentRequest, callback);
    } else if (intentName === 'Complement') {
        console.log("user provided a complement");
        return replyComplement(intentRequest, callback);
    } else if (intentName === 'DeezNuts') {
	console.log("user played a joke on the bot");
	return replyDeezNuts(intentRequest, callback);
    } else if (intentName === 'Critic') {
        console.log("user was harsh");
        return replyCritic(intentRequest, callback);
    } else if (intentName === 'ComingBack') {
	console.log("user said they will come back");
	return replyComingBack(intentRequest, callback);
    } else if (intentName === 'NextTopic') {
	console.log("user indicated a pause in the conversation");
	return replyNextTopic(intentRequest, callback);
    } else if (intentName === 'NewRestaurant') {
	console.log("user wants to reset the restaurant that is saved");
	return resetRestaurant(intentRequest, callback);
    } else if (intentName === 'CalculateBMR') {
	console.log("user wants to know their BMR");
	return calculateBMR(intentRequest, callback);
    } else if (intentName === 'Beer') {
	console.log("user asks about beer");
	return beerReply(intentRequest, callback);
    } else if (intentName === 'DrawingWinner') {
	console.log("user replying to drawing");
	return drawingReply(intentRequest, callback);
    } else if (intentName === 'HealthyChoice') {
	console.log("user requesting healthy choice meals");
	return getHealthyChoice(intentRequest, callback);
    }
    
    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

function loggingCallback(response, originalCallback) {
    // console.log(JSON.stringify(response, null, 2));
    originalCallback(null, response);
}

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        if (event.bot.name != 'FastFoodChecker') {
             console.log('Invalid Bot Name');
        }
        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};
