# wget https://repo1.maven.org/maven2/io/swagger/codegen/v3/swagger-codegen-cli/3.0.20/swagger-codegen-cli-3.0.20.jar -O swagger-codegen-cli.jar

API_MODULE_NAME=fleetonroute

echo "Generating Client into temp folder"
set -e
wget http://api.fleetonroute.com/api/documentation-json -O ./.scripts/swagger.json
java -jar swagger-codegen-cli.jar generate -i ./.scripts/swagger.json -l typescript-fetch -o ./modules/$API_MODULE_NAME-tmp

echo "Deleting existing client"
rm -rf ./modules/$API_MODULE_NAME

mkdir ./modules/$API_MODULE_NAME

echo "Copying generated client into apiClient directory"
cp -r ./modules/$API_MODULE_NAME-tmp/*.ts ./modules/$API_MODULE_NAME

echo "Deleting temp folder"
rm -rf ./modules/$API_MODULE_NAME-tmp

# we point to scripts/swagger.json; assuming script is run from project root directory
JSON=`cat .scripts/swagger.json | jq '.info'`
echo $JSON > ./modules/$API_MODULE_NAME/client.version.json

echo "Done"