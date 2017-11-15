
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
		slots.Food = foodItems[j].foodName;
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
        console.log("failed food validation");
	var vagueFoodEval = vagueFood(slots.Food, slots.Restaurant).vagueFoodResponse;
	console.log(JSON.stringify(vagueFoodEval));
	// this is for the *too value* error condition
	if (vagueFoodEval.assessment) {
	    return buildValidationResult(false, 'Food', vagueFoodEval.msg);
	// this is for the *quantity required* error condition
	} else if (slots.Food.toLowerCase() === "chicken nuggets" || 
                   slots.Food.toLowerCase() === "chicken tenders" ||
                   slots.Food.toLowerCase() === "mcnuggets" ||
		   slots.Food.toLowerCase() === "nuggets") {
	    return buildValidationResult(false, 'Food', 'Can you be more specific? For example say six piece ' + slots.Food + ' so I can be precise.');
	// this is trying to catch where the user has replied with more than one food item
	} else if (slots.Food.length > 25) {
	    return buildValidationResult(false, 'Food', 'Can you just start by saying just the first item?');
	} else {
	    // check to see if the user is entering another restaurant name vs. a food name - this is a common usability issue
	    var switchRestaurant = false;
            var updatedName = scrubRestaurantName(slots.Food).scrubData.restaurantName;
	    // update food name with the correct restaurant spelling if applicable
            if (updatedName) {
		console.log("Scrubbed name to: " + updatedName);
                slots.Food = updatedName;
            } 
            for (var i = 0; i < restaurants.length; i++) {
                if (slots.Food.toLowerCase() === restaurants[i].toLowerCase()) {
                    console.log("found a match for " + restaurants[i]);
                    switchRestaurant = true;
                }
            }
	    if (switchRestaurant) {
		slots.Restaurant = slots.Food;
		slots.Food = "";
		return buildValidationResult(false, 'Food', 'Switching to restaurant ' + slots.Restaurant + '. What food are you looking for?');
	    } else {
                // this is the generic error message where a match can't be found
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
    } else {
        console.log("no food items provided yet.");
        return { isValid: true };
    }
}

// this evaluates if the request was too vague, and formulates a response for the user to be more specific

function vagueFood(foodName, restaurantName) {
    var vagueFoodResponse = {};

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
        foodName.toLowerCase() === "soup" ||
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
	var foodItems = getFoodItems(foodName, restaurantName).foodItems;

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

    console.log("validated extra item " + slots.Extra);

    // sort through the food choices and pull out those relating to the restaraunt that has already been validated
    for (var i = 0; i < foodChoices.length; i++) {
        //console.log("checking: " + JSON.stringify(foodChoices[i]));
        if (slots.Restaurant.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            foodItems = foodChoices[i].foodItems;
            console.log("match restaurant - food items: " + JSON.stringify(foodItems));
        }
    }

    // take the array of food items from the matching restaurant, and attempt to match the extra item
    for (var j = 0; j < foodItems.length; j++) {
        //console.log("food item: " + JSON.stringify(foodItems[j]));
        if (slots.Extra.toLowerCase() == foodItems[j].foodName.toLowerCase()) {
            console.log("found a match for " + foodItems[j].foodName + " calories " + foodItems[j].calories);
            validExtra = true;
            extraCalories = foodItems[j].calories;
            slots.Extra = foodItems[j].foodName;
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
        return { isValid: true, calories: extraCalories };
    } else if (slots.Extra.toLowerCase() === "nothing" ||
	       slots.Extra.toLowerCase() === "none" ||
	       slots.Extra.toLowerCase() === "no" ) {
	console.log("no extra provided");
	return { isValid: true, calories: 0 };
    } else if (slots.Extra.toLowerCase() === "yes" ) {
	console.log("extra question answered with a yes - clarify");
	return buildValidationResult(false, 'Extra', "What side item would you like to add?");
    } else {
	console.log("failed extra validation");
	return buildValidationResult(false, 'Extra', `Sorry, I dont have information for ` + slots.Extra + '. Please try again.');
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
	    nuggets == 10 ||
	    nuggets == 6 ||
	    nuggets == 4) {
            return { isValid: true };
	    console.log("valid nuggets quantity of " + nuggets + ".");
        } else {
            console.log("Invalid nuggets quantity " + nuggets + ". Pass back failed validation");
	    return buildValidationResult(false, 'Quantity', 'Sorry ' + nuggets + ' is not a valid number of nuggets at ' + restaurantName + '.');
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
    const restaurant = intentRequest.currentIntent.slots.Restaurant;
    var foodType = intentRequest.currentIntent.slots.MexicanFoodType;

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
		// first check if a protein type was provided. If not, the request is too generic (i.e. taco, burrito)
		const protein = intentRequest.currentIntent.slots.Protein;
                var botResponse = "";
		if (protein) {
		    // both a food item and protein were provided - so potentially a match can be found
		    const foodPrep = intentRequest.currentIntent.slots.Preparation;
		    var foodRequest = "";
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
		    var foundFoodMatch = false;
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
		    // no protein was provided, so provide message requesting it to be provided
		    botResponse = "What type of a " + foodType + " are you eating?";
		    return buildValidationResult(false, 'Protein', botResponse);
		}
	    } else {
		return buildValidationResult(false, 'Restaurant', 'Sorry No types of ' + foodType + ' at ' + restaurant + '.');
	    }
	}
    } else {
	return buildValidationResult(false, 'Restaurant', 'Which restaurant are you at (i.e. Taco Bell, Chipotle)?');
    }
}

