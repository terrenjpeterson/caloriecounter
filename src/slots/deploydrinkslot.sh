#!/bin/bash
# deploy the lambda function convertFoodsObjForSlot from genslots.js

zip drinkslotgen.zip gendrinkslot.js

aws s3 cp drinkslotgen.zip s3://fastfoodchatbot/binaries/
aws s3 cp gendrinkslot.js s3://fastfoodchatbot/binaries/

rm drinkslotgen.zip

# update the lambda function with the binaries that have been staged
aws lambda update-function-code --function-name generateDrinkSlot --s3-bucket fastfoodchatbot --s3-key binaries/drinkslotgen.zip


