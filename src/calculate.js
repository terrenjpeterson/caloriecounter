'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var foodChoices = require("data/foods.json");
var drinks = require("data/drinks.json");
var sauces = require("data/sauces.json");
var dressings = require("data/dressings.json");
var adjustments = require("data/adjustments.json");

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
    var buttonData = [];

    const restaurantName = intentRequest.currentIntent.slots.Restaurant;
    const foodName       = intentRequest.currentIntent.slots.Food;
    const drinkName	 = intentRequest.currentIntent.slots.Drink;
    const extraName 	 = intentRequest.currentIntent.slots.Extra;
    const nuggetQty	 = intentRequest.currentIntent.slots.Quantity;
    const mexFoodType	 = intentRequest.currentIntent.slots.MexicanFoodType;
    const ketchupPackets = intentRequest.currentIntent.slots.PacketsKetchup;
    const ketchup	 = intentRequest.currentIntent.slots.Ketchup;
    const sauce		 = intentRequest.currentIntent.slots.Sauce;
    const dressing	 = intentRequest.currentIntent.slots.Dressing;
    const foodAdjustment = intentRequest.currentIntent.slots.FoodAdjustment;

    var totalCalories 	 = 0;
    var counterResponse  = "";

    // this is the processing for the final confirmation. calculate calories and format message
    console.log("confirm final response - now calculating calories");

    // if the food name was provided, calculate the calories related to it and save
    if (foodName && foodName !== "None") {
	var foodCalories = getFoodCalories(foodName, restaurantName).foodCalories;
	totalCalories += foodCalories;
    	sessionAttributes.foodName     = foodName;
	sessionAttributes.foodCalories = foodCalories;
	counterResponse = "At " + restaurantName + " eating a " + foodName;
	console.log("returned food calories: " + JSON.stringify(foodCalories));
	// check to see if an adjustment was made to the food entree (i.e. no cheese)
        if (foodAdjustment) {
	    if (foodAdjustment.toLowerCase() !== "no changes" &&
		foodAdjustment.toLowerCase() !== "no" &&
		foodAdjustment.toLowerCase() !== "none" ) {
	    	const adjustCalories = getAdjustmentCalories(foodName, restaurantName, foodAdjustment).adjustCalories;
	    	console.log(JSON.stringify(adjustCalories));
	    	sessionAttributes.foodAdjustment = foodAdjustment;
	    	sessionAttributes.foodAdjCalories = adjustCalories;
	    	totalCalories += adjustCalories;
	    	counterResponse = counterResponse + " with " + foodAdjustment;
	    } else {
		console.log("User responded to not adjust food entry.");
	    }
	}
    } else if (nuggetQty) {
	const nuggetName = nuggetQty + " piece chicken nuggets";
        var nuggetCalories = getFoodCalories(nuggetName, restaurantName).foodCalories;
        totalCalories += nuggetCalories
        sessionAttributes.foodName     = nuggetName;
        sessionAttributes.foodCalories = nuggetCalories;
        counterResponse = "At " + restaurantName + " eating a " + nuggetName;
	// check if nuggets also had sauce
	if (sauce.toLowerCase !== "no") {
	    var sauceCalories = getSauceCalories(sauce, restaurantName).sauceCalories;
            totalCalories += sauceCalories  
            sessionAttributes.sauceCalories = sauceCalories;
	    if (sauce.toLowerCase !== "yes") {
	    	sessionAttributes.sauceName = sauce + " sauce";
	    	counterResponse = counterResponse + " with " + sauce + " sauce ";
	    } else {
		sessionAttributes.sauceName = "Nugget Sauce";
		counterResponse = counterResponse + " with dipping sauce";
	    }
	}
        console.log("returned food calories: " + JSON.stringify(nuggetCalories));
    } else if (mexFoodType) {
	const protein = intentRequest.currentIntent.slots.Protein;
	const preparation = intentRequest.currentIntent.slots.Preparation;
	// the food name to lookup is a combination of slots assembled
	var mexFoodName = "";
	var altMexFoodName = "";
	if (protein && preparation) {
	    mexFoodName = preparation + " " + protein + " " + mexFoodType;
	    altMexFoodName = protein + " " + preparation + " " + mexFoodType;
	} else if (protein) {
	    mexFoodName = protein + " " + mexFoodType;
	} else if (preparation) {
	    mexFoodName = preparation + " " + mexFoodType;
	} else {
	    mexFoodName = mexFoodType;
	}
        var mexFoodEval = getFoodCalories(mexFoodName, restaurantName);
	console.log(JSON.stringify(mexFoodEval));
	var mexFoodCalories = mexFoodEval.foodCalories;
	    mexFoodName = mexFoodEval.correctFoodName;
	// this condition is where the combination food name is alternate form (i.e. protein first)
	if (mexFoodCalories === 0) {
	    mexFoodCalories = getFoodCalories(altMexFoodName, restaurantName).foodCalories;
	    mexFoodName = altMexFoodName;
	} 
        totalCalories += mexFoodCalories;
        sessionAttributes.foodName     = mexFoodName;
        sessionAttributes.foodCalories = mexFoodCalories;
        counterResponse = "At " + restaurantName + " eating a " + mexFoodName;
        console.log("returned food calories: " + JSON.stringify(mexFoodCalories));

	// see if any adjustments have been made (i.e. adding guac, removing rice)
        if (foodAdjustment && foodAdjustment.toLowerCase() !== "no changes") {
            const adjustCalories = getAdjustmentCalories(intentRequest.currentIntent.slots.MexicanFoodType, 
		restaurantName, foodAdjustment).adjustCalories;
            console.log(JSON.stringify(adjustCalories));
            sessionAttributes.foodAdjustment = foodAdjustment;
            sessionAttributes.foodAdjCalories = adjustCalories;
            totalCalories += adjustCalories;
            counterResponse = counterResponse + " with " + foodAdjustment;
        }
    }

    // process details related to the extra food item
    if (extraName.toLowerCase() === "nothing" ||
        extraName.toLowerCase() === "none" ||
        extraName.toLowerCase() === "no" ) {
        console.log("Skipping extra as nothing selected");
    } else if (extraName) {
        var extraCalories = getFoodCalories(extraName, restaurantName).foodCalories;
        totalCalories += extraCalories;
	// check if the extra item is the main one - like in a soup or salad
	if (foodName === "None") {
	    counterResponse = "At " + restaurantName + " having a " + extraName;
	} else {
            counterResponse = counterResponse + " and a " + extraName;
	}
	// if ketchup is an optional item for the extra, check what the user response was
	if (ketchup) {
	    if (ketchup.toLowerCase() === "yes") {
		const ketchupCalories = 20;
		counterResponse = counterResponse + " with ketchup";
		sessionAttributes.extraName = extraName + " with ketchup";
		sessionAttributes.extraCalories = extraCalories + ketchupCalories;
		totalCalories += ketchupCalories;
	    } else {
            	sessionAttributes.extraName     = extraName;
            	sessionAttributes.extraCalories = extraCalories;
	    }
	// check if a dressing has been added - likely the extra was a type of salad
	} else if (dressing) {
	    if (dressing === "no" || dressing === "none") {
		console.log("No dressing on the salad. Don't add calories.");
	    } else {
		// call the function that calculates the dressing calories and add to response
		const dressingData = getDressingCalories(dressing, restaurantName).dressingData;
		console.log("Dressing: " + JSON.stringify(dressingData));
		counterResponse = counterResponse + " with " + dressingData.name + " Dressing ";
		sessionAttributes.dressingName     = dressingData.name;
		sessionAttributes.dressingCalories = dressingData.calories;
		sessionAttributes.dressingCarbs    = dressingData.carbs;
		totalCalories += dressingData.calories;
	    }
            sessionAttributes.extraName     = extraName;
            sessionAttributes.extraCalories = extraCalories;
	} else {
	    // normal extra - save session data
            sessionAttributes.extraName     = extraName;
            sessionAttributes.extraCalories = extraCalories;
	}
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
    	sessionAttributes.drinkCalories = drinkCalories;
        // find the drink size to add specificity to the response
        const drinkSize = getDrinkSize(drinkName).drinkSize;
        if (drinkSize > 0) {
            counterResponse = counterResponse + " and drinking a " + drinkSize + " oz. " + drinkName + ". ";
	    sessionAttributes.drinkName = drinkSize + " oz. " + drinkName;
        } else {
            counterResponse = counterResponse + " and drinking a " + drinkName + ". ";
	    sessionAttributes.drinkName = drinkName;
        }
    }

    // save session attributes for later reference
    sessionAttributes.restaurantName = restaurantName;

    counterResponse = counterResponse + "That is " + totalCalories + " calories. ";
    sessionAttributes.totalCalories  = totalCalories;

    if (totalCalories > sessionAttributes.foodCalories || 
	sessionAttributes.dressingCalories > 0 ||
	sessionAttributes.foodAdjCalories > 0 ) {
	buttonData.push({ "text":"More Details", "value":"more details" });
    } else {
	buttonData.push({ "text":"Analyze my Meal", "value":"analyze my meal" });
	counterResponse = counterResponse + "To analyze this meal vs. your daily recommended calorie intake, " +
	    "please select 'analyze my meal'. ";
    }

    // for Panera, the option for counting carbs is available as an option as well
    if (sessionAttributes.restaurantName === "Panera") {
        buttonData.push({ "text":"Get Carb Detail", "value":"Get carbs" });
    }

    console.log("saving session data: " + JSON.stringify(sessionAttributes));

    if (buttonData) {
	callback(buttonResponse(sessionAttributes, counterResponse, buttonData));
    } else {
       callback(close(sessionAttributes, 'Fulfilled',{ contentType: 'PlainText', content: counterResponse }));
    }
}

