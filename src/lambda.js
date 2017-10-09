'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var restaurants = ["Chipotle", "Burger King", "Subway", "Panera", "Chick-fil-A", "McDonalds", "Wendys", "Taco Bell"];

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

    // correct common mistakes for restaurant names
    if (slots.Restaurant) {
        if (slots.Restaurant.toLowerCase() === "mcdonald's") {
            console.log("corrected restaurant name typo");
            slots.Restaurant = "McDonalds";
        } else if (slots.Restaurant.toLowerCase() === "wendy's") {
            console.log("corrected restaurant name typo");
            slots.Restaurant = "Wendys";
        } else if (slots.Restaurant.toLowerCase() === "chik-fil-a") {
            console.log("corrected restaurant name typo");
            slots.Restaurant = "Chick-fil-A";
        }
    }

    // make sure a Restaurant has been provided before attempting to validate
    if (slots.Restaurant) {
        console.log("validating restaurant:" + slots.Restaurant);
        for (var i = 0; i < restaurants.length; i++) {
            if (slots.Restaurant.toLowerCase() === restaurants[i].toLowerCase()) {
                console.log("found a match for " + restaurants[i]);
                validRestaurant = true;
            }
            console.log("Checking: " + restaurants[i]);
        }
    }
    
    // create response. if restaurant didn't match, respond as such, else pass back as supported.
    if (validRestaurant) {
        console.log("passed restaurant validation");
        return { isValid: true };
    } else if (slots.Restaurant) {
        console.log("failed restaurant validation");
        return buildValidationResult(false, 'Restaurant', `Sorry, I dont have information for ` + slots.Restaurant + '.');
    } else {
        console.log("no restaurant provided yet.");
        return { isValid: true };
    }
}

// this function will validate that the restaurant provided by the user matches what data we have
function validateFood(slots) {
    var validFood = false;
    var restaurant = slots.Restaurant;
    var foodItems = [];
    var foodCalories = 0;

    console.log("validating food entered " + slots.Food);

    // sort through the food choices and pull out those relating to the restaraunt that has already been validated
    for (var i = 0; i < foodChoices.length; i++) {
        console.log("checking: " + JSON.stringify(foodChoices[i]));
        if (slots.Restaurant.toLowerCase() === foodChoices[i].restaurant.toLowerCase()) {
            foodItems = foodChoices[i].foodItems;
            console.log("match restaurant - food items: " + JSON.stringify(foodItems));
        }
    }

    // make sure a Restaurant has been provided before attempting to validate
    if (slots.Food) {
        console.log("validating food: " + slots.Food);
        for (var j = 0; j < foodItems.length; j++) {
            console.log("food item: " + JSON.stringify(foodItems[j]));
            if (slots.Food.toLowerCase() === foodItems[j].foodName.toLowerCase()) {
                console.log("found a match for " + foodItems[j].foodName + " calories " + foodItems[j].calories);
                validFood = true;
                foodCalories = foodItems[j].calories;
            }
        }
    }
    
    // create response. if food item didn't match, respond as such, else pass back as supported.
    if (validFood) {
        console.log("passed food validation");
        return { isValid: true, calories: foodCalories };
    } else if (slots.Food) {
        console.log("failed food validation");
        return buildValidationResult(false, 'Food', `Sorry, I dont have information for ` + slots.Food + '. Please try again.');
    } else {
        console.log("no food items provided yet.");
        return { isValid: true };
    }
}

