#!/bin/bash
# deploy the lambda function convertFoodsObjForSlot from genslots.js

zip slotgen.zip genslots.js

aws s3 cp slotgen.zip s3://fastfoodchatbot/binaries/
aws s3 cp genslots.js s3://fastfoodchatbot/binaries/

rm slotgen.zip

# update the lambda function with the binaries that have been staged
aws lambda update-function-code --function-name convertFoodsObjForSlot --s3-bucket fastfoodchatbot --s3-key binaries/slotgen.zip