// this function converts the calorie count into carbs
function calculateCarbs(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var restaurantFoodItems = [];
    var foodCarbs = 0;
    var extraCarbs = 0;
    var drinkCarbs = 0;
    var counterResponse = "";

    console.log(JSON.stringify(sessionAttributes));

    // first verify that a restaruant and food names have been given
    if (!sessionAttributes.restaurantName || !sessionAttributes.foodName) {
	counterResponse = "First get the meal information, then I will count the carbs.";
    } else if (sessionAttributes.restaurantName === "Panera") {
	// retrieve nutrition info for the restaurant
    	for (var i = 0; i < foodChoices.length; i++) {
            if (sessionAttributes.restaurantName.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            	restaurantFoodItems = foodChoices[i].foodItems;
            }
    	}

	// attempt to match the food name
	if (sessionAttributes.foodName) {
     	    for (var j = 0; j < restaurantFoodItems.length; j++) {
            	if (sessionAttributes.foodName.toLowerCase() === restaurantFoodItems[j].foodName.toLowerCase()) {
            	    console.log("matched recommendation for " + restaurantFoodItems[j].foodName);
            	    foodCarbs = restaurantFoodItems[j].carbs;
            	}
	    }
    	}

	// attempt to match the extra name
    	if (sessionAttributes.extraName) {
            for (var j = 0; j < restaurantFoodItems.length; j++) {
            	if (sessionAttributes.extraName.toLowerCase() === restaurantFoodItems[j].foodName.toLowerCase()) {
                    console.log("matched recommendation for " + restaurantFoodItems[j].foodName);
                    extraCarbs = restaurantFoodItems[j].carbs;
            	}
            }
    	}

	counterResponse = "There are " + foodCarbs + " g of carbs in " + sessionAttributes.foodName;
	if (extraCarbs > 0) {
	    counterResponse = counterResponse + ", and there are " + extraCarbs + " g of carbs in " +
		sessionAttributes.extraName + ". ";
	    counterResponse = counterResponse + "For a total of " + (foodCarbs + extraCarbs) + " g of carbs.";
	} else {
	    counterResponse = counterResponse + ". ";
	}
    } else {
    	counterResponse = "Sorry, I don't have carb counts for " + sessionAttributes.restaurantName + ".";
    }

    callback(close(sessionAttributes, 'Fulfilled',{ contentType: 'PlainText', content: counterResponse }));
}