// this function will validate that the drink provided is something that calorie detail is available for
function validateDrink(slots) {
    var validDrink = false;
    //var foodItems = [];
    var drinkCalories = 0;

    console.log("validating drink entered " + slots.Drink);

    // make sure a Drink has been provided, then attempt to validate
    if (slots.Drink) {
        console.log("attempting to find drink: " + slots.Drink);
        for (var j = 0; j < drinks.length; j++) {
            console.log("drink item: " + JSON.stringify(drinks[j]));
            if (slots.Drink.toLowerCase() === drinks[j].drinkName.toLowerCase()) {
                console.log("found a match for " + drinks[j].drinkName + " calories " + drinks[j].calories);
                validDrink = true;
                drinkCalories = drinks[j].calories;
            }
        }
    }
    
    // create response. if food item didn't match, respond as such, else pass back as supported.
    if (validDrink) {
        console.log("passed drink validation");
        return { isValid: true, calories: drinkCalories };
    } else if (slots.Drink) {
        console.log("failed drink validation");
        return buildValidationResult(false, 'Drink', `Sorry, I dont have information for ` + slots.Drink + '. Please try again.');
    } else {
        console.log("no drink items provided yet.");
        return { isValid: true };
    }
}

function validateHotel(slots) {
    const location = slots.Location;
    const checkInDate = slots.CheckInDate;
    const nights = slots.Nights;
    const roomType = slots.RoomType;

    if (location && !isValidCity(location)) {
        return buildValidationResult(false, 'Location', `We currently do not support ${location} as a valid destination.  Can you try a different city?`);
    }

    if (checkInDate) {
        if (!isValidDate(checkInDate)) {
            return buildValidationResult(false, 'CheckInDate', 'I did not understand your check in date.  When would you like to check in?');
        } if (parseLocalDate(checkInDate) < new Date()) {
            return buildValidationResult(false, 'CheckInDate', 'Reservations must be scheduled at least one day in advance.  Can you try a different date?');
        }
    }

    if (nights != null && (nights < 1 || nights > 30)) {
        return buildValidationResult(false, 'Nights', 'You can make a reservations for from one to thirty nights.  How many nights would you like to stay for?');
    }

    if (roomType && !isValidRoomType(roomType)) {
        return buildValidationResult(false, 'RoomType', 'I did not recognize that room type.  Would you like to stay in a queen, king, or deluxe room?');
    }

    return { isValid: true };
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

    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: counterResponse }));
        
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

// this function is what builds the main response around checking for calories

function calculateCalories(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    const restaurantName = intentRequest.currentIntent.slots.Restaurant;
    const foodName       = intentRequest.currentIntent.slots.Food;
    const drinkName      = intentRequest.currentIntent.slots.Drink;
    
    console.log("processing user response");

    // check to see if in validation mode or final confirmation
    if (intentRequest.invocationSource === 'DialogCodeHook') {
        console.log("Validation in progress.");

        validateUserEntry(intentRequest, callback);
        
    } else {
        // this is the processing for the final confirmation. calculate calories and format message
        console.log("confirm final response - now calculating calories");
        
        const foodValidationResult = validateFood(intentRequest.currentIntent.slots);
        console.log("Validation Result: " + JSON.stringify(foodValidationResult));

        const drinkValidationResult = validateDrink(intentRequest.currentIntent.slots);
        console.log("Validation Result: " + JSON.stringify(drinkValidationResult));

        var totalCalories = foodValidationResult.calories + drinkValidationResult.calories;

        // this attribute is what the chatbot will respond back with
        var counterResponse = 'At ' + restaurantName + ' eating a ' + foodName + 
            ' and drinking a ' + drinkName + '. That is ' + totalCalories + ' calories.';

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
                const foodValidationResult = validateFood(intentRequest.currentIntent.slots);
                console.log("Validation Result: " + JSON.stringify(foodValidationResult));

                // check if food was valid
                if (!foodValidationResult.isValid) {
                    console.log("Invalid food name " + foodName + ". Pass back failed validation");
                    slots[`${foodValidationResult.violatedSlot}`] = null;
                        
                    console.log("Validation Result: " + JSON.stringify(foodValidationResult));
                    callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
                        slots, foodValidationResult.violatedSlot, foodValidationResult.message));
                } else {
                    console.log("Valid food name " + foodName + " was provided.");
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

