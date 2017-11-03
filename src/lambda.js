
'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var restaurants = ["Chipotle", "Burger King", "Subway", "Panera", "Chick-fil-A", "McDonalds", "Wendys", "Taco Bell", "Arbys","Hardees"];

// these are the valid choices based on website scraping
var foodChoices = require("foods.json");
var drinks = require("drinks.json");

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
	    "Say, List of restaurants for details.";
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
    for (var i = 0; i < foodChoices.length; i++) {
        //console.log("checking: " + JSON.stringify(foodChoices[i]));
        if (restaurant.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            foodItems = foodChoices[i].foodItems;
            console.log("match restaurant - food items: " + JSON.stringify(foodItems));
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
                return buildValidationResult(false, 'Food', `Sorry, I dont have information for ` + slots.Food + ' at ' + slots.Restaurant + ' . Please try again.');
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
        console.log("attempting to find drink: " + slots.Drink);
        for (var j = 0; j < drinks.length; j++) {
            //console.log("drink item: " + JSON.stringify(drinks[j]));
            if (slots.Drink.toLowerCase() === drinks[j].drinkName.toLowerCase()) {
                console.log("found a match for " + drinks[j].drinkName + " calories " + drinks[j].calories);
                validDrink = true;
                drinkCalories = drinks[j].calories;
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

// this function is what builds the introduction

function getIntroduction(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    var counterResponse = 'Hello. I am a chatbot that can assist you in calculating ' +
        'calories for different fast food restaurants. To get started, please say ' +
        'something like How many calories, and I will do all the work!';

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));

}

// this function is what retrieves the restaurants that data is available for

function getRestaurants(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = 'Here are the fast food restaurants that I have ' +
        'information on. ';

    for (var i = 0; i < restaurants.length; i++) {
        counterResponse = counterResponse + restaurants[i] + ', ';
    }

	counterResponse = counterResponse + 'Say something like, eating at McDonalds, to begin.';

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
        
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

// this function is what builds the wrap-up of a conversation

function endConversation(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = 'Thanks for checking in. Have a nice day! ';

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
        
}

// this function is what builds the response to a request for help

function getHelp(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var counterResponse = 'This is the Fast Food Calorie Checker chatbot. ' +
        'I am a resource to reference how many calories are in different fast foods. ' +
        'To get started, just say How many calories, and I will ask a few additional ' +
        'questions and calculate the amount for you. For the latest list of fast food ' +
        'restaurants I know about, just say List of restaurants.';

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
        
}

function getMealDetails(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    console.log("Session Attributes: " + JSON.stringify(intentRequest.sessionAttributes));

    if (sessionAttributes.foodName) {
	var detailResponse = sessionAttributes.foodName + " is " + 
	    sessionAttributes.foodCalories + " calories. ";
        if (sessionAttributes.extraName) {
            detailResponse = detailResponse + sessionAttributes.extraName + " is " +
                sessionAttributes.extraCalories + " calories. ";
        }
	if (sessionAttributes.drinkName) {
	    detailResponse = detailResponse + sessionAttributes.drinkName + " is " +
		sessionAttributes.drinkCalories + " calories. ";
	}
	if (sessionAttributes.extraName || sessionAttributes.drinkName) {
	    detailResponse = detailResponse + "Total Calories are " + 
		sessionAttributes.totalCalories + ".";
	}

    } else {
	var detailResponse = "Sorry, first start by telling me more about the meal. " +
	    "For example, say something like Eating at Burger King.";
    }

    callback(close(sessionAttributes, 'Fulfilled',
	{ contentType: 'PlainText', content: detailResponse }));

}

function getFoodOptions(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var restaurant = intentRequest.currentIntent.slots.Restaurant;
    var foodType = intentRequest.currentIntent.slots.FoodType;

    var botResponse = '';

    // clean up different spellings of food types
    if (foodType.toLowerCase === "Burritos") {
	foodType = "Burrito"
    } else if (foodType.toLowerCase === "Salads") {
	foodType = "Salad"
    }

    if (restaurant) {
	// validate that the restaurant name is valid
	const validationResult = validateRestaurant(intentRequest.currentIntent.slots);
	var foodItems = [];
	if (validationResult.isValid) {
	    // find the restaurant food items for the restaurant provided
    	    for (var i = 0; i < foodChoices.length; i++) {
        	if (restaurant.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            	    foodItems = foodChoices[i].foodItems;
		    restaurant = foodChoices[i].restaurant;
        	} 
    	    }
	    // go through the food items, and list those matching the food type
	    var foodTypeMatch = false;
	    var foodNameExample = "";
		botResponse = "Here are the types of " + foodType + " at " + restaurant + ". ";
	    for (var j = 0; j < foodItems.length; j++) {
		// first make sure a food type exists for the item
		if (foodItems[j].foodType) {
		    if (foodItems[j].foodType.toLowerCase() === foodType.toLowerCase()) {
		    	botResponse = botResponse + foodItems[j].foodName + ", ";
			foodNameExample = foodItems[j].foodName;
		    	foodTypeMatch = true;
		    }
		}
	    }
	    if (foodTypeMatch) {
		botResponse = botResponse + " Want calorie details? Say something like " +
		    "How many calories in a " + foodNameExample + " at " + restaurant + ".";
	    } else {
		botResponse = "Sorry, I don't have information for types of " + foodType + " at " +
		    restaurant + ".";
	    }
	} else {
	    botResponse = "Sorry, I dont have information for " + restaurant + ". " +
		"Say, List of restaurants for details.";
	}
    } else {
	botResponse = "No restaurant provided";
    }

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: botResponse }));

}

