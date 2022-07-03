const AWS = require("aws-sdk");

var cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15', region: "ca-central-1" });
var cloudfront = new AWS.CloudFront({ apiVersion: '2020-05-31', region: "ca-central-1" });

var params = {
    StackName: process.env.STACKNAME
};
cloudformation.describeStackResources(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
        console.log(data);           // successful response
        const resource = data.StackResources.find(r => r.LogicalResourceId.toLowerCase().includes("cloudfrontwebdistribution"));
        if (resource) {
            createInvalidation(resource.PhysicalResourceId)
        }
    }
});


function createInvalidation(DistributionId) {
    var params = {
        DistributionId,
        InvalidationBatch: { 
            CallerReference: `CICD-${new Date().getTime()}`,
            Paths: {
                Quantity: 1,
                Items: ['/*']
            }
        }
    };
    cloudfront.createInvalidation(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data);           // successful response
    });

}