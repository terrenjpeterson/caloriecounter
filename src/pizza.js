
'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var restaurants = ["Papa Johns", "Dominos", "Little Caesars"];

// these are the valid choices based on website scraping
var pizzas = require("data/pizzas.json");

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
    const slots = intentRequest.currentIntent.slots;

    console.log("First check if restaurant needs to be defaulted.");
    // check if no restaurant name has been provided yet, but one is in the session - if so - fill in for user
    if (intentRequest.sessionAttributes) {
	console.log("Prior session exists.");
    	if (intentRequest.sessionAttributes.restaurantName && !intentRequest.currentIntent.slots.PizzaRestaurant) {
	    intentRequest.currentIntent.slots.PizzaRestaurant = intentRequest.sessionAttributes.restaurantName;
	}
    }

    console.log("Then check if the restaurant name has been provided.");
    // validate restaurant name if provided in the slot
    if (intentRequest.currentIntent.slots.PizzaRestaurant) {
	console.log("Restaurant name provided, now scrub and validate.");
     	// first scrub the restaurant name
    	var updatedName = scrubRestaurantName(intentRequest.currentIntent.slots.PizzaRestaurant).scrubData.restaurantName;
    	if (updatedName) {
            console.log("Updated Restaurant Name to : " + updatedName);
            intentRequest.currentIntent.slots.PizzaRestaurant = updatedName;
    	}
	// validate restaurant name
	const validationResult = validateRestaurant(intentRequest.currentIntent.slots.PizzaRestaurant)
	if (validationResult.isValid) {
	    intentRequest.currentIntent.slots.PizzaRestaurant = validationResult.restaurantName;
	    sessionAttributes.restaurantName = intentRequest.currentIntent.slots.PizzaRestaurant;
	    callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
	} else {
	    callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                    slots, validationResult.violatedSlot, validationResult.message));
	}
    } else {
    	callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
    }
}

// this function will validate that the restaurant provided by the user matches what data we have
function validateRestaurant(restaurantName) {
    var validRestaurant = false;
    var matchName = restaurantName;

    // correct common mistakes for restaurant names, then attempt to match
    if (restaurantName) {
        console.log("validating restaurant:" + restaurantName);
        for (var i = 0; i < restaurants.length; i++) {
            if (restaurantName.toLowerCase() === restaurants[i].toLowerCase()) {
                console.log("found a match for " + restaurants[i]);
                validRestaurant = true;
		matchName = restaurants[i];
            }
        }
    }
    
    // create response. if restaurant didn't match, respond as such, else pass back as supported.
    if (validRestaurant) {
        console.log("passed restaurant validation");
        return { isValid: true, restaurantName: matchName };
    } else {
        console.log("failed restaurant validation");
	var botResponse = "Sorry, I don't have nutrition information for " + restaurantName + ". " +
	    "I do have information about Domino's, Little Caesars, and Papa John's.";
        return buildValidationResult(false, 'PizzaRestaurant', botResponse);
    }
}

// this function will scrub the restaurant name to get it to a standard
function scrubRestaurantName(restaurantName) {
    var scrubData = {};

    console.log("attempting data scrub of :" + restaurantName);

    if (restaurantName.toLowerCase() === "papa john's" ||
	       restaurantName.toLowerCase() === "pappa johns" ||
	       restaurantName.toLowerCase() === "pappa john's" || 
	       restaurantName.toLowerCase() === "papa john’s") {
	console.log("removed apostrophie or fixed spelling to help matching");
	scrubData.restaurantName = "papa johns";
    } else if (restaurantName.toLowerCase() === "domino's" ||
	       restaurantName.toLowerCase() === "domino’s") {
	console.log("removed apostrophie to help matching");
	scrubData.restaurantName = "dominos";
    } else if (restaurantName.toLowerCase() === "little caesar" ||
	       restaurantName.toLowerCase() === "little ceasar" ||
	       restaurantName.toLowerCase() === "little ceasers" ||
               restaurantName.toLowerCase() === "little ceaser's" ||
	       restaurantName.toLowerCase() === "little caesers" ||
               restaurantName.toLowerCase() === "little caesar’s" ||
	       restaurantName.toLowerCase() === "little caesar's") {
        console.log("removed apostrophie to help matching");
        scrubData.restaurantName = "little caesars";
    }

    return {
	scrubData
    };
}

// this retrieves the different types of pizza for a given restaurant
function getPizzaTypes(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    // first scrub the restaurant name
    var updatedName = scrubRestaurantName(intentRequest.currentIntent.slots.PizzaRestaurant).scrubData.restaurantName;
    if (updatedName) {
	console.log("Updated Restaurant Name to : " + updatedName);
        intentRequest.currentIntent.slots.PizzaRestaurant = updatedName;
    }

    const restaurantName = intentRequest.currentIntent.slots.PizzaRestaurant;

    var botResponse = "Here are the pizza types at " + restaurantName + " : ";

    // check if the restaurant is one that the bot has data for
    if (restaurantName.toLowerCase() === "papa johns" ||
	restaurantName.toLowerCase() === "little caesars" ||
	restaurantName.toLowerCase() === "dominos") {
    	// sort through the pizza choices and pull out those relating to the restaraunt that has already been validated
        for (var i = 0; i < pizzas.length; i++) {
            if (restaurantName.toLowerCase() === pizzas[i].restaurant.toLowerCase()) {
		for (var j = 0; j < pizzas[i].pizzaSelections.length; j++) {
		    botResponse = botResponse + pizzas[i].pizzaSelections[j].name + ", ";
		} 
		botResponse = botResponse + "To check calories, say something like " +
		    "'How many calories in one slice of " + pizzas[i].pizzaSelections[0].name +
		    " at " + pizzas[i].restaurant + "'.";
            }
	}
    } else {
	botResponse = "Sorry, I don't have pizza types for " + restaurantName + ".";
    }

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: botResponse }));
}

