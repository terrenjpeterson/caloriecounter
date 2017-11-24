# Slot Maintenance

This folder contains all of the lambda functions and bash scripts that automate the large custom slots that are part of the NLU models in this bot.

Food Options
- slots.sh (this is the bash script that loads the custom slot called FoodOptions).
- genslots.js (this is the lambda function that converts the foods.json data object into the correct format needed by the Lex CLI command).
- deployslotgen.sh (this is the bash script that deploys the genslots.js script as a lambda function).

Drink Options
- createdrinkslot.sh (this is the bash script that loads the custom slot called DrinkOptions).
- gendrinkslot.js (this is the lambda function that converts the drinks.json data object into the correct format needed by the Lex CLI command).
- deploydrinkslot.sh (this is the bash script that deploys the gendrinkslot.js script as a lambda function).
