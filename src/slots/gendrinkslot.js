// conversion of drinks data object to data needed for customized slot

'use strict';

exports.handler = function (event, context) {
    // the event data that comes in is the raw json data object
    var rawData = event;
    console.log(JSON.stringify(rawData));

    // first dump all of the food items into a large array
    var allDrinkItems = [];
    for (var i = 0; i < rawData.length; i++) {
	allDrinkItems.push(rawData[i].drinkName);
    }
    
    // now add a few items that are used in answering queries 
    // if the user doesn't want a drink
    allDrinkItems.push('No');
    allDrinkItems.push('None');
    allDrinkItems.push('Nothing');

    // now sort through for unique items and get into correct format
    var drinkOptions = [];
    for (var k = 0; k < allDrinkItems.length; k++) {
        var uniqueDrinkItem = true;
        for (var m = 0; m < drinkOptions.length; m++ ) {
            if (allDrinkItems[k] === drinkOptions[m].value) {
                console.log("found duplicate of " + drinkOptions[m].value);
                uniqueDrinkItem = false;
            }
        }
        if (uniqueDrinkItem) {
            var newItem = {};
                newItem.value = allDrinkItems[k];
            console.log(JSON.stringify(newItem));
            drinkOptions.push(newItem);
        }
    }
    
    console.log("Number of unique items: " + drinkOptions.length);
    console.log(drinkOptions);
    
    // return the food entrees array 
    context.succeed(drinkOptions);
};