// this function handles the flow for pizza places checking for calories

function calculatePizzaCalories(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    // first scrub the restaurant name
    var updatedName = scrubRestaurantName(intentRequest.currentIntent.slots.PizzaRestaurant).scrubData.restaurantName;
    if (updatedName) {
        console.log("Updated Restaurant Name to : " + updatedName);
        intentRequest.currentIntent.slots.PizzaRestaurant = updatedName;
    }

    var botResponse = "Working on finding calories at " + intentRequest.currentIntent.slots.PizzaRestaurant + ".";

    // check if size was provided - if not, default to medium size pizza
    if (!intentRequest.currentIntent.slots.PizzaSize) {
	console.log("Default Pizza Size to Medium");
	intentRequest.currentIntent.slots.PizzaSize = "Medium";
    } 

    // validate the pizza type and get the calorie data for use in the response
    var pizzaTypeData = [];
    for (var i = 0; i < pizzas.length; i++) {
        if (intentRequest.currentIntent.slots.PizzaRestaurant.toLowerCase() === pizzas[i].restaurant.toLowerCase()) {
	    for (var j = 0; j < pizzas[i].pizzaSelections.length; j++) {
		if (intentRequest.currentIntent.slots.PizzaType.toLowerCase() === pizzas[i].pizzaSelections[j].name.toLowerCase()) {
		    console.log("Found a match for " + intentRequest.currentIntent.slots.PizzaType);
		    pizzaTypeData = pizzas[i].pizzaSelections[j].sizes;
		}
	    }
	}
    }

    console.log(JSON.stringify(pizzaTypeData));
    // variables for pizza based on lookup
    var pizzaDiameter = 0;
    var slicesPerPizza = 0;
    var caloriesPerSlice = 0;

    // check if the pizza type was valid by looking for data in the array
    if (pizzaTypeData.length === 0) {
	console.log("Invalid Pizza Type");
	botResponse = "Sorry, I can't find " + intentRequest.currentIntent.slots.PizzaType + " as a valid type of pizza at " +
	    intentRequest.currentIntent.slots.PizzaRestaurant + ". Say 'what types of pizza are there' " +
	    "for valid types.";
    // check if the quantity of slices has been provided, or if it is for a full pizza
    } else {
	console.log("Searching for match of pizza size: " + intentRequest.currentIntent.slots.PizzaSize);
	for (var k = 0; k < pizzaTypeData.length; k++) {
	    if (pizzaTypeData[k].size.toLowerCase() === intentRequest.currentIntent.slots.PizzaSize.toLowerCase()) {
		console.log(JSON.stringify(pizzaTypeData[k]));
		pizzaDiameter = pizzaTypeData[k].diameter;
		slicesPerPizza = pizzaTypeData[k].slicesPerPizza;
		caloriesPerSlice = pizzaTypeData[k].sliceCalories;
	    }
	}
	if (caloriesPerSlice > 0) {
	    if (intentRequest.currentIntent.slots.Quantity) {
	    	botResponse = "At " + intentRequest.currentIntent.slots.PizzaRestaurant + ", " +
		    intentRequest.currentIntent.slots.Quantity + " slices of a " + 
		    intentRequest.currentIntent.slots.PizzaSize + " " + intentRequest.currentIntent.slots.PizzaType +
		    " pizza is " + (intentRequest.currentIntent.slots.Quantity * caloriesPerSlice) + " calories.";
    	    } else {
	    	// request is for the calories in an entire pizza
	    	botResponse = "At " + intentRequest.currentIntent.slots.PizzaRestaurant + 
		    ", a " + intentRequest.currentIntent.slots.PizzaSize + " (" + pizzaDiameter + " inch) " +
		    intentRequest.currentIntent.slots.PizzaType + " pizza " +
		    " is " + (slicesPerPizza * caloriesPerSlice) + " calories. The pizza comes cut in " +
		    slicesPerPizza + " slices, and each slice is " + caloriesPerSlice + " calories.";
	    } 
	} else {
	    botResponse = intentRequest.currentIntent.slots.PizzaSize + " is not a valid size of pizza " +
		"found at " + intentRequest.currentIntent.slots.PizzaRestaurant + ".";
	}
    }

    // save session attributes for later reference
    sessionAttributes.restaurantName = intentRequest.currentIntent.slots.PizzaRestaurant;
    sessionAttributes.pizzaRestaurant = true;

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

