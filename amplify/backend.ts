import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  LambdaIntegration,
  RestApi,
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { myApiFunction } from "./functions/api-function/resource";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
  myApiFunction,
});

// create a new API stack
const apiStack = backend.createStack("api-stack");

// create a new REST API
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  },
});

// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.myApiFunction.resources.lambda
);

// create a new resource path with IAM authorization for /session
const sessionPath = myRestApi.root.addResource("session", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

// add POST method to /session
sessionPath.addMethod("POST", lambdaIntegration);

// create a new resource path with IAM authorization for /session/{sessionId}
const sessionIdResource = sessionPath.addResource("{sessionId}", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

// add GET method to /session/{sessionId}
sessionIdResource.addMethod("GET", lambdaIntegration);

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/session", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/session/*", "dev")}`,
      ],
    })
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// create a new policy for Rekognition and S3 access
const rekognitionAndS3Policy = new Policy(apiStack, "RekognitionAndS3Policy", {
  statements: [
    new PolicyStatement({
      actions: [
        "rekognition:CreateFaceLivenessSession",
        "rekognition:StartFaceLivenessSession",
        "rekognition:GetFaceLivenessSessionResults",
      ],
      resources: ["*"],
    }),
    new PolicyStatement({
      actions: [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
      ],
      resources: ["arn:aws:s3:::video-signature3-images/*"],
    }),
  ],
});

// attach the policy to the Lambda execution role
const lambdaRole = backend.myApiFunction.resources.lambda.role as Role;
lambdaRole.attachInlinePolicy(rekognitionAndS3Policy);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});

const livenessStack = backend.createStack("liveness-stack");

const livenessPolicy = new Policy(livenessStack, "LivenessPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["rekognition:StartFaceLivenessSession"],
      resources: ["*"],
    }),
  ],
});
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(livenessPolicy); // allows guest user access
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(livenessPolicy);
