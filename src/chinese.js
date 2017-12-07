'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including foods and drinks

var foodChoices = require("data/foods.json");
var drinks = require("data/drinks.json");

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

// this funciton is called during intial field validation
function validateFields(intentRequest, callback) {
    var sessionAttributes = {};

    if (intentRequest.currentIntent.slots.ChineseEntree) {
    	const checkEntree = validateEntree(intentRequest.slots.ChineseEntree).entreeResponse;
    	console.log(JSON.stringify(checkEntree));
    }

    callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
}

// this function will validate that the restaurant provided by the user matches what data we have
function validateEntree(foodName) {
    var entreeResponse = {};
    var foodItems = [];
    const restaurantName = "Panda Express";

    // get the array of food items
    for (var i = 0; i < foodChoices.length; i++) {
        //console.log("checking: " + JSON.stringify(foodChoices[i]));
        if (restaurantName.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            foodItems = foodChoices[i].foodItems;
            console.log("match restaurant - food items: " + JSON.stringify(foodItems));
        }
    }

    // attempt to match the food item
    entreeResponse.validItem = false;
    for (var j = 0; j < foodItems.length; j++) {
        if (foodName.toLowerCase() == foodItems[j].foodName.toLowerCase()) {
            console.log("found a match for " + foodItems[j].foodName + " calories " + foodItems[j].calories);
            entreeResponse.validItem = true;
            entreeResponse.calories = foodItems[j].calories;
	}
    }

    return {
        entreeResponse
    };

}

// this function handles the flow for pizza places checking for calories

function calculateCalories(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    // save session attributes for later reference
    //sessionAttributes.restaurantName = intentRequest.currentIntent.slots.PizzaRestaurant;
    //sessionAttributes.pizzaRestaurant = true;

    console.log("saving session data: " + JSON.stringify(sessionAttributes));

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
    if (intentRequest.invocationSource === 'DialogCodeHook') {
	console.log("validation mode");
	return validateFields(intentRequest, callback);
    } else if (intentName === 'GetPizzaCalories') {
	console.log("checking on pizza places.");
	return calculatePizzaCalories(intentRequest, callback);
    } else if (intentName === 'WhatPizzaTypes') {
	console.log("user requested types of pizza");
	return getPizzaTypes(intentRequest, callback);
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

