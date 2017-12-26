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

    if (intentRequest.currentIntent.slots.ChickenPart) {
	// first scrub for naming conventions
	if (intentRequest.currentIntent.slots.ChickenPart.toLowerCase() === "wing") {
	    console.log("scrubbed user provided data for chicken wing");
	    intentRequest.currentIntent.slots.ChickenPart === "Whole Wing";
	} else if (intentRequest.currentIntent.slots.ChickenPart.toLowerCase() === "leg") {
	    console.log("scrubbed user provided data for chicken drumstick");
	    intentRequest.currentIntent.slots.ChickenPart === "Drumstick";
	}
	// make sure that what was provided is a valid choice
	if (intentRequest.currentIntent.slots.ChickenPart.toLowerCase() === "whole wing" ||
	    intentRequest.currentIntent.slots.ChickenPart.toLowerCase() === "breast" ||
	    intentRequest.currentIntent.slots.ChickenPart.toLowerCase() === "thigh" ||
	    intentRequest.currentIntent.slots.ChickenPart.toLowerCase() === "drumstick" ) {
	    console.log("valid chicken part provided");
	} else {
	    // create error message
	    validData = false;
	    const errorMessage = "Hmmm, did you mean Wing, Breast, Thigh, or Drumstick?";
	    const partPrompt = buildValidationResult(false, 'ChickenPart', errorMessage);
	    callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots, partPrompt.violatedSlot, partPrompt.message));	  
	}
    }

    if (intentRequest.currentIntent.slots.ChickenStyle) {
	if (intentRequest.currentIntent.slots.ChickenStyle.toLowerCase() === "original recipe" ||
	    intentRequest.currentIntent.slots.ChickenStyle.toLowerCase() === "extra crispy" ||
	    intentRequest.currentIntent.slots.ChickenStyle.toLowerCase() === "kentucky grilled" ||
	    intentRequest.currentIntent.slots.ChickenStyle.toLowerCase() === "spicy crispy" ) {
	    console.log("valid chicken style provided");
	} else {
            // create error message
            validData = false;
            const errorMessage = "How about Original Recipe, Extra Crispy, Kentucky Grilled or Spicy Crispy?";
            const stylePrompt = buildValidationResult(false, 'ChickenStyle', errorMessage);
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots, stylePrompt.violatedSlot, stylePrompt.message));
        }
    }	

    // validate side item entered
    if (intentRequest.currentIntent.slots.ChickenSides && validData) {
	var validSide = false;
        if (intentRequest.currentIntent.slots.ChickenSides.toLowerCase() === "no" ||
            intentRequest.currentIntent.slots.ChickenSides.toLowerCase() === "none") {
	    validSlide = true;
	} else {
            for (var j = 0; j < chickenItems[0].foodItems.length; j++) {
                if (intentRequest.currentIntent.slots.ChickenSides.toLowerCase() === chickenItems[0].foodItems[j].foodName.toLowerCase()) {
		    validSide = true;
		    intentRequest.currentIntent.slots.ChickenSides = chickenItems[0].foodItems[j].foodName;
                }
            }	
	}
	if (validSide) {
	    validData = true;
        } else {
	    validData = false;
            const errorMessage = "Sorry, I don't have information on " + 
		intentRequest.currentIntent.slots.ChickenSides + ". Try again, or say 'None'.";
            const sidesPrompt = buildValidationResult(false, 'ChickenSides', errorMessage);
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots, sidesPrompt.violatedSlot, sidesPrompt.message))
	}
    }

    if (validData) {
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
    }
}

// this function handles the flow for calculating the amount of calories for a chicken meal

function calculateCalories(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var defaultSize = false;
    var entreeCalories = 0;
    var sideCalories = 0;
    var mealCalories = 0;
    var entreeName = "";
    var buttonData = [];

    // parse out intents provided by the user
    const partName  = intentRequest.currentIntent.slots.ChickenPart;
    const styleName = intentRequest.currentIntent.slots.ChickenStyle;
    const sideName  = intentRequest.currentIntent.slots.ChickenSides;
    const chickenPieces = Number(intentRequest.currentIntent.slots.QuantityPieces);

    // there is just one restaurant (KFC), so default for now
    const foodItems      = chickenItems[0].foodItems;
    const restaurantName = chickenItems[0].restaurant;

    // go through the array and match the calorie count for the entree
    for (var i = 0; i < foodItems.length; i++) {
	entreeName = styleName + " Chicken " + partName;
	if (entreeName.toLowerCase() === foodItems[i].foodName.toLowerCase()) {
	    entreeCalories = foodItems[i].calories * chickenPieces;
	    mealCalories = entreeCalories;
	}
    }

    // prepare message back to the user
    var botResponse = "At " + restaurantName + ", eating " + entreeName;

    // make grammar corret with adding 's' to indicate plural
    if (chickenPieces > 1) {
	botResponse = botResponse + "s";
    }

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

    // if the user indicated they wanted to add a biscuit, add to calories and session
    if (intentRequest.currentIntent.slots.AddBiscuit.toLowerCase() === "yes") {
	botResponse = botResponse + " plus a Biscuit ";
	const biscuitCalories = 180;
	mealCalories += biscuitCalories;
	sessionAttributes.sideName = "Biscuit";
	sessionAttributes.sideCalories = biscuitCalories;
    }

    // if the user indicated that they wanted to add a cookie, add to calories and session
    if (intentRequest.currentIntent.slots.AddCookie.toLowerCase() === "yes") {
	botResponse = botResponse + ", and a cookie for dessert";
	const cookieCalories = 150;
	mealCalories += cookieCalories;
	sessionAttributes.dessertName = "Cookie";
	sessionAttributes.dessertCalories = cookieCalories;
    }

    botResponse = botResponse + ". That is " + mealCalories + " calories.";
    buttonData.push({ "text":"More Details", "value":"more details" });
    buttonData.push({ "text":"Analyze my Meal", "value":"analyze my meal" });

    // save session data for future response
    sessionAttributes.restaurantName = restaurantName;;
    if (chickenPieces === 1) {
	sessionAttributes.foodName = "One Piece of " + entreeName;
    } else if (chickenPieces > 1) {
	sessionAttributes.foodName = chickenPieces + " Pieces of " + entreeName;
    }
    sessionAttributes.foodCalories   = entreeCalories;
    sessionAttributes.totalCalories  = mealCalories;

    console.log("saving session data: " + JSON.stringify(sessionAttributes));

    if (buttonData) {
	callback(buttonResponse(sessionAttributes, botResponse, buttonData));
    } else {
       callback(close(sessionAttributes, 'Fulfilled',
	{ contentType: 'PlainText', content: botResponse }));
    }
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