// this function is what builds the main response around checking for calories

function calculateCalories(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    const restaurantName = intentRequest.currentIntent.slots.Restaurant;
    const foodName       = intentRequest.currentIntent.slots.Food;

    console.log("processing user response");

    // check to see if in validation mode or final confirmation
    if (intentRequest.invocationSource === 'DialogCodeHook') {
        console.log("Validation in progress.");

        validateUserEntry(intentRequest, callback);
        
    } else {
        // this is the processing for the final confirmation. calculate calories and format message
        console.log("confirm final response - now calculating calories");
        
        const foodValidationResult = validateFood(intentRequest);
        const drinkValidationResult = validateDrink(intentRequest.currentIntent.slots);

        var totalCalories = foodValidationResult.calories + drinkValidationResult.calories;

        // this attribute is what the chatbot will respond back with
	
        var counterResponse = "At " + restaurantName + " eating a " + foodName;

	// process details related to the extra food item
    	var extraName = intentRequest.currentIntent.slots.Extra;

	if (extraName.toLowerCase() === "nothing" ||
	    extraName.toLowerCase() === "none" ||
	    extraName.toLowerCase() === "no" ) {
	    console.log("Skipping extra as nothing selected");
	} else if (extraName) {
	    const extraValidationResult = validateExtra(intentRequest.currentIntent.slots);
	    if (extraValidationResult.isValid) {
		totalCalories += extraValidationResult.calories;
	        counterResponse = counterResponse + " and a " + extraName;
                sessionAttributes.extraName = extraName;
                sessionAttributes.extraCalories = extraValidationResult.calories;
	    }
	}

	// process details related to the drink
    	var drinkName = intentRequest.currentIntent.slots.Drink;

            sessionAttributes.drinkName = intentRequest.currentIntent.slots.Drink; 
            sessionAttributes.drinkCalories = drinkValidationResult.calories;

	// alter response based on if a drink was provided
	if (drinkName.toLowerCase() === "nothing" ||
	    drinkName.toLowerCase() === "none" ||
	    drinkName.toLowerCase() === "no" ) {
	    counterResponse = counterResponse + ". ";
	} else {
	    // find the drink size to add specificity to the response
	    const drinkSize = getDrinkSize(drinkName).drinkSize;
	    if (drinkSize > 0) {
		counterResponse = counterResponse + " and drinking a " + drinkSize + " oz. " + drinkName + ". ";
	    } else {
		counterResponse = counterResponse + " and drinking a " + drinkName + ". ";
	    }
	}
	    counterResponse = counterResponse + "That is " + totalCalories + " calories. ";

	if (totalCalories > foodValidationResult.calories) {
	    counterResponse = counterResponse + "You can also say 'more details' for an itemized breakout.";
	}

	    // save session attributes for later reference
            sessionAttributes.restaurantName = restaurantName;
            sessionAttributes.foodName       = foodName;
            sessionAttributes.foodCalories   = foodValidationResult.calories;
            sessionAttributes.totalCalories  = totalCalories;

	console.log("saving session data: " + JSON.stringify(sessionAttributes));

        callback(close(sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: counterResponse }));
    }
}

// this function is what validates what information has been provided

