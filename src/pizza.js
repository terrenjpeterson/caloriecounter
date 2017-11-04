
'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var restaurants = ["Chipotle", "Burger King", "Subway", "Panera", "Chick-fil-A", "McDonalds", "Wendys", "Taco Bell", "Arbys","Hardees"];

// these are the valid choices based on website scraping
var pizzas = require("pizzas.json");

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

// this function will validate that the restaurant provided by the user matches what data we have
function validateRestaurant(slots) {
    var validRestaurant = false;

    // correct common mistakes for restaurant names, then attempt to match
    if (slots.Restaurant) {
	var updatedName = scrubRestaurantName(slots.Restaurant).scrubData.restaurantName;
	if (updatedName) {
	    slots.Restaurant = updatedName;
	}
        console.log("validating restaurant:" + slots.Restaurant);
        for (var i = 0; i < restaurants.length; i++) {
            if (slots.Restaurant.toLowerCase() === restaurants[i].toLowerCase()) {
                console.log("found a match for " + restaurants[i]);
                validRestaurant = true;
		slots.Restaurant = restaurants[i];
            }
        }
    }
    
    // create response. if restaurant didn't match, respond as such, else pass back as supported.
    if (validRestaurant) {
        console.log("passed restaurant validation");
        return { isValid: true };
    } else if (slots.Restaurant) {
        console.log("failed restaurant validation");
	var botResponse = "Sorry, I dont have information for " + slots.Restaurant + ". " +
	    "Say, List of restaurants for what I know about.";
        return buildValidationResult(false, 'Restaurant', botResponse);
    } else {
        // check if a food item has been entered. this might allow for restaurant to be defaulted.
        if (slots.Food) {
            console.log("checking for a default of " + slots.Food);
            var defaultRestaurant = false;
            for (var i = 0; i < foodChoices.length; i++) {
                for (var j = 0; j < foodChoices[i].foodItems.length; j++) {
                    if (slots.Food.toLowerCase() === foodChoices[i].foodItems[j].foodName.toLowerCase()) {
                        console.log("default set to " + foodChoices[i].restaurant);
                        slots.Restaurant = foodChoices[i].restaurant;
                        defaultRestaurant = true;
			slots.Food = foodChoices[i].foodItems[j].foodName;
                    }
                }
            }
            return { isValid: true };
        } else {
            console.log("no restaurant provided yet.");
            return { isValid: true };
	}
    }
}

// this function will scrub the restaurant name to get it to a standard
function scrubRestaurantName(restaurantName) {
    var scrubData = {};

    console.log("attempting data scrub of :" + restaurantName);

    if (restaurantName.toLowerCase() === "mcdonald’s" ||
        restaurantName.toLowerCase() === "mcdonald" ||
        restaurantName.toLowerCase() === "mc donald" ||
        restaurantName.toLowerCase() === "mc donalds" ||
        restaurantName.toLowerCase() === "mcdonald's") {
        console.log("corrected restaurant name typo");
        scrubData.restaurantName = "McDonalds";
    } else if (restaurantName.toLowerCase() === "wendy’s" ||
               restaurantName.toLowerCase() === "wendy" ||
               restaurantName.toLowerCase() === "wendy's") {
        console.log("corrected restaurant name apostrophie");
        scrubData.restaurantName = "Wendys";
    } else if (restaurantName.toLowerCase() === "hardee’s" ||
               restaurantName.toLowerCase() === "hardee" ||
               restaurantName.toLowerCase() === "hardee's") {
        console.log("corrected restaurant name apostrophie");
        scrubData.restaurantName = "Hardees";
    } else if (restaurantName.toLowerCase() === "chik-fil-a" ||
               restaurantName.toLowerCase() === "chick fil a" ||
               restaurantName.toLowerCase() === "chic fil a" ||
               restaurantName.toLowerCase() === "chik fil a" ||
               restaurantName.toLowerCase() === "chikfila") {
        console.log("corrected restaurant name typo");
        scrubData.restaurantName = "Chick-fil-A";
    } else if (restaurantName.toLowerCase() === "arby's" ||
               restaurantName.toLowerCase() === "arby" ||
               restaurantName.toLowerCase() === "arby’s") {
        console.log("corrected restaurant name apostrophie");
        scrubData.restaurantName = "Arbys";
    } else if (restaurantName.toLowerCase() === "papa john's" ||
	       restaurantName.toLowerCase() === "pappa johns" ||
	       restaurantName.toLowerCase() === "pappa john's" || 
	       restaurantName.toLowerCase() === "papa john’s") {
	console.log("removed apostrophie or fixed spelling to help matching");
	scrubData.restaurantName = "papa johns";
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
        intentRequest.currentIntent.slots.PizzaRestaurant = updatedName;
    }

    const restaurantName = intentRequest.currentIntent.slots.PizzaRestaurant;

    var botResponse = "Here are the pizza types at " + restaurantName + " : ";

    // check if the restaurant is one that the bot has data for
    if (restaurantName === "papa johns") {
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

    const restaurantName = intentRequest.currentIntent.slots.PizzaRestaurant;

    var botResponse = "Working on finding calories at " + restaurantName + ".";

    // check if the quantity of slices has been provided, or if it is for a full pizza
    if (intentRequest.currentIntent.slots.Quantity) {
	const quantityPieces = intentRequest.currentIntent.slots.Quantity;
	botResponse = botResponse + "Checking for " + quantityPieces + " pieces.";
    } else {
	botResponse = botResponse + "Checking for an entire pizza.";
    }

    // save session attributes for later reference
    sessionAttributes.restaurantName = restaurantName;
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
    if (intentName === 'GetPizzaCalories') {
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

