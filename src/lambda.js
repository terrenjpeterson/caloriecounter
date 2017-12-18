'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var foodChoices = require("data/foods.json");
var drinks = require("data/drinks.json");
var restaurants = require("data/restaurants.json");
var sauces = require("data/sauces.json");
var dressings = require("data/dressings.json");
var adjustments = require("data/adjustments.json");

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

function buttonSlot(sessionAttributes, intentName, slots, slotToElicit, messageContent, buttonData) {
    console.log("processing:" + JSON.stringify(buttonData));
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message: { contentType: 'PlainText', content: messageContent },
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

function closeButton(sessionAttributes, fulfillmentState, message, buttonData) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
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

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

function delegateButton(sessionAttributes, slots, buttonData) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
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

// ---------------- Helper Functions --------------------------------------------------

function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

// this function will validate that the restaurant provided by the user matches what data we have
function validateRestaurant(intentRequest) {
    var validRestaurant = false;
    const slots = intentRequest.currentIntent.slots;

    // correct common mistakes for restaurant names, then attempt to match
    if (slots.Restaurant) {
	var updatedName = scrubRestaurantName(slots.Restaurant).scrubData.restaurantName;
	if (updatedName) {
	    slots.Restaurant = updatedName;
	}
        console.log("validating restaurant:" + slots.Restaurant);
        for (var i = 0; i < restaurants.length; i++) {
            if (slots.Restaurant.toLowerCase() === restaurants[i].restaurantName.toLowerCase() &&
		restaurants[i].validRestaurant) {
                console.log("found a match for " + restaurants[i].restaurantName);
                validRestaurant = true;
		slots.Restaurant = restaurants[i].restaurantName;
            }
        }
    }
    
    // create response. if restaurant didn't match, respond as such, else pass back as supported.
    if (validRestaurant) {
        console.log("passed restaurant validation");
        return { isValid: true };
    } else if (slots.Restaurant) {
        console.log("failed restaurant validation");
	var botResponse = "Sorry, I haven't learned about " + slots.Restaurant + " yet.";
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
			intentRequest.currentIntent.restaurant = foodChoices[i].restaurant;
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
               restaurantName.toLowerCase() === "chic-fil-a" ||
               restaurantName.toLowerCase() === "chik fil a" ||
               restaurantName.toLowerCase() === "chikfila") {
        console.log("corrected restaurant name typo");
        scrubData.restaurantName = "Chick-fil-A";
    } else if (restaurantName.toLowerCase() === "arby's" ||
               restaurantName.toLowerCase() === "arby" ||
               restaurantName.toLowerCase() === "arby’s") {
        console.log("corrected restaurant name apostrophie");
        scrubData.restaurantName = "Arbys";
    } else if (restaurantName.toLowerCase() === "5 guys" ||
	       restaurantName.toLowerCase() === "5 guy's" ||
               restaurantName.toLowerCase() === "5 guy’s" ||
	       restaurantName.toLowerCase() === "five guy's" || 
               restaurantName.toLowerCase() === "five guy’s") {
	console.log("correct restaurant name apostrophie");
	scrubData.restaurantName = "Five Guys";
    } else if (restaurantName.toLowerCase() === "in-and-out" ||
	       restaurantName.toLowerCase() === "in and out" ||
	       restaurantName.toLowerCase() === "in n out") {
	console.log("corrected restaurant name hyphens");
	scrubData.restaurantName = "In-N-Out";
    }

    return {
	scrubData
    };
}

// this function will validate that the restaurant provided by the user matches what data we have
function validateFood(intentRequest) {
    var validFood = false;
    var restaurant = intentRequest.currentIntent.slots.Restaurant;
    var foodItems = [];
    var foodCalories = 0;
    var slots = intentRequest.currentIntent.slots;

    console.log("validating food entered " + slots.Food);

    // sort through the food choices and pull out those relating to the restaraunt that has already been validated
    if (restaurant) {
        for (var i = 0; i < foodChoices.length; i++) {
            //console.log("checking: " + JSON.stringify(foodChoices[i]));
            if (restaurant.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
                foodItems = foodChoices[i].foodItems;
                console.log("match restaurant - food items: " + JSON.stringify(foodItems));
	    }
        }
    }

    // attempt to match the food with the restaurant menu
    if (slots.Food) {
        console.log("validating food: " + slots.Food);
        for (var j = 0; j < foodItems.length; j++) {
            if (slots.Food.toLowerCase() == foodItems[j].foodName.toLowerCase()) {
                console.log("found a match for " + foodItems[j].foodName + " calories " + foodItems[j].calories);
                validFood = true;
                foodCalories = foodItems[j].calories;
		// check if there is an alternative spelling or expanded term for the food item
		if (foodItems[j].correctedTerm) {
		    slots.Food = foodItems[j].correctedTerm;
		} else {
		    slots.Food = foodItems[j].foodName;
		}
		// check if the item is already a side (i.e. fries) as we would then skip that question
		if (foodItems[j].sideItem) {
		    if (!intentRequest.currentIntent.slots.Extra) {
                        console.log("natural side item - don't ask for extra");
		        intentRequest.currentIntent.slots.Extra = "No";
		    }
		}
            } else if (slots.Extra) {
		// make sure that the parsing hasn't separated a combo food term - i.e. Ham and Swiss
		const combineFoodWords = slots.Food + " and " + slots.Extra;
		if (combineFoodWords.toLowerCase() === foodItems[j].foodName.toLowerCase()) {
		    console.log("Found a match by creating combo term " + combineFoodWords + " calories " + foodItems[j].calories);
		    intentRequest.currentIntent.slots.Extra = "";
		    //slots[`${extraValidationResult.violatedSlot}`] = null;
		    intentRequest.currentIntent.slots.Food = combineFoodWords;
                    validFood = true;
                    foodCalories = foodItems[j].calories;
		}
	    }
        }
    }
    
    // create response. if food item didn't match, respond as such, else pass back as supported.
    if (validFood) {
        console.log("passed food validation");
        return { isValid: true, calories: foodCalories };
    } else if (slots.Food) {
	const foodError = processFoodEntryError(intentRequest);
	console.log(JSON.stringify(foodError));
	return buildValidationResult(false, 'Food', foodError.message.content);
    } else {
        console.log("no food items provided yet.");
        return { isValid: true };
    }
}

// process handling of a food entry that failed the initial validation
function processFoodEntryError(intentRequest) {
    var slots = intentRequest.currentIntent.slots;

    console.log("failed food validation");

    var vagueFoodEval = vagueFood(slots.Food, slots.Restaurant).vagueFoodResponse;

    // this is for the *too value* error condition
    if (vagueFoodEval.assessment) {
	return buildValidationResult(false, 'Food', vagueFoodEval.msg);
    // this is for a run on request being made
    } else if (slots.Food.length > 25) {
	return buildValidationResult(false, 'Food', 'Can you just start by saying just the first item?');
    } else {
        // this is the generic error message where a match can't be found
	console.log("match can't be found");
	var botResponse = "Sorry, I don't have information for " + slots.Food;
	if (slots.Restaurant) {
	    botResponse = botResponse + " at " + slots.Restaurant + 
		". Please say 'What are my food options at " + slots.Restaurant + "' for help.";
	} else {
	    botResponse = botResponse + ". Please try another restaurant, or say list restaurants.";
	}
        return buildValidationResult(false, 'Food', botResponse);
    }
}

// this evaluates if the request was too vague, and formulates a response for the user to be more specific

function vagueFood(foodName, restaurantName) {
    var vagueFoodResponse = {};
    var foodItems = [];

    console.log("checking for vague food request");

    if (foodName.toLowerCase() === "taco" ||
        foodName.toLowerCase() === "tacos" ||
	foodName.toLowerCase() === "soft taco" ||
        foodName.toLowerCase() === "burrito" ||
	foodName.toLowerCase() === "chalupa" ||
        foodName.toLowerCase() === "sub" ||
	foodName.toLowerCase() === "burger" ||
        foodName.toLowerCase() === "sandwich" ||
	foodName.toLowerCase() === "footlong" ||
	foodName.toLowerCase() === "turkey" ||
        foodName.toLowerCase() === "steak" ||
        foodName.toLowerCase() === "salad" ||
	foodName.toLowerCase() === "snack wrap" ||
	foodName.toLowerCase() === "nuggets" ||
        foodName.toLowerCase() === "chicken nuggets" ||
        foodName.toLowerCase() === "chicken nugget" ||
        foodName.toLowerCase() === "chicken tenders" ||
        foodName.toLowerCase() === "chicken strips" ||
        foodName.toLowerCase() === "chicken") {

        vagueFoodResponse.assessment = true;

	// check to see if any food items match the terms above
	if (restaurantName) {
	    foodItems = getFoodItems(foodName, restaurantName).foodItems;
	}

	console.log("Potential Food Items: " + JSON.stringify(foodItems)); 

	// format response message that will be related to the user
	vagueFoodResponse.msg = "Can you be more specific? Say something like ";

	// if any recommendations come from the food array, explicitly suggest
	if (foodItems.length > 0) {
	    for (var i = 0; i < foodItems.length; i++) {
	        vagueFoodResponse.msg = vagueFoodResponse.msg + foodItems[i] + ", ";
	    }
	} else {
            vagueFoodResponse.msg = "Can you be more specific? There are many types of " + foodName + " to choose from.";
	}
    }

    return {
        vagueFoodResponse
    };
}

// this retrieves the food items for a given restaurant and food type

function getFoodItems(foodType, restaurantName) {
    var restaurantFoodItems = [];
    var foodItems = [];

    console.log("Finding potential food items for " + foodType + " at " + restaurantName + ".");

    // sort through the food choices and pull out those relating to the restaraunt that has already been validated
    for (var i = 0; i < foodChoices.length; i++) {
        if (restaurantName.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            restaurantFoodItems = foodChoices[i].foodItems;
        }
    } 

    console.log(JSON.stringify(restaurantFoodItems));

    // sort through the food choices, and pull out just those that match the food type
    for (var j = 0; j < restaurantFoodItems.length; j++) {
	if (restaurantFoodItems[j].foodType) {
	    if (foodType.toLowerCase() === restaurantFoodItems[j].foodType.toLowerCase()) {
	        console.log("matched recommendation for " + restaurantFoodItems[j].foodName);
	        foodItems.push(restaurantFoodItems[j].foodName);
	    }
	}
    }

    return {
	foodItems
    };
}

// this retrieves the types of food at a given restaurant
function getFoodTypes(restaurantName) {
    var foodOptions = [];
    var foodItems = [];

    console.log("finding food options at " + restaurantName);

    for (var i = 0; i < foodChoices.length; i++) {
        if (restaurantName.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            foodItems = foodChoices[i].foodItems;
            console.log("match restaurant - food items: " + JSON.stringify(foodItems));
	}
    }

    for (var j = 0; j < foodItems.length; j++) {
	if (foodItems[j].foodType) {
	    var newEntry = true;
	    for (var k = 0; k < foodOptions.length; k++) {
		if (foodItems[j].foodType.toLowerCase() === foodOptions[k].toLowerCase()) {
		    newEntry = false;
	        }
	    }
	    if (newEntry) {
	    	console.log("Food Type: " + foodItems[j].foodType);
	    	foodOptions.push(foodItems[j].foodType);
	    }
	}
    }

    return {
	foodOptions
    };
}

// this function will validate if the extra is another type of food
function validateExtra(slots) {
    var validExtra = false;
    var extraCalories = 0;
    var restaurant = slots.Restaurant;
    var foodItems = [];
    var ketchupItem = false;
    var dressingItem = false;

    console.log("validated extra item " + slots.Extra);

    // sort through the food choices and pull out those relating to the restaraunt that has already been validated
    for (var i = 0; i < foodChoices.length; i++) {
        if (slots.Restaurant.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            foodItems = foodChoices[i].foodItems;
            console.log("match restaurant - food items: " + JSON.stringify(foodItems));
        }
    }

    // take the array of food items from the matching restaurant, and attempt to match the extra item
    for (var j = 0; j < foodItems.length; j++) {
	// matched extra item
        if (slots.Extra.toLowerCase() == foodItems[j].foodName.toLowerCase()) {
            console.log("found a match for " + foodItems[j].foodName + " calories " + foodItems[j].calories);
            validExtra = true;
            extraCalories = foodItems[j].calories;
	    // check if a food term is corrected - i.e. Medium Fries vs. Fries
	    if (foodItems[j].correctedTerm) {
		slots.Extra = foodItems[j].correctedTerm;
	    } else {
            	slots.Extra = foodItems[j].foodName;
	    }
	    // check if the item could use ketchup, if so, set a flag to make mandatory later
	    if (foodItems[j].ketchupItem) {
		console.log("this is a ketchup item - i.e. fries. prompt accordingly for additional detail.");
		ketchupItem = true;
	    }
	    // check if the item could use a dressing, if so, set a flag to make it mandatory later
	    if (foodItems[j].dressingItem) {
		console.log("this is a dressing item - i.e. a salad. prompt accordingly for additional detail.");
		dressingItem = true;
	    }
        }
    }    

    // find out if someone entered multiple items for the extra started by the word fries
    if (!validExtra && slots.Extra.substring(0,5).toLowerCase() === "fries") {
        slots.Drink = slots.Extra.substring(6,slots.Extra.length);
	slots.Extra = "fries";
	validExtra = true;
    }

    // create response. if extra food item didn't match, respond as such, else pass back as supported.
    if (validExtra) {
        console.log("passed extra validation");
        return { isValid: true, calories: extraCalories, ketchup: ketchupItem, dressing: dressingItem };
    // check if a variation of no was made. this is valid, just will not be in the lookup tables
    } else if (slots.Extra.toLowerCase() === "nothing" ||
	       slots.Extra.toLowerCase() === "none" ||
	       slots.Extra.toLowerCase() === "no." ||
	       slots.Extra.toLowerCase() === "No side items" ||
	       slots.Extra.toLowerCase() === "No side items." ||
	       slots.Extra.toLowerCase() === "no" ) {
	console.log("no extra provided");
	return { isValid: true, calories: 0 };
    // check if a generic yes answer was provided. if so, ask to provide the specific name
    } else if (slots.Extra.toLowerCase().substring(0, 3) === "yes" ) {
	console.log("extra question answered with a yes - clarify");
	return buildValidationResult(false, 'Extra', "What side item would you like to add?");
    // check if a generic request for soup was made
    } else if (slots.Extra.toLowerCase() === "cup of soup" ||
	       slots.Extra.toLowerCase() === "soup") {
	console.log("generic cup of soup requested - ask to clarify");
	var botResponse = "Which type of soup would you like? For example, Chicken Noodle Soup.";
	if (slots.Restaurant) {
	    botResponse = slots.Restaurant + " has great soup. Which type are you eating? My favorite is Chicken Noodle Soup.";
	} 
	return buildValidationResult(false, 'Extra', botResponse);
    // this is the base failed validation of the extra name.
    } else {
	console.log("failed extra validation - generic error handling for " + slots.Extra);
	var genericResponse = "Sorry, I dont have information for " + slots.Extra + ". Please try again.";
	return buildValidationResult(false, 'Extra', genericResponse);
    }
}

// this function will validate the dressings answer provided by the user
function validateDressing(intentRequest) {
    const slots = intentRequest.currentIntent.slots;

    console.log("validating answer around which dressing is on a salad");

    if (slots.Dressing.toLowerCase() === "no" ||
	slots.Dressing.toLowerCase() === "none ") {
	console.log("negative answer given for dressing response - no additional validation.");
        return { isValid: true };
    } else if (slots.Dressing.toLowerCase() === "yes") {
	console.log("user said they wanted dressing, but didn't provide a name of one");
        return buildValidationResult(false, 'Dressing', 'Which type of dressing?');
    } else {
	// user entered a dressing name
	console.log("validate dressing type provided: " + slots.Dressing);
	var validDressing = false;
	var dressingOptions = [];

	// go through all of the dressing names and try and find a match
	for (var i = 0; i < dressings.length; i++) {
	    for (var j = 0; j < dressings[i].restaurantNames.length; j++) {
		if (dressings[i].restaurantNames[j].toLowerCase() === slots.Restaurant.toLowerCase()) {
		    console.log("Found a valid dressing name: " + dressings[i].dressingName);
		    dressingOptions.push(dressings[i].dressingName); 
	    	    if (slots.Dressing.toLowerCase() === dressings[i].dressingName.toLowerCase()) {
			console.log("Matched dressing for restaurant too.");
			validDressing = true;
		    }
		}
	    }
	}

	// if a match was found, consider the field validated. if not, provide options for restaurant
	if (validDressing) {
	    return { isValid: true }
	} else {
	    // read back the valid salad dressing options
	    var botResponse = "Sorry, " + slots.Restaurant + " doesn't have " + slots.Dressing + ". " +
		"They do have ";
	    for (var k = 0; k < dressingOptions.length; k++) {
		botResponse = botResponse + dressingOptions[k] + ", ";
	    }
	    return buildValidationResult(false, 'Dressing', botResponse);
	}
    }

}

// this function will validate the adjustments being requested by the user
function validateFoodAdjustments(intentRequest) {
    console.log("validating adjustments provided " + intentRequest.currentIntent.slots.FoodAdjustment);

    return { isValid: true};
}

// this function will validate the sauce answer provided by the user
function validateSauce(intentRequest) {
    const slots = intentRequest.currentIntent.slots;

    console.log("validating sauce response provided " + slots.Sauce);

    if (slots.Sauce.toLowerCase() === "no" ||
	slots.Sauce.toLowerCase() === "no thanks" ||
	slots.Sauce.toLowerCase() === "none" ||
	slots.Sauce.toLowerCase() === "yes") {
	console.log("binary answer given for sauce response - no additional validation.");
	return { isValid: true};
    } else {
	// not a binary answer - try and match from table
	var validSauceName = false;
	var restaurantSauces = [];
	console.log("Check sauce table." + JSON.stringify(sauces));
	for (var i = 0; i < sauces.length; i++) {
	    // check to see if there is a match with the sauce name
	    if (sauces[i].sauceName.toLowerCase() === slots.Sauce.toLowerCase()) {
		console.log("Matched sauce name.");
		validSauceName = true;
		intentRequest.currentIntent.slots.Sauce = sauces[i].sauceName;
	    } 
	    // save the sauce name if it matches the restaurant. this may be used in the response.
	    if (sauces[i].restaurantNames) {
	    	for (var j = 0; j < sauces[i].restaurantNames.length; j++) {
		    if (sauces[i].restaurantNames[j].toLowerCase() === slots.Restaurant.toLowerCase()) {
		        restaurantSauces.push(sauces[i].sauceName);
		    }
		}
	    }
	}
	if (validSauceName) {
	    return { isValid: true};
	} else {
	    // sauce name wasn't valid. return response with those info is available on.
	    console.log("Couldn't match sauce name provided.");
	    var botResponse = "Sorry, I don't have info on " + slots.Sauce + ". " +
		"How about ";
	    console.log("Sauce Alternatives to Suggest: " + JSON.stringify(restaurantSauces));
	    for (var k = 0; k < restaurantSauces.length; k++) {
		if ((k+1) < restaurantSauces.length) {
		    botResponse = botResponse + restaurantSauces[k] + ", ";
		} else {
		    botResponse = botResponse + " or " + restaurantSauces[k] + "?";
		}
	    }
            return buildValidationResult(false, 'Sauce', botResponse);
        }
    }
}

// this function will validate that the drink provided is something that calorie detail is available for
function validateDrink(slots) {
    var validDrink = false;
    var drinkCalories = 0;

    console.log("validating drink entered " + slots.Drink);

    // make sure a Drink has been provided, then attempt to validate
    if (slots.Drink) {
        for (var j = 0; j < drinks.length; j++) {
            if (slots.Drink.toLowerCase() === drinks[j].drinkName.toLowerCase()) {
                console.log("found a match for " + drinks[j].drinkName + " calories " + drinks[j].calories);
                validDrink = true;
                drinkCalories = drinks[j].calories;
  		slots.Drink = drinks[j].drinkName;
            }
        }
    }
    
    // create response. if the drink item didn't match, respond as such, else pass back as supported.
    if (validDrink) {
        console.log("passed drink validation");
        return { isValid: true, calories: drinkCalories };
    } else if (slots.Drink) {
        console.log("failed drink validation" + JSON.stringify(slots.Drink));
	if (slots.Drink.toLowerCase() === "drink" || 
	    slots.Drink.toLowerCase() === "small drink" ||
	    slots.Drink.toLowerCase() === "medium drink" ||
            slots.Drink.toLowerCase() === "large drink" ||
	    slots.Drink.toLowerCase() === "yes" ) {
	    // in this case, the response was too vague - so instruct the user to be more specific
            return buildValidationResult(false, 'Drink', 'Please say a drink name, for example, Small Coke.');
	} else if (!slots.Extra) {
	    // check to see if the extra food item is in the drink slot
	    slots.Extra = slots.Drink;
            const extraValidationResult = validateExtra(slots);
            console.log("Validation Result: " + JSON.stringify(extraValidationResult));
            if (extraValidationResult.isValid) {
		// in this case, the attribute has been moved to the Extra slot, so overlay Drink as nothing and pass validation
		slots.Drink = "Nothing";
		return { isValid: true, calories: 0 };
	    } else {
		// in this case, the drink value wasn't an extra food - just a bad entry
		slots.Extra = "";
                return buildValidationResult(false, 'Drink', `Sorry, I dont have information for ` + slots.Drink + '. Please try again.');
	    }
	} else {
            return buildValidationResult(false, 'Drink', `Sorry, I dont have information for ` + slots.Drink + '. Please try again.');
	}
    } else {
        console.log("no drink items provided yet.");
        return { isValid: true };
    }
}

// this function will validate chicken nugget entry
function validateNuggets(nuggets, restaurantName) {
    console.log("validating " + nuggets + " nuggets at " + restaurantName);

    // first make sure it is a restaurant that sells nuggets
    if (restaurantName.toLowerCase() === "mcdonalds" ||
	restaurantName.toLowerCase() === "wendys" ||
	restaurantName.toLowerCase() === "burger king" ||
	restaurantName.toLowerCase() === "chick-fil-a") {
        // food type is nuggets, so build food name and validate it
        console.log("Valid restaurant for nuggets, now validate " + nuggets + " chicken nuggets");

        // check if quantity of nuggets is correct
        if (nuggets == 20 && restaurantName.toLowerCase() === "mcdonalds" ||
	    nuggets == 20 && restaurantName.toLowerCase() === "burger king" ||
	    nuggets == 12 && restaurantName.toLowerCase() === "chick-fil-a" ||
	    nuggets == 10 && restaurantName.toLowerCase() !== "chick-fil-a" ||
	    nuggets == 6 ||
	    nuggets == 4) {
            return { isValid: true };
	    console.log("valid nuggets quantity of " + nuggets + ".");
        } else {
            console.log("Invalid nuggets quantity " + nuggets + ". Pass back failed validation");
	    var botMessage = "Hmmm, " + nuggets + " is not a valid number of nuggets at " + restaurantName + ". Please try again.";
	    return buildValidationResult(false, 'Quantity', botMessage);
	}
    } else if (restaurantName)  {
	console.log("Restaurant doesnt have nuggets");
	return buildValidationResult(false, 'Restaurant', 'Sorry ' + restaurantName + ' does not sell nuggets.');
    } else {
	console.log("No restaurant name provided to find nuggets at.");
        return buildValidationResult(false, 'Restaurant', 'Please provide a restaurant name.');
    }
}

// this function checks requests from mexican food restaurants

function validateMexicanFood(intentRequest) {
    console.log("Running Validation for Mexican Food Types");
    var restaurant = intentRequest.currentIntent.slots.Restaurant;
    var foodType = intentRequest.currentIntent.slots.MexicanFoodType;

    if (!restaurant && intentRequest.sessionAttributes.restaurantName) {
	console.log("no restaurant entered, but one in session");
	restaurant = intentRequest.sessionAttributes.restaurantName;
	intentRequest.currentIntent.slots.Restaurant = intentRequest.sessionAttributes.restaurantName;
    }

    // start by checking for a restaurant. can't do any matching without it
    if (restaurant) {
	// first make sure that this is getting invoked for a mexican restaurant
	if (restaurant.toLowerCase() !== 'taco bell' &&
	    restaurant.toLowerCase() !== 'chipotle') {
	    console.log("Restaurant doesn't have Mexican food");
	    return buildValidationResult(false, 'Restaurant', 'Sorry No types of ' + foodType + ' at ' + restaurant + '.');
	} else {
	    // get the list of food items for the mexican restaurant
	    var restaurantFoodItems = [];
            for (var i = 0; i < foodChoices.length; i++) {
            	//console.log("checking: " + JSON.stringify(foodChoices[i]));
            	if (restaurant.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
                    restaurantFoodItems = foodChoices[i].foodItems;
                    console.log("match restaurant - food items: " + JSON.stringify(restaurantFoodItems));
	    	}
	    }
	    // now attempt to match the food item with what is available at the restaurant
	    if (restaurantFoodItems.length > 0) {
		// first check if a protein type was provided. If not, the request might be too generic (i.e. taco, burrito)
		const protein = intentRequest.currentIntent.slots.Protein;
                var botResponse = "";
		var foodRequest = "";
                var foundFoodMatch = false;
		if (protein) {
		    // both a food item and protein were provided - so potentially a match can be found
		    const foodPrep = intentRequest.currentIntent.slots.Preparation;
		    // altRequest is a different ordering of the same characteristics
		    var altRequest = "";
		    if (foodPrep) {
			foodRequest = foodPrep + " " + protein + " " + foodType;
			altRequest  = protein + " " + foodPrep + " " + foodType;
		    } else {
			foodRequest = protein + " " + foodType;
			altRequest  = "not applicable";
		    }
		    console.log("Attempt to match: " + foodRequest);
		    var altFood = [];
		    for (var j = 0; j < restaurantFoodItems.length; j++) {
			// this looks for an exact match
			if (foodRequest.toLowerCase() === restaurantFoodItems[j].foodName.toLowerCase() || 
                             altRequest.toLowerCase() === restaurantFoodItems[j].foodName.toLowerCase()) {
			    foundFoodMatch = true;
			}
			// this builds an array of alternative foods with matching food type - and potentially protein
			if (restaurantFoodItems[j].foodType) {
			    if (foodType.toLowerCase() === restaurantFoodItems[j].foodType.toLowerCase()) {
				if (restaurantFoodItems[j].protein) {
				    if (protein.toLowerCase() === restaurantFoodItems[j].protein.toLowerCase()) {
					altFood.push(restaurantFoodItems[j].foodName);
				    }
				} else {
			   	    altFood.push(restaurantFoodItems[j].foodName);
				}
			    }
			}
		    }
		    // if an exact match was found, return valid response
		    if (foundFoodMatch) {
                    	return { isValid: true };
		    } else {
			// an exact match wasn't found - but leverage alternatives that were a close match
			botResponse = "Sorry, I couldn't find " + foodRequest + " at " + restaurant + ".";
			if (altFood.length > 0) {
			    botResponse = "Can you be more specific? For example, say ";
			    for (var k = 0; k < altFood.length; k++) {
			    	botResponse = botResponse + altFood[k] + ", ";
			    }
			}
			return buildValidationResult(false, 'Protein', botResponse);
		    }
		} else {
		    // no protein was provided, so check if it's needed.
		    foodRequest = intentRequest.currentIntent.slots.MexicanFoodType;
		    console.log("Attempt to match " + foodRequest);
		    for (var m = 0; m < restaurantFoodItems.length; m++) {
			if (restaurantFoodItems[m].foodName.toLowerCase() === foodRequest.toLowerCase()) {
			    console.log("Matched food name " + restaurantFoodItems[m].foodName + ".");
			    foundFoodMatch = true;
			}
		    }
		    if (foundFoodMatch) {
			return buildValidationResult(true);
		    } else {
		    	botResponse = "What type of a " + foodType + " are you eating? (i.e. chicken, steak)";
		    	return buildValidationResult(false, 'Protein', botResponse);
		    }
		}
	    } else {
		return buildValidationResult(false, 'Restaurant', 'Sorry No types of ' + foodType + ' at ' + restaurant + '.');
	    }
	}
    } else {
	console.log("Mexican food but no restaurant entered yet.");
	return buildValidationResult(false, 'Restaurant', 'Which restaurant are you at (i.e. Taco Bell, Chipotle)?');
    }
}

// this function is what determines food types
function validateFoodTypes(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;
    var invalidSlot = false;

    console.log("Validate Food Types");

    // remove space from footlong
    if (intentRequest.currentIntent.slots.FoodType) {
	if (intentRequest.currentIntent.slots.FoodType.toLowerCase() === "foot long") {
	    console.log("Fixed minor spelling issue with Footlong Food Type");
	    intentRequest.currentIntent.slots.FoodType === "Footlong";
	    slots.FoodType = "Footlong";
	}
    }

    // scrub common mispellings of food types
    if (intentRequest.currentIntent.slots.FoodType) {
	if (intentRequest.currentIntent.slots.FoodType.toLowerCase() === "entrees") {
	    console.log("removing extra s from entrees");
	    intentRequest.currentIntent.slots.FoodType === "Entree";
	    slots.FoodType = "Entree";
	} else if (intentRequest.currentIntent.slots.FoodType.toLowerCase() === "secret") {
	    console.log("fixing secret menu routing");
	    intentRequest.currentIntent.slots.FoodType === "Secret Menu";
	    slots.FoodType = "Secret Menu";
	}
    }

    // if a restaurant name has been provided, then validate it. If not, its too early and return.
    if (intentRequest.currentIntent.slots.Restaurant) {
	console.log("Restaurant provided so validate.");

	const validationResult = validateRestaurant(intentRequest);

        // restaurant name has been provided. if failed validation, return with error message.
        if (!validationResult.isValid) {
            console.log("Invalid restaurant name. Pass back failed validation");
            slots[`${validationResult.violatedSlot}`] = null;
            invalidSlot = true;
	    var buttonData = [];
		buttonData.push({ "text":"List Restaurants", "value":"List Restaurants" });
            callback(buttonSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, validationResult.violatedSlot, validationResult.message, buttonData));
        } else {
            // save session attributes for later reference
            sessionAttributes.restaurantName = intentRequest.currentIntent.slots.Restaurant;
	    // get available food types for the restaurant
            const foodTypes = getFoodTypes(intentRequest.currentIntent.slots.Restaurant).foodOptions;
	    if (foodTypes.length === 3 && !intentRequest.currentIntent.slots.FoodType) {
		var botMessage = "Here are the food groups at " + 
		    intentRequest.currentIntent.slots.Restaurant + ".";
		var buttonData = [];
		console.log("adding buttons to response");
		buttonData.push({ "text":foodTypes[0], "value":foodTypes[0] });
                buttonData.push({ "text":foodTypes[1], "value":foodTypes[1] });
                buttonData.push({ "text":foodTypes[2], "value":foodTypes[2] });
		const foodTypePrompt = buildValidationResult(false, 'FoodType', botMessage);
		callback(buttonSlot(sessionAttributes, intentRequest.currentIntent.name,
		    slots, foodTypePrompt.violatedSlot, botMessage, buttonData));
	    } else if (foodTypes.length > 0 && !intentRequest.currentIntent.slots.FoodType) {
		var botMessage = "Okay, at " + intentRequest.currentIntent.slots.Restaurant + ". " +
		   "Pick one of the following food groups: ";
		// this array has all of the food types at the given restaurant
		for (var i = 0; i < foodTypes.length; i++) {
		    botMessage = botMessage + foodTypes[i] + ", ";
		}
		// send back the message
		const optionValidationResult = buildValidationResult(false, 'FoodType', botMessage);
            	callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                    slots, optionValidationResult.violatedSlot, optionValidationResult.message));
	    } else if (foodTypes.length > 0) {
		// food type entered by user - validate
		var foodTypeMatch = false;
		for (var j = 0; j < foodTypes.length; j++) {
		    if (intentRequest.currentIntent.slots.FoodType.toLowerCase() === foodTypes[j].toLowerCase()) {
			foodTypeMatch = true;
		    }
		}
		if (!foodTypeMatch) {
		    // throw exception message and let the user try again
		    console.log("No food types at " + intentRequest.currentIntent.slots.Restaurant);
		    var validFoodTypes = getFoodTypes(intentRequest.currentIntent.slots.Restaurant).foodOptions;
		    var botMessage = "Sorry, " + intentRequest.currentIntent.slots.FoodType + " is " +
		        "not a valid food category at " + intentRequest.currentIntent.slots.Restaurant + 
			". Please say ";
		    // provide valid alternatives
                    for (var m = 0; m < foodTypes.length; m++) {
                    	botMessage = botMessage + foodTypes[m] + ", ";
                    }
                    const optionValidationResult = buildValidationResult(false, 'FoodType', botMessage);
		    invalidSlot = true;
                    callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                        slots, optionValidationResult.violatedSlot, optionValidationResult.message));
		} else {
		    console.log("valid food type entered");
		}
	    }
        }
    } else if (intentRequest.sessionAttributes) {
	if (intentRequest.sessionAttributes.restaurantName) {
            intentRequest.currentIntent.slots.Restaurant = intentRequest.sessionAttributes.restaurantName;
	}
    }

    // all slots provided have been validated return positive response
    if (!invalidSlot) {
        console.log("all validation passed.");
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
    }
}

