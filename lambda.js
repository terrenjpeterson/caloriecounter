'use strict';

 /**
  * This is a bot that looks up different fast foods based on user requests and returns the caloric amount 
  */

// variables that contain lookup information including restaurant name and calories by food

var restaurants = ["Chipotle", "Burger King", "Subway", "Panera", "Chick-fil-A", "McDonalds", "Wendys", "Taco Bell"];

var foodChoices = [
    {
        "restaurant":"Chipotle",
        "foodItems":[
            {"foodName":"Chicken Burrito", "calories":845},
            {"foodName":"Steak Burrito", "calories":815},
            {"foodName":"Chicken Burrito Bowl", "calories":530},
            {"foodName":"Steak Burrito Bowl", "calories":500},
            {"foodName":"Carnitas Burrito Bowl", "calories":560}
            ]
    },
    {
        "restaurant":"Panera",
        "foodItems":[
            {"foodName":"BBQ Chicken Flatbread", "calories":380},
            {"foodName":"Chicken Flatbread", "calories":380},
            {"foodName":"Tomato Mozzarella Flatbread", "calories":350},
            {"foodName":"Italian", "calories":880},
            {"foodName":"Steak and White Cheddar Panini", "calories":940},
            {"foodName":"Steak Panini", "calories":940},
            {"foodName":"Chicken Panini", "calories":750},
            {"foodName":"Turkey Sandwich", "calories":560},
            {"foodName":"Chicken Salad Sandwich", "calories":700},
            {"foodName":"Veggie Sandwich", "calories":420}
            ]
    },
    {
        "restaurant":"Burger King",
        "foodItems":[
            {"foodName":"Whopper", "calories":630},
            {"foodName":"Whopper with Cheese", "calories":710},
            {"foodName":"Bacon and Cheese Whopper", "calories":750},
            {"foodName":"Double Whopper", "calories":850},
            {"foodName":"Double Whopper with Cheese", "calories":930},
            {"foodName":"Junior Whopper", "calories":310},
            {"foodName":"Whopper Junior", "calories":310},
            {"foodName":"Jr Whopper", "calories":310},
            {"foodName":"Whopper Jr", "calories":310},
            {"foodName":"Grilled Chicken Sandwich","calories":470},
            {"foodName":"Crispy Chicken Sandwich","calories":670},
            {"foodName":"Chicken Sandwich","calories":660},
            {"foodName":"Original Chicken Sandwich","calories":660},
            {"foodName":"Crispy Chicken Junior","calories":450},
            {"foodName":"Four Piece Chicken Nuggets","calories":170},
            {"foodName":"Six Piece Chicken Nuggets","calories":260},
            {"foodName":"Ten Piece Chicken Nuggets","calories":430},
            {"foodName":"Twenty Piece Chicken Nuggets","calories":860},
            {"foodName":"4 Piece Chicken Nuggets","calories":170},
            {"foodName":"6 Piece Chicken Nuggets","calories":260},
            {"foodName":"10 Piece Chicken Nuggets","calories":430},
            {"foodName":"20 Piece Chicken Nuggets","calories":860},
            {"foodName":"Big Fish Sandwich","calories":510},
            {"foodName":"Veggie Burger","calories":390},
            {"foodName":"BK Veggie Burger","calories":390},
            {"foodName":"Classic Grilled Dog","calories":310},
            {"foodName":"Grilled Hot Dog","calories":310},
            {"foodName":"Grilled Dog","calories":310},
            {"foodName":"Hot Dog","calories":310},
            {"foodName":"Chili Cheese Grilled Dog","calories":330},
            {"foodName":"Grilled Chili Cheese Hot Dog","calories":330},
            {"foodName":"Grilled Chili Cheese Dog","calories":330},
            {"foodName":"Chili Cheese Hot Dog","calories":330},
            ]
    },
    {
        "restaurant":"Subway",
        "foodItems":[
            {"foodName":"Black Forest Ham", "calories":290},
            {"foodName":"Carved Turkey", "calories":330},
            {"foodName":"Chicken and Bacon Ranch Melt", "calories":590},
            {"foodName":"Tuna", "calories":470},
            {"foodName":"Cold Cut Combo", "calories":340},
            {"foodName":"Italian BMT", "calories":390},
            {"foodName":"Italian Hero", "calories":550},
            {"foodName":"Meatball Marinara", "calories":460},
            {"foodName":"Oven Roasted Chicken", "calories":320},
            {"foodName":"Roast Beef", "calories":320},
            {"foodName":"Spicy Italian", "calories":470}
            ]
    },
    {
        "restaurant":"Chick-fil-A",
        "foodItems":[
            {"foodName":"Chicken Sandwich", "calories":440},
            {"foodName":"Chicken Deluxe Sandwich", "calories":500},
            {"foodName":"Chicken Deluxe", "calories":500},
            {"foodName":"Spicy Chicken Deluxe Sandwich", "calories":570},
            {"foodName":"Spicy Chicken Deluxe", "calories":570},
            {"foodName":"Chicken Salad Sandwich", "calories":500},
            {"foodName":"Spicy Chicken Sandwich", "calories":490},
            {"foodName":"Spicy Chicken", "calories":490},
            {"foodName":"Grilled Chicken Sandwich", "calories":320},
            {"foodName":"Grilled Chicken", "calories":320},
            {"foodName":"Four count Chicken Strips", "calories":470},
            {"foodName":"4 count Chicken Strips", "calories":470},
            {"foodName":"Chick-n-Strips 4 count", "calories":470},
            {"foodName":"Chick-n-Strips four count", "calories":470},
            {"foodName":"Three count Chicken Strips", "calories":360},
            {"foodName":"3 count Chicken Strips", "calories":360},
            {"foodName":"Chick-n-Strips 3 count", "calories":360},
            {"foodName":"Chick-n-Strips three count", "calories":360},
            {"foodName":"Grilled Chicken Club Sandwich", "calories":440},
            {"foodName":"Grilled Chicken Club", "calories":440},
            {"foodName":"Cobb Salad", "calories":500},
            {"foodName":"Spicy Southwest Salad", "calories":420},
            {"foodName":"12 count nuggets", "calories":400},
            {"foodName":"Twelve count nuggets", "calories":400},
            {"foodName":"12 count chicken nuggets", "calories":400},
            {"foodName":"Twelve count chicken nuggets", "calories":400},
            {"foodName":"Grilled Chicken Cool Wrap", "calories":340},
            {"foodName":"Grilled Chicken Market Salad", "calories":470},
            {"foodName":"Grilled Market Salad", "calories":470},
            {"foodName":"Market Salad", "calories":470},
            {"foodName":"Cobb Salad", "calories":510},
            {"foodName":"Spicy Southwest Salad", "calories":470},
            {"foodName":"Southwest Salad", "calories":450},
            {"foodName":"Waffle Potato Fries", "calories":360},
            {"foodName":"Waffle Fries", "calories":360}
        ]
    },
    {
        "restaurant":"McDonalds",
        "foodItems":[
            {"foodName":"Big Mac", "calories":540},
            {"foodName":"Quarter Pounder", "calories":540},
            {"foodName":"Quarter Pounder with Cheese", "calories":540},
            {"foodName":"Quarter Pounder Deluxe", "calories":600},
            {"foodName":"Grand Mac", "calories":860},
            {"foodName":"Hamburger", "calories":250},
            {"foodName":"Cheeseburger", "calories":300},
            {"foodName":"Double Quarter Pounder with Cheese", "calories":770},
            {"foodName":"Filet-o-Fish", "calories":390},
            {"foodName":"McChicken", "calories":350},
            {"foodName":"McChicken Sandwich", "calories":350},
            {"foodName":"Buttermilk Crispy Chicken Sandwich", "calories":570},
            {"foodName":"Four Piece Chicken Nuggets", "calories":180},
            {"foodName":"Six Piece Chicken Nuggets", "calories":270},
            {"foodName":"Ten Piece Chicken Nuggets", "calories":440},
            {"foodName":"Twenty Piece Chicken Nuggets", "calories":890},
            {"foodName":"4 Piece Chicken Nuggets", "calories":180},
            {"foodName":"6 Piece Chicken Nuggets", "calories":270},
            {"foodName":"10 Piece Chicken Nuggets", "calories":440},
            {"foodName":"20 Piece Chicken Nuggets", "calories":890},
            {"foodName":"Four Piece Nuggets", "calories":180},
            {"foodName":"Six Piece Nuggets", "calories":270},
            {"foodName":"Ten Piece Nuggets", "calories":440},
            {"foodName":"Twenty Piece Nuggets", "calories":890},
            {"foodName":"4 Piece Nuggets", "calories":180},
            {"foodName":"6 Piece Nuggets", "calories":270},
            {"foodName":"10 Piece Nuggets", "calories":440},
            {"foodName":"20 Piece Nuggets", "calories":890}
        ]
    },
    {
        "restaurant":"Wendys",
        "foodItems":[
            {"foodName":"Single", "calories":550},
            {"foodName":"Double", "calories":790},
            {"foodName":"Triple", "calories":1070},
            {"foodName":"Daves Single", "calories":550},
            {"foodName":"Daves Double", "calories":790},
            {"foodName":"Daves Triple", "calories":1070},
            {"foodName":"Son of Baconator", "calories":610},
            {"foodName":"Baconator", "calories":930},
            {"foodName":"Homestyle Asiago Ranch Chicken Club", "calories":650},
            {"foodName":"Spicy Asiago Ranch Chicken Club", "calories":640},
            {"foodName":"Grilled Asiago Ranch Chicken Club", "calories":500},
            {"foodName":"Homestyle Chicken Sandwich", "calories":500},
            {"foodName":"Spicy Chicken Sandwich", "calories":490},
            {"foodName":"Premium Cod Sandwich", "calories":430},
            {"foodName":"Double Stack", "calories":390},
            {"foodName":"Spicy Chicken Go Wrap", "calories":370},
            {"foodName":"Grilled Chicken Go Wrap", "calories":270},
            {"foodName":"Junior Bacon Cheeseburger", "calories":370},
            {"foodName":"Grilled Chicken Sandwich", "calories":360},
            {"foodName":"Crispy Chicken Sandwich", "calories":330},
            {"foodName":"Junior Cheeseburger", "calories":280}
        ]
    },
    {
        "restaurant":"Taco Bell",
        "foodItems":[
            {"foodName":"7 Layer Burrito","calories":440},
            {"foodName":"Seven Layer Burrito","calories":440},
            {"foodName":"Bean Burrito","calories":380},
            {"foodName":"Beefy 5 Layer Burrito","calories":500},
            {"foodName":"Beefy five layer burrito","calories":500},
            {"foodName":"Beefy Fritos Burrito","calories":440},
            {"foodName":"Beefy Nacho Loader Griller","calories":370},
            {"foodName":"Black Bean Burrito","calories":390},
            {"foodName":"Beef Burrito Supreme","calories":410},
            {"foodName":"Chicken Burrito Supreme","calories":380},
            {"foodName":"Steak Burrito Supreme","calories":390},
            {"foodName":"Cheesy Bean and Rice Burrito","calories":430},
            {"foodName":"Chili Cheese Burrito","calories":370},
            {"foodName":"Cheesy Potato Burrito","calories":490},
            {"foodName":"Chipotle Chicken Loaded Griller","calories":340},
            {"foodName":"Combo Burrito","calories":450},
            {"foodName":"Loaded Potato Griller","calories":410},
            {"foodName":"Beef Quesarito","calories":650},
            {"foodName":"Chicken Quesarito","calories":640},
            {"foodName":"Steak Queasarito","calories":630},
            {"foodName":"Shredded Chicken Burrito","calories":420},
            {"foodName":"Beef Smothered Burrito","calories":700},
            {"foodName":"Shredded Chicken Smothered Burrito","calories":670},
            {"foodName":"Steak Smothered Burrito","calories":660},
            {"foodName":"Beef XXL Grilled Stuft Burrito","calories":870},
            {"foodName":"Chicken XXL Grilled Stuft Burrito","calories":830},
            {"foodName":"Steak XXL Grilled Stuft Burrito","calories":840},
            {"foodName":"Beefy Fritos Burrito","calories":440},
            {"foodName":"Beefy Mini Quesadilla","calories":210},
            {"foodName":"Caramel Apple Empanada","calories":280},
            {"foodName":"Cheese Roll-up","calories":180},
            {"foodName":"Cheesy Bean and Rice Burrito","calories":430},
            {"foodName":"Cinnabon Delights","calories":160},
            {"foodName":"Cinnamon Twists","calories":170},
            {"foodName":"Shredded Chicken Mini Quesadilla","calories":200},
            {"foodName":"Spicy Potato Soft Taco","calories":230},
            {"foodName":"Spicy Tostada","calories":210},
            {"foodName":"Triple Layer Nachos","calories":320},
            {"foodName":"Fresco Bean Burrito","calories":350},
            {"foodName":"Fresco Chicken Burrito Supreme","calories":340},
            {"foodName":"Fresco Steak Burrito Supreme","calories":340},
            {"foodName":"Beef Fresco Crunchy Taco","calories":140},
            {"foodName":"Beef Fresco Soft Taco","calories":160},
            {"foodName":"Shredded Chicken Fresco Soft Taco","calories":150},
            {"foodName":"Steak Fresco Soft Taco","calories":140}
        ]
    }
];

