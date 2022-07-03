# wget https://repo1.maven.org/maven2/io/swagger/codegen/v3/swagger-codegen-cli/3.0.20/swagger-codegen-cli-3.0.20.jar -O swagger-codegen-cli.jar

# java -jar swagger-codegen-cli.jar generate -i /home/sai/src/realtime_fleet/realtime-fleet-api/.swagger/swagger.yaml -l javascript -o /home/sai/src/realtime_fleet/realtime-fleet-web-portal/src/core/apiClient-tmp
# rm -rf /home/sai/src/realtime_fleet/realtime-fleet-web-portal/src/core/apiClient/*

# cp -r /home/sai/src/realtime_fleet/realtime-fleet-web-portal/src/core/apiClient-tmp/src/* /home/sai/src/realtime_fleet/realtime-fleet-web-portal/src/core/apiClient
# rm -rf /home/sai/src/realtime_fleet/realtime-fleet-web-portal/src/core/apiClient-tmp

echo "Generating Client into temp folder"
# rm ./scripts/swagger.json
set -e
wget http://localhost:7071/api/documentation-json -O ./scripts/swagger.json
java -jar swagger-codegen-cli.jar generate -i ./scripts/swagger.json -l typescript-fetch -o ./src/core/apiClient-tmp

echo "Deleting existing client"
rm -rf ./src/core/apiClient/*

echo "Copying generated client into apiClient directory"
cp -r ./src/core/apiClient-tmp/*.ts ./src/core/apiClient

echo "Deleting temp folder"
rm -rf ./src/core/apiClient-tmp

# we point to scripts/swagger.json; assuming script is run from project root directory
JSON=`cat scripts/swagger.json | jq '.info'`
echo $JSON > ./src/core/apiClient/client.version.json

echo "Done"