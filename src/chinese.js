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
    var validEntry = true;

    // validate the entree name if provided
    if (intentRequest.currentIntent.slots.ChineseEntree) {
    	const checkEntree = validateFood(intentRequest.currentIntent.slots.ChineseEntree, 'Entree');
    	console.log(JSON.stringify(checkEntree));
	// if the entree validation failed, pass back result to request
	if (!checkEntree.isValid) {
	    validEntry = false;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots, 'ChineseEntree', checkEntree.message));
	} else {
	    sessionAttributes.entreeCalories = checkEntree.calories;
	}
    }

    // validate the side item if provided
    if (intentRequest.currentIntent.slots.ChineseSide && validEntry) {
        const checkSide = validateFood(intentRequest.currentIntent.slots.ChineseSide, 'Sides');
        console.log(JSON.stringify(checkSide));
        // if the entree validation failed, pass back result to request
        if (!checkSide.isValid) {
            validEntry = false;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots, 'ChineseSide', checkSide.message));
        } else {
	    sessionAttributes.sideCalories = checkSide.calories;
	}
    }    

    // validate the appetizer item if provided
    if (intentRequest.currentIntent.slots.ChineseAppetizer && validEntry 
	&& intentRequest.currentIntent.slots.ChineseAppetizer.toLowerCase() !== "no") {
        const checkAppetizer = validateFood(intentRequest.currentIntent.slots.ChineseAppetizer, 'Appetizers');
        console.log(JSON.stringify(checkAppetizer));
        // if the entree validation failed, pass back result to request
        if (!checkAppetizer.isValid) {
            validEntry = false;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots, 'ChineseAppetizer', checkAppetizer.message));
        } else {
            sessionAttributes.appetizerCalories = checkAppetizer.calories;
        }
    }

    if (validEntry) {
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
    }
}

// this function will validate that the restaurant provided by the user matches what data we have
function validateFood(foodName, foodType) {
    var entreeResponse = {};
    var foodItems = [];
    var botMessage = "";
    var validItem = false;
    const restaurantName = "Panda Express";

    console.log("Validating " + foodType);

    // get the array of food items
    for (var i = 0; i < foodChoices.length; i++) {
        //console.log("checking: " + JSON.stringify(foodChoices[i]));
        if (restaurantName.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            foodItems = foodChoices[i].foodItems;
            console.log("match restaurant - food items: " + JSON.stringify(foodItems));
        }
    }

    // attempt to match the food item
    var entreeAlternatives = [];
    var entreeCalories = 0;
    for (var j = 0; j < foodItems.length; j++) {
        if (foodName.toLowerCase() == foodItems[j].foodName.toLowerCase()) {
            console.log("found a match for " + foodItems[j].foodName + " calories " + foodItems[j].calories);
            validItem = true;
            entreeCalories = foodItems[j].calories;
	} else if (foodItems[j].foodType === foodType) {
	    entreeAlternatives.push(foodItems[j].foodName);
	}
    }

    // check to see if the food name provided was valid. if not, format error message
    if (!validItem) {
	botMessage = "I can't find " + foodName + ". How about ";
    	for (var k = 0; k < entreeAlternatives.length; k++) {
	    botMessage = botMessage + entreeAlternatives[k] + ", ";
    	}
	return buildValidationResult(false, foodType, botMessage);
    } else {
	return { isValid: true, calories: entreeCalories };
    }
}

// this function calculates the total calories in a meal and saves it to the session

function calculateCalories(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var botResponse = "Eating at Panda Express. ";

    var totalCalories = Number(intentRequest.sessionAttributes.entreeCalories) +
	Number(intentRequest.sessionAttributes.sideCalories);

    if (intentRequest.sessionAttributes.appetizerCalories) {
	totalCalories = totalCalories + Number(intentRequest.sessionAttributes.appetizerCalories);
	sessionAttributes.appetizerName = intentRequest.currentIntent.slots.ChineseAppetizer;
    }

    botResponse = botResponse + intentRequest.currentIntent.slots.ChineseEntree + " and " + 
	intentRequest.currentIntent.slots.ChineseSide;

    if (intentRequest.currentIntent.slots.ChineseAppetizer && intentRequest.currentIntent.slots.ChineseAppetizer.toLowerCase() !== "no") {
	botResponse = botResponse + " with a " + intentRequest.currentIntent.slots.ChineseAppetizer + ". ";
    } else {
	botResponse = botResponse + ". ";
    }

    botResponse = botResponse + "Total is " + totalCalories + " calories. " +
	"You can also say 'more details' for an itemized breakout.";

    // save session attributes for later reference
    sessionAttributes.entreeName = intentRequest.currentIntent.slots.ChineseEntree;
    sessionAttributes.sideName   = intentRequest.currentIntent.slots.ChineseSide;

    sessionAttributes.totalCalories 	= totalCalories;
    sessionAttributes.chineseRestaurant = true;

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
    } else {
	console.log("calculate calories");
	return calculateCalories(intentRequest, callback);
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