// this function is what validates what information has been provided

function validateUserEntry(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;
    var invalidSlot = false;
    var buttonData = [];

    console.log("validating user entry");

    var restaurantName = intentRequest.currentIntent.slots.Restaurant;
    const foodName       = intentRequest.currentIntent.slots.Food;
    const drinkName      = intentRequest.currentIntent.slots.Drink;
    const foodAdjustment = intentRequest.currentIntent.slots.FoodAdjustment;

    const validationResult = validateRestaurant(intentRequest);

    // if a restaurant name has been provided, then validate it. If not, its too early and return.
    if (restaurantName) {
        // restaurant name has been provided. if failed validation, return with error message.
        if (!validationResult.isValid) {
            console.log("Invalid restaurant name. Pass back failed validation");
            slots[`${validationResult.violatedSlot}`] = null;
	    invalidSlot = true;
            var buttonData = [];
                buttonData.push({ "text":"List Restaurants", "value":"List Restaurants" });
            callback(buttonSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, validationResult.violatedSlot, validationResult.message.content, buttonData));
	} else {
            // save session attributes for later reference
            sessionAttributes.restaurantName = restaurantName;
	}
    } else if (intentRequest.sessionAttributes) {
	console.log("potentially default restaurant name from session data");
	if (intentRequest.sessionAttributes.restaurantName && intentRequest.currentIntent.name === 'GetCalories' ||
	    intentRequest.sessionAttributes.restaurantName === "Taco Bell") {
	    restaurantName = intentRequest.sessionAttributes.restaurantName;
	    intentRequest.currentIntent.slots.Restaurant = intentRequest.sessionAttributes.restaurantName;
	}
    }

    if (foodName && !invalidSlot && foodName !== "None") {
        // food name exists, so validate it
        console.log("Validate Food Name: " + foodName);                
        const foodValidationResult = validateFood(intentRequest);

	console.log("food validation result: " + JSON.stringify(foodValidationResult));

        // check if food was valid
        if (!foodValidationResult.isValid) {
	    // food name provided not valid
            console.log("Invalid food name " + foodName + ". Pass back failed validation");
            slots[`${foodValidationResult.violatedSlot}`] = null;
	    invalidSlot = true;
                        
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, foodValidationResult.violatedSlot, foodValidationResult.message));
        } else if (!extraName) {
	    // no extra name provided yet, so check if entree has potential adjustments
	    console.log("Valid food, but no extra yet - check for food adjustments" + foodAdjustment);
	    if (!foodAdjustment) {
		// this will be moved to a separate function - just testing 
		const foodButtons = getFoodAdjustments(foodName, intentRequest.currentIntent.slots.Restaurant).buttonData;
		//console.log("possible buttons:" + JSON.stringify(foodButtons));
		if (foodButtons.length > 0) {
		    invalidSlot = true;
		    var adjustMessage = "Any changes to the " + foodName + "?";
		    const adjustmentPrompt = buildValidationResult(false, 'FoodAdjustment', adjustMessage);
		    callback(buttonSlot(sessionAttributes, intentRequest.currentIntent.name, 
		    	slots, adjustmentPrompt.violatedSlot, adjustMessage, foodButtons));
		}
	    }
	} else if (foodAdjustment) {
	    // food adjustment being requested
	    console.log("Validate food adjustment");
	    const validFoodAdjustment = validateFoodAdjustments(intentRequest);
	    console.log(JSON.stringify(validFoodAdjustment));
	}
    } 

    // check if extra name was provided then validate
    var extraName = intentRequest.currentIntent.slots.Extra;
    if (extraName && extraName !== "" && !invalidSlot && intentRequest.currentIntent.slots.Restaurant) {
	console.log("Check Extra Name: " + intentRequest.currentIntent.slots.Extra);
	var extraValidationResult = validateExtra(intentRequest.currentIntent.slots);
	if (!extraValidationResult.isValid) {
	    // extra name provided failed validation
	    invalidSlot = true;
	    console.log("Invalid extra name " + intentRequest.currentIntent.slots.Extra);
	    slots[`${extraValidationResult.violatedSlot}`] = null;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
            	slots, extraValidationResult.violatedSlot, extraValidationResult.message));
	} else if (extraValidationResult.ketchup) {
	    if (!intentRequest.currentIntent.slots.Ketchup) {
		console.log("Prompt user if they want ketchup");
		var botMessage = "Do you want ketchup with your " + intentRequest.currentIntent.slots.Extra + "?";
		const ketchupPrompt = buildValidationResult(false, 'Ketchup', botMessage);
		callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
		    slots, ketchupPrompt.violatedSlot, ketchupPrompt.message));
	    } else {
		console.log("Validate Ketchup Response: " + intentRequest.currentIntent.slots.Ketchup);
	    }
	} else if (extraValidationResult.dressing) {
	    if (!intentRequest.currentIntent.slots.Dressing) {
		console.log("Ask the user what type of salad dressing they want with their salad.");
		var saladMessage = "What type of salad dressing would you like?";
		const saladPrompt = buildValidationResult(false, 'Dressing', saladMessage);
		callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
		    slots, saladPrompt.violatedSlot, saladPrompt.message));
	    } else {
		console.log("Validate Dressing Response: " + intentRequest.currentIntent.slots.Dressing);
	    }
	}
	if (!foodName && !invalidSlot && intentRequest.currentIntent.name === 'GetCalories') {
	    console.log("Extra Provided, but no main entree. Default food name to none.");
	    intentRequest.currentIntent.slots.Food = "None";
	}
    } else {
	// default message prompting for side item - this is a separate function
	if (intentRequest.currentIntent.slots.Restaurant && !invalidSlot) {
	    if (intentRequest.currentIntent.name === 'GetCalories') {
		invalidSlot = true;
		buildExtraMessage(intentRequest, callback);
	    }
	}
    }
	
    // validate drink name if provided
    if (drinkName && !invalidSlot) {
	const drinkValidationResult = validateDrink(intentRequest.currentIntent.slots);
        if (!drinkValidationResult.isValid) {
            console.log("Invalid drink name " + drinkName + ". Pass back failed validation.");
            slots[`${drinkValidationResult.violatedSlot}`] = null;
	    invalidSlot = true;

            console.log("Validation Result: " + JSON.stringify(drinkValidationResult));
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
            	slots, drinkValidationResult.violatedSlot, drinkValidationResult.message));
        }
    } 

    // validate nuggets if provided
    var nuggets = intentRequest.currentIntent.slots.Quantity;
    if (nuggets && !invalidSlot) {
    	// check for a context switch - if session has restaurant, but not in the query
	if (sessionAttributes.restaurantName && !restaurantName) {
            console.log("remembered restaurant from session was " + restaurantName);
            restaurantName = sessionAttributes.restaurantName;
            intentRequest.currentIntent.slots.Restaurant = sessionAttributes.restaurantName;
	}
	if (intentRequest.currentIntent.slots.Restaurant) {
	    const nuggetsValidationResult = validateNuggets(nuggets, intentRequest.currentIntent.slots.Restaurant);
	    if (!nuggetsValidationResult.isValid) {
                console.log("Invalid nuggets quantity " + nuggets + ". Pass back failed validation");
                slots[`${nuggetsValidationResult.violatedSlot}`] = null;
                invalidSlot = true;

                callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                    slots, nuggetsValidationResult.violatedSlot, nuggetsValidationResult.message));
	    }
	}
	// check if a sauce has been added
	if (intentRequest.currentIntent.slots.Sauce) {
	    console.log("Received sauce:" + intentRequest.currentIntent.slots.Sauce);
	}
    }

    var nuggetSauce = intentRequest.currentIntent.slots.Sauce;
    if (nuggetSauce && !invalidSlot && intentRequest.currentIntent.slots.Restaurant) {
	console.log("Nugget sauce response provided.");
	const sauceValidationResult = validateSauce(intentRequest);
	if (!sauceValidationResult.isValid) {
            slots[`${sauceValidationResult.violatedSlot}`] = null;
            invalidSlot = true;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, sauceValidationResult.violatedSlot, sauceValidationResult.message));
	}
    }	

    var saladDressing = intentRequest.currentIntent.slots.Dressing;
    if (saladDressing && !invalidSlot) {
	console.log("Salad dressing response provided.");
	const dressingValidationResult = validateDressing(intentRequest);
	if (!dressingValidationResult.isValid) {
            slots[`${dressingValidationResult.violatedSlot}`] = null;
            invalidSlot = true;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, dressingValidationResult.violatedSlot, dressingValidationResult.message));
	}
    }

    // validate Mexican Food Types
    var mexicanFoodType = intentRequest.currentIntent.slots.MexicanFoodType;
    if (mexicanFoodType && !invalidSlot) {
	const mexicanFoodValidationResult = validateMexicanFood(intentRequest);
	if (!mexicanFoodValidationResult.isValid) {
	    console.log("Invalid combination of mexican food entries");
            slots[`${mexicanFoodValidationResult.violatedSlot}`] = null;
            invalidSlot = true;

            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, mexicanFoodValidationResult.violatedSlot, mexicanFoodValidationResult.message));

	} else {	    
	    console.log("Passed validation for Mexican food combinations.");
            if (!foodAdjustment) {
                // this will be moved to a separate function - just testing
                const foodButtons = getFoodAdjustments(mexicanFoodType, intentRequest.currentIntent.slots.Restaurant).buttonData;
                console.log("possible buttons:" + JSON.stringify(foodButtons));
                if (foodButtons.length > 0) {
                    invalidSlot = true;
                    var adjustMessage = "Any changes to the " + mexicanFoodType + "?";
                    const adjustmentPrompt = buildValidationResult(false, 'FoodAdjustment', adjustMessage);
                    callback(buttonSlot(sessionAttributes, intentRequest.currentIntent.name,
                        slots, adjustmentPrompt.violatedSlot, adjustMessage, foodButtons));
                }
            }
	}
    }

    // all slots provided have been validated return positive response
    if (!invalidSlot) {
	console.log("all validation passed.");
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
    }
    
}

