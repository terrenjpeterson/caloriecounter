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
		// skip loading nuggets to custom slot
            	if (rawData[i].foodItems[j].foodType === "Nuggets") {
                    console.log("Skipped Food Item: " + rawData[i].foodItems[j].foodName);
            	} else {
                    allFoodItems.push(rawData[i].foodItems[j].foodName);
		}
            }
        }
    }
    
    // now sort through for unique items
    var foodEntrees = [];
    for (var k = 0; k < allFoodItems.length; k++) {
        var uniqueFoodItem = true;
        for (var m = 0; m < foodEntrees.length; m++ ) {
            if (allFoodItems[k] === foodEntrees[m].value) {
                console.log("found duplicate of " + foodEntrees[m].value);
                uniqueFoodItem = false;
            }
        }
        if (uniqueFoodItem) {
            var newItem = {};
                newItem.value = allFoodItems[k];
            console.log(JSON.stringify(newItem));
            foodEntrees.push(newItem);
        }
    }
    
    console.log("Number of unique items: " + foodEntrees.length);
    console.log(foodEntrees);
    
    // return the food entrees array 
    context.succeed(foodEntrees);
};
