import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { fetchDataDana } from './functions/fetch-data-dana/resource';
import { myApiFunction } from "./functions/api-function/resource";

const backend = defineBackend({
  auth,
  data,
  myApiFunction,
  fetchDataDana,
});

//=============create a new API stack==============
const apiStack = backend.createStack("api-stack");

// create a new REST API
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Allow all origins
    allowMethods: Cors.ALL_METHODS, // Allow all methods
    allowHeaders: Cors.DEFAULT_HEADERS, // Allow all default headers
  },
});

// ==============Create resource session============
// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.myApiFunction.resources.lambda
);

// create a new resource path with IAM authorization
const sessionPath = myRestApi.root.addResource("session", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

// add methods you would like to create to the resource path
sessionPath.addMethod("GET", lambdaIntegration);
sessionPath.addMethod("POST", lambdaIntegration);

// ==============Create resource data============
// create a new Lambda integration
const lambdaIntegrationDana = new LambdaIntegration(
  backend.fetchDataDana.resources.lambda
);

// create a new resource path with IAM authorization
const dataPath = myRestApi.root.addResource("data", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

// add methods you would like to create to the resource path
dataPath.addMethod("GET", lambdaIntegrationDana);
dataPath.addMethod("POST", lambdaIntegrationDana);

//================create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with Cognito authorization
const booksPath = myRestApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/session", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/session/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/data", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/data/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
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
      resources: ["*"], // Consider specifying actual Rekognition resources
    }),
    new PolicyStatement({
      actions: [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
      ],
      resources: ["arn:aws:s3:::video-signature3-images/*"], // Update to match your bucket
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