// this function looks up food calories based on a food name
function getFoodCalories(foodName, restaurantName) {
    var restaurantFoodItems = [];
    var foodCalories = 0;
    var correctFoodName = "";

    for (var i = 0; i < foodChoices.length; i++) {
        if (restaurantName.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            restaurantFoodItems = foodChoices[i].foodItems;
        }
    } 

    for (var j = 0; j < restaurantFoodItems.length; j++) {
	if (foodName.toLowerCase() === restaurantFoodItems[j].foodName.toLowerCase()) {
	    console.log("matched recommendation for " + restaurantFoodItems[j].foodName);
	    foodCalories = restaurantFoodItems[j].calories;
	    // pass back corrected name if one exists
	    if (restaurantFoodItems[j].correctedTerm) {
		correctFoodName = restaurantFoodItems[j].correctedTerm;
	    } else {
	    	correctFoodName = restaurantFoodItems[j].foodName;
	    }
	}
    }

    return {
	foodCalories, correctFoodName
    };
}

// this function looks up dressing calories based on a dressing and restaurant name
function getDressingCalories(dressing, restaurantName) {
    console.log("calculate dressing type provided: " + dressing + " at " + restaurantName);
    var validDressing = false;
    var dressingData = {};

    // go through all of the dressing names and try and find a match
    for (var i = 0; i < dressings.length; i++) {
    	console.log("dressings: " + JSON.stringify(dressings[i]));
        for (var j = 0; j < dressings[i].restaurantNames.length; j++) {
            if (dressings[i].restaurantNames[j].toLowerCase() === restaurantName.toLowerCase()) {
                if (dressing.toLowerCase() === dressings[i].dressingName.toLowerCase()) {
                    console.log("Matched dressing for restaurant too.");
                    validDressing = true;
		    dressingData.calories = dressings[i].calories;
		    dressingData.carbs    = dressings[i].carbs;
		    dressingData.name     = dressings[i].dressingName;
                }
            }
        }
    }

    // return the number of calories
    return {
	dressingData
    };
}