var drinks = [
    {"drinkName":"Water", "calories":0},
    {"drinkName":"Nothing", "calories":0},
    {"drinkName":"None", "calories":0},
    {"drinkName":"Soda", "calories":150},
    {"drinkName":"Large Soda", "calories":250},
    {"drinkName":"Coke", "calories":150},
    {"drinkName":"Pepsi", "calories":150},
    {"drinkName":"Sprite", "calories":150},
    {"drinkName":"Large Diet Lemonade", "calories":0},
    {"drinkName":"Diet Lemonade", "calories":0},
    {"drinkName":"Lemonade", "calories":150},
    {"drinkName":"Ice Tea", "calories":0},
    {"drinkName":"Sweet Tea", "calories":250},
    {"drinkName":"Diet Soda", "calories":0},
    {"drinkName":"Diet Coke", "calories":0},
    {"drinkName":"Diet Pepsi", "calories":0},
    {"drinkName":"Milk", "calories":120},
    {"drinkName":"Chocolate Shake", "calories":400},
    {"drinkName":"Vanilla Shake", "calories":350}
];

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
    
    console.log("now doing some calculating");

    // check to see if in validation mode or final confirmation
    if (intentRequest.invocationSource === 'DialogCodeHook') {
        console.log("Validation in progress.");

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