function validateUserEntry(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    const restaurantName = intentRequest.currentIntent.slots.Restaurant;
    const foodName       = intentRequest.currentIntent.slots.Food;
    const drinkName      = intentRequest.currentIntent.slots.Drink;

    const validationResult = validateRestaurant(intentRequest.currentIntent.slots);
    console.log("Validation Result: " + JSON.stringify(validationResult));

    // if a restaurant name has been provided, then validate it. If not, its too early and return.
    if (restaurantName) {
        // restaurant name has been provided. if failed validation, return with error message.
        if (!validationResult.isValid) {
            console.log("Invalid restaurant name. Pass back failed validation");
            slots[`${validationResult.violatedSlot}`] = null;
            
            console.log("Validation Result: " + JSON.stringify(validationResult));
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                slots, validationResult.violatedSlot, validationResult.message));
        } else {
            // Restaurant name is valid, now check if a food name was provided.
            if (foodName) {
                // food name exists, so validate it
                console.log("Validate Food Name: " + foodName);                
                const foodValidationResult = validateFood(intentRequest);
                console.log("Validation Result: " + JSON.stringify(foodValidationResult));

                // check if food was valid
                if (!foodValidationResult.isValid) {
		    // food name provided not valid
                    console.log("Invalid food name " + foodName + ". Pass back failed validation");
                    slots[`${foodValidationResult.violatedSlot}`] = null;
                        
                    console.log("Validation Result: " + JSON.stringify(foodValidationResult));
                    callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                        slots, foodValidationResult.violatedSlot, foodValidationResult.message));
                } else {
		    // food name was valid - now check extra name
                    console.log("Valid food name " + foodName + " was provided.");
    		    var extraName = intentRequest.currentIntent.slots.Extra;
		    if (extraName && extraName !== "") {
			console.log("Check Extra Name: " + intentRequest.currentIntent.slots.Extra);
			var extraValidationResult = validateExtra(intentRequest.currentIntent.slots);
			if (!extraValidationResult.isValid) {
			    // extra name provided failed validation
			    console.log("Invalid extra name " + intentRequest.currentIntent.slots.Extra);
			    slots[`${extraValidationResult.violatedSlot}`] = null;
                    	    callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                        	slots, extraValidationResult.violatedSlot, extraValidationResult.message));
			} else {
			    // extra name passed validation - now check the drink
                	    if (drinkName) {
                            	const drinkValidationResult = validateDrink(intentRequest.currentIntent.slots);
                            	if (!drinkValidationResult.isValid) {
                                    console.log("Invalid drink name " + drinkName + ". Pass back failed validation.");
                                    slots[`${drinkValidationResult.violatedSlot}`] = null;
                                
                                    console.log("Validation Result: " + JSON.stringify(drinkValidationResult));
                                    callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                                    	slots, drinkValidationResult.violatedSlot, drinkValidationResult.message));
                                } else {
                                    console.log("Validated drink choice.");
                                    callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
                            	}
                    	    } else {
                                console.log("No drink name provided yet.");
                                callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
                    	    }
			}
		    } else {
			// No extra response provided yet
			console.log("No extra name provided yet.");
			callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
		    }
                }
            } else {
                console.log("No food name entered yet, but restaurant name is valid.");
                callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
            }
        }
    } else {
        // nothing has been entered - so pass through a success message
        console.log("Nothing entered yet, so continue without alerts.");
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
    if (intentName === 'GetCalories') {
        console.log("now getting ready to count calories.");
        return calculateCalories(intentRequest, callback);
    } else if (intentName === 'Introduction') {
        console.log("friendly introduction.");
        return getIntroduction(intentRequest, callback);
    } else if (intentName === 'WhichRestaurants') {
        console.log("list of restaurants requested.");
        return getRestaurants(intentRequest, callback);
    } else if (intentName === 'EndConversation') {
        console.log("wrap-up conversation requested.");
        return endConversation(intentRequest, callback);
    } else if (intentName === 'Thanks') {
        console.log("received thank you from user.");
        return endConversation(intentRequest, callback);
    } else if (intentName === 'HelpRequest') {
        console.log("user requested help.");
        return getHelp(intentRequest, callback);
    } else if (intentName === 'FoodTypeOptions') {
	console.log("user requested food types");
	return getFoodOptions(intentRequest, callback);
    } else if (intentName === 'MoreDetails') {
	console.log("user requested details on meal");
	return getMealDetails(intentRequest, callback);
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