// this function looks up sauce calories based on a sauce name
function getSauceCalories(sauce, restaurantName) {
    var sauceCalories = 45;

    for (var i = 0; i < sauces.length; i++) {
	if (sauce.toLowerCase() === sauces[i].sauceName.toLowerCase()) {
	    sauceCalories = sauces[i].calories;
	}
    }

    return {
	sauceCalories
    };
}

// this function looks up any adjustments to the food
function getAdjustmentCalories(foodName, restaurantName, foodAdjustment) {
    var adjustCalories = 0;

    console.log("Finding adjustment for " + foodName + " to " + foodAdjustment + " at " + restaurantName);

    for (var i = 0; i < adjustments.length; i++) {
	if (restaurantName.toLowerCase() === adjustments[i].restaurant.toLowerCase()) {
	    console.log("matched restaurant");
	    console.log(JSON.stringify(adjustments[i]));
	    for (var j = 0; j < adjustments[i].menuAdjustments.length; j++) {
		if (foodName.toLowerCase() === adjustments[i].menuAdjustments[j].foodName.toLowerCase()) {
		    console.log("matched menu item");
		    for (var k = 0; k < adjustments[i].menuAdjustments[j].adjustments.length; k++) {
			if (foodAdjustment.toLowerCase() === adjustments[i].menuAdjustments[j].adjustments[k].change.toLowerCase()) {
			    console.log("Found a Match:" + JSON.stringify(adjustments[i].menuAdjustments[j].adjustments[k]));
			    adjustCalories = adjustments[i].menuAdjustments[j].adjustments[k].calorieAdj;
			}
		    }
		}
	    }
	}
    }

    return {
	adjustCalories
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
        return calculateCalories(intentRequest, callback);
    } else if (intentName === 'GetCarbs') {
	console.log("calculate carbs for the meal");
	return calculateCarbs(intentRequest, callback);
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
