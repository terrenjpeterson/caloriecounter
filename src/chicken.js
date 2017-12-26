'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information for the restaurant

var chickenItems = require("data/chicken.json");
var drinkItems   = require("data/drinks.json");

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

function elicitSlotButton(sessionAttributes, intentName, slots, slotToElicit, message, buttonData) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
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
    var validData = true;
    const slots = intentRequest.currentIntent.slots;

    var botResponse = "All fields validated.";

    callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
}

// this function handles the flow for calculating the amount of calories for a chicken meal

function calculateCalories(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var defaultSize = false;
    var entreeCalories = 0;
    var sideCalories = 0;
    var mealCalories = 0;
    var entreeName = "";

    // parse out intents provided by the user
    const partName  = intentRequest.currentIntent.slots.ChickenPart;
    const styleName = intentRequest.currentIntent.slots.ChickenStyle;
    const sideName  = intentRequest.currentIntent.slots.ChickenSides;

    // there is just one restaurant (KFC), so default for now
    const foodItems      = chickenItems[0].foodItems;
    const restaurantName = chickenItems[0].restaurant;

    // go through the array and match the calorie count for the entree
    for (var i = 0; i < foodItems.length; i++) {
	entreeName = styleName + " Chicken " + partName;
	if (entreeName.toLowerCase() === foodItems[i].foodName.toLowerCase()) {
	    entreeCalories = foodItems[i].calories;
	    mealCalories = entreeCalories;
	}
    }

    // prepare message back to the user
    var botResponse = "At " + restaurantName + ", eating a " + entreeName

    // if a side exists, validate as well
    if (sideName.toLowerCase() !== "no" &&
        sideName.toLowerCase() !== "none") {
	console.log("Calculate calories for " + sideName);
	for (var j = 0; j < foodItems.length; j++) {
	    if (sideName.toLowerCase() === foodItems[j].foodName.toLowerCase()) {
	        sideCalories = foodItems[j].calories;
	    }
	}
	mealCalories += sideCalories;
	sessionAttributes.extraName = sideName;
	sessionAttributes.extraCalories = sideCalories; 
	botResponse = botResponse + " and " + sideName;
    }

    botResponse = botResponse + ". That is " + mealCalories + " calories.";

    // save session data for future response
    sessionAttributes.restaurantName = restaurantName;;
    sessionAttributes.foodName       = entreeName;
    sessionAttributes.foodCalories   = entreeCalories;
    sessionAttributes.totalCalories  = mealCalories;

    console.log("saving session data: " + JSON.stringify(sessionAttributes));

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: botResponse }));
}

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    console.log("Data Provided: " + JSON.stringify(intentRequest));

    // Dispatch to the skill's intent handlers
    if (intentRequest.invocationSource === 'DialogCodeHook') {
	console.log("validation mode");
	return validateFields(intentRequest, callback);
    } else {
	console.log("calculation mode");
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

