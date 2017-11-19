// conversion of foods data object to data needed for customized slot

'use strict';

exports.handler = function (event, context) {

    var rawData = event;
    console.log(JSON.stringify(rawData));

    // first dump all of the food items into a large array
    var allFoodItems = [];
    for (var i = 0; i < rawData.length; i++) {
        console.log("Processing Restaurant: " + rawData[i].restaurant);
        // skip mexican restaurants
        if (rawData[i].restaurant !== "Chipotle" &&
            rawData[i].restaurant !== "Taco Bell") {
            for (var j = 0; j < rawData[i].foodItems.length; j++) {
                allFoodItems.push(rawData[i].foodItems[j].foodName);
            }
        }
    }
    
    // now sort through for unique items
    var foodEntrees = [];
    for (var k = 0; k < allFoodItems.length; k++) {
        var uniqueFoodItem = true;
        for (var m = 0; m < foodEntrees.length; m++ ) {
            if (allFoodItems[k].toLowerCase() === foodEntrees[m].toLowerCase()) {
                console.log("found duplicate of " + foodEntrees[m]);
                uniqueFoodItem = false;
            }
        }
        if (uniqueFoodItem) {
            foodEntrees.push(allFoodItems[k]);
        }
    }
    
    // return the food entrees array 
    context.succeed(foodEntrees);
};
