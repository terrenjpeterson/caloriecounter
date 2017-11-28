#!/bin/bash
# deploy the lambda function convertFoodsObjForSlot from genslots.js

zip slotgenextra.zip genextraslots.js

aws s3 cp slotgenextra.zip s3://fastfoodchatbot/binaries/
aws s3 cp genextraslots.js s3://fastfoodchatbot/binaries/

rm slotgenextra.zip

# update the lambda function with the binaries that have been staged
aws lambda update-function-code --function-name convertExtraObjForSlot --s3-bucket fastfoodchatbot --s3-key binaries/slotgenextra.zip
