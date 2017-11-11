
'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var foodChoices = require("data/foods.json");
var drinks = require("data/drinks.json");
var restaurants = require("data/restaurants.json");

// --------------- Helpers that build all of the responses -----------------------


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

// this function looks up the drink size when given a drink name

function getDrinkSize(drinkName) {
    var drinkSize = 0;

    console.log("get drink size");

    for (var j = 0; j < drinks.length; j++) {
	if (drinkName.toLowerCase() === drinks[j].drinkName.toLowerCase()) {
            console.log("found a match for " + drinks[j].drinkName + " size " + drinks[j].size);
	    drinkSize = drinks[j].size;
	}
    }

    return {
	drinkSize
    };
}

// this function is what builds the main response around checking for calories

function calculateCalories(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    const restaurantName = intentRequest.currentIntent.slots.Restaurant;
    const foodName       = intentRequest.currentIntent.slots.Food;
    const drinkName	 = intentRequest.currentIntent.slots.Drink;
    const extraName 	 = intentRequest.currentIntent.slots.Extra;

    var totalCalories 	 = 0;
    var counterResponse  = "";

    // this is the processing for the final confirmation. calculate calories and format message
    console.log("confirm final response - now calculating calories");

    // if the food name was provided, calculate the calories related to it and save
    if (foodName) {
	var foodCalories = getFoodCalories(foodName, restaurantName).foodCalories;
	totalCalories += foodCalories;
    	sessionAttributes.foodName     = foodName;
	sessionAttributes.foodCalories = foodCalories;
	counterResponse = "At " + restaurantName + " eating a " + foodName;
	console.log("returned food calories: " + JSON.stringify(foodCalories));
    }

    // process details related to the extra food item
    if (extraName.toLowerCase() === "nothing" ||
        extraName.toLowerCase() === "none" ||
        extraName.toLowerCase() === "no" ) {
        console.log("Skipping extra as nothing selected");
    } else if (extraName) {
        var extraCalories = getFoodCalories(extraName, restaurantName).foodCalories;
        totalCalories += extraCalories;
        counterResponse = counterResponse + " and a " + extraName;
        sessionAttributes.extraName     = extraName;
        sessionAttributes.extraCalories = extraCalories;
    }

    // process details related to the drink
    if (drinkName.toLowerCase() === "nothing" ||
        drinkName.toLowerCase() === "none" ||
        drinkName.toLowerCase() === "no" ) {
        counterResponse = counterResponse + ". ";
    } else {
	// get the number of calories in the drink and add to the total
	var drinkCalories = getDrinkCalories(drinkName).drinkCalories;
	totalCalories += drinkCalories;
    	sessionAttributes.drinkName     = drinkName;
    	sessionAttributes.drinkCalories = drinkCalories;
        // find the drink size to add specificity to the response
        const drinkSize = getDrinkSize(drinkName).drinkSize;
        if (drinkSize > 0) {
            counterResponse = counterResponse + " and drinking a " + drinkSize + " oz. " + drinkName + ". ";
        } else {
            counterResponse = counterResponse + " and drinking a " + drinkName + ". ";
        }
    }

    // save session attributes for later reference
    sessionAttributes.restaurantName = restaurantName;

    counterResponse = counterResponse + "That is " + totalCalories + " calories. ";
    sessionAttributes.totalCalories  = totalCalories;

    if (totalCalories > sessionAttributes.foodCalories) {
	counterResponse = counterResponse + "You can also say 'more details' for an itemized breakout.";
    }

    console.log("saving session data: " + JSON.stringify(sessionAttributes));

    callback(close(sessionAttributes, 'Fulfilled',{ contentType: 'PlainText', content: counterResponse }));
}

// this function looks up food calories based on a food name
function getFoodCalories(foodName, restaurantName) {
    var restaurantFoodItems = [];
    var foodCalories = 0;

    for (var i = 0; i < foodChoices.length; i++) {
        if (restaurantName.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            restaurantFoodItems = foodChoices[i].foodItems;
        }
    } 

    for (var j = 0; j < restaurantFoodItems.length; j++) {
	if (foodName.toLowerCase() === restaurantFoodItems[j].foodName.toLowerCase()) {
	    console.log("matched recommendation for " + restaurantFoodItems[j].foodName);
	    foodCalories = restaurantFoodItems[j].calories;
	}
    }

    return {
	foodCalories
    };
}

// this function looks up drink calories based on a drink name
function getDrinkCalories(drinkName) {
    var drinkItems = [];
    var drinkCalories = 0;

    for (var j = 0; j < drinks.length; j++) {
        if (drinkName.toLowerCase() === drinks[j].drinkName.toLowerCase()) {
            drinkCalories = drinks[j].calories;
        }
    }

    return {
        drinkCalories
    };
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
    if (intentName === 'GetCalories') {
        console.log("now getting ready to count calories.");
        return calculateCalories(intentRequest, callback);
    } else if (intentName === 'GetNuggetsCalories') {
        console.log("getting nuggets calories.");
        return calculateCalories(intentRequest, callback);
    } else if (intentName === 'GetMexicanFoodCalories') {
        console.log("get mexican food calories.");
        return getIntroduction(intentRequest, callback);
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