// this function attempts to find a match for any adjustments that can be made to a food item
function getFoodAdjustments(foodName, restaurantName) {
    console.log("Attempting to find adjustments for " + foodName + " at " + restaurantName + ".");
    var buttonData = [];

    for (var i = 0; i < adjustments.length; i++) {
        if (restaurantName.toLowerCase() === adjustments[i].restaurant.toLowerCase()) {
            for (var j = 0; j < adjustments[i].menuAdjustments.length; j++) {
                if (foodName.toLowerCase() === adjustments[i].menuAdjustments[j].foodName.toLowerCase()) {
		    console.log(JSON.stringify(adjustments[i].menuAdjustments[j].adjustments));
                    for (var k = 0; k < adjustments[i].menuAdjustments[j].adjustments.length; k++) {
			if (adjustments[i].menuAdjustments[j].adjustments[k].highlight) {
			    var foodOption = adjustments[i].menuAdjustments[j].adjustments[k].change;
			    buttonData.push({ "text":foodOption, "value":foodOption });
			}
                    }
                }
            }
	}
    }

    return { 
	buttonData 
    };
}

// this function builds an intelligent response back prompting the user for a side item
function buildExtraMessage(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    console.log("Building side item prompt for " + intentRequest.currentIntent.slots.Restaurant);
               
    // customize the message based on the restaurant name
     
    var botMessage = "Any side items with that - for example, ";
           
    // vary message based on restaurant name
    if (intentRequest.currentIntent.slots.Restaurant === "Panera") {
	botMessage = botMessage + "Chips, Baguette, or a Cup of Soup";
    } else if (intentRequest.currentIntent.slots.Restaurant === "Subway") {
	botMessage = botMessage + "Potato Chips or Cheetos";
    } else if (intentRequest.currentIntent.slots.Restaurant === "Chick-fil-A") {
	botMessage = botMessage + "Waffle Fries";
    } else if (intentRequest.currentIntent.slots.Restaurant === "Sonic") {
	botMessage = botMessage + "Fries, Chili Cheese Fries, or Tots";
    } else {
	botMessage = botMessage + "Fries";
    }
    botMessage = botMessage + "?";
                
    const defaultExtra = buildValidationResult(false, 'Extra', botMessage);
               
    callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
	intentRequest.currentIntent.slots, defaultExtra.violatedSlot, defaultExtra.message));
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
    if (intentName === 'FoodTypeOptions') {
	console.log("Check Food Type Options");
	validateFoodTypes(intentRequest, callback);
    } else if (intentRequest.invocationSource === 'DialogCodeHook') {
        console.log("Validation in progress.");
        validateUserEntry(intentRequest, callback);
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