// this function is what determines food types
function validateFoodTypes(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;
    var invalidSlot = false;

    console.log("Validate Food Types");

    // if a restaurant name has been provided, then validate it. If not, its too early and return.
    if (intentRequest.currentIntent.slots.Restaurant) {
	console.log("Restaurant provided so validate.");

	const validationResult = validateRestaurant(intentRequest.currentIntent.slots);

        // restaurant name has been provided. if failed validation, return with error message.
        if (!validationResult.isValid) {
            console.log("Invalid restaurant name. Pass back failed validation");
            slots[`${validationResult.violatedSlot}`] = null;
            invalidSlot = true;

            console.log("Validation Result: " + JSON.stringify(validationResult));
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, validationResult.violatedSlot, validationResult.message));
        } else {
            // save session attributes for later reference
            sessionAttributes.restaurantName = intentRequest.currentIntent.slots.Restaurant;
	    // get available food types for the restaurant
            const foodTypes = getFoodTypes(intentRequest.currentIntent.slots.Restaurant).foodOptions;
	    if (foodTypes.length > 0 && !intentRequest.currentIntent.slots.FoodType) {
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
	    } else {
		console.log("No food types at " + intentRequest.currentIntent.slots.Restaurant);
	    }
        }
    } else if (intentRequest.sessionAttributes.restaurantName) {
        intentRequest.currentIntent.slots.Restaurant = intentRequest.sessionAttributes.restaurantName;
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

    console.log("validating user entry");

    var restaurantName = intentRequest.currentIntent.slots.Restaurant;
    const foodName       = intentRequest.currentIntent.slots.Food;
    const drinkName      = intentRequest.currentIntent.slots.Drink;

    const validationResult = validateRestaurant(intentRequest.currentIntent.slots);

    // if a restaurant name has been provided, then validate it. If not, its too early and return.
    if (restaurantName) {
        // restaurant name has been provided. if failed validation, return with error message.
        if (!validationResult.isValid) {
            console.log("Invalid restaurant name. Pass back failed validation");
            slots[`${validationResult.violatedSlot}`] = null;
	    invalidSlot = true;
            
            console.log("Validation Result: " + JSON.stringify(validationResult));
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, validationResult.violatedSlot, validationResult.message));
	} else {
            // save session attributes for later reference
            sessionAttributes.restaurantName = restaurantName;
	}
    } else if (intentRequest.sessionAttributes.restaurantName) {
	restaurantName = intentRequest.sessionAttributes.restaurantName;
	intentRequest.currentIntent.slots.Restaurant = intentRequest.sessionAttributes.restaurantName;
    }

    if (foodName && !invalidSlot) {
        // food name exists, so validate it
        console.log("Validate Food Name: " + foodName);                
        const foodValidationResult = validateFood(intentRequest);

        // check if food was valid
        if (!foodValidationResult.isValid) {
	    // food name provided not valid
            console.log("Invalid food name " + foodName + ". Pass back failed validation");
            slots[`${foodValidationResult.violatedSlot}`] = null;
	    invalidSlot = true;
                        
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, foodValidationResult.violatedSlot, foodValidationResult.message));
        }
    }

    // check if extra name was provided then validate
    var extraName = intentRequest.currentIntent.slots.Extra;
    if (extraName && extraName !== "" && !invalidSlot && restaurantName) {
	console.log("Check Extra Name: " + intentRequest.currentIntent.slots.Extra);
	var extraValidationResult = validateExtra(intentRequest.currentIntent.slots);
	if (!extraValidationResult.isValid) {
	    // extra name provided failed validation
	    invalidSlot = true;
	    console.log("Invalid extra name " + intentRequest.currentIntent.slots.Extra);
	    slots[`${extraValidationResult.violatedSlot}`] = null;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
            	slots, extraValidationResult.violatedSlot, extraValidationResult.message));
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
	const nuggetsValidationResult = validateNuggets(nuggets, intentRequest.currentIntent.slots.Restaurant);
	if (!nuggetsValidationResult.isValid) {
            console.log("Invalid nuggets quantity " + nuggets + ". Pass back failed validation");
            slots[`${nuggetsValidationResult.violatedSlot}`] = null;
            invalidSlot = true;

            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, nuggetsValidationResult.violatedSlot, nuggetsValidationResult.message));
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
	}
    }

    // all slots provided have been validated return positive response
    if (!invalidSlot) {
	console.log("all validation passed.");
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
    }
    
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
    } else if (intentName === 'WhichRestaurants') {
        console.log("list of restaurants requested.");
        return getRestaurants(intentRequest, callback);
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
