Calorie Counter Chatbot
-----------------------

This is a Lex based chatbot that will calculate calories made by trips to different fast food restaurants.

There are two different lambda functions called by Lex - lambda.js and pizza.js
- These files are located in the /src folder.
- Also within this folder is a data folder which contains the lookup values for the different food and drinks.
- A build script is also in this folder. It stages the zip files to a S3 bucket, deploys the new lambda functions, and runs a test.

Source code for caloriecountbot.com website is located in the /website folder.

Configurations for Lex service are the botDefnFile.json file. (this is outdated and needs to be extracted again)
