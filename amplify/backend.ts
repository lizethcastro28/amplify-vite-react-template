import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { myApiFunction } from "./functions/api-function/resource";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
  myApiFunction,
});

// Create a new API stack
const apiStack = backend.createStack("api-stack");

// Create a new REST API
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

// Create fetchDataDanaFunction
const fetchDataDanaFunction = new Function(apiStack, "fetchDataDanaFunction", {
  runtime: Runtime.NODEJS_18_X,
  handler: "fetch-data-dana-function.handler",
  code: Code.fromAsset("functions"), // path to the functions directory
  environment: {
    // Add any environment variables if needed
  },
});

// Create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(backend.myApiFunction.resources.lambda);

// Add fetchDataDanaFunction integration
const fetchDataDanaIntegration = new LambdaIntegration(fetchDataDanaFunction);

// Create a new resource path with IAM authorization
const sessionPath = myRestApi.root.addResource("session", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

// Add methods you would like to create to the resource path
sessionPath.addMethod("GET", lambdaIntegration);
sessionPath.addMethod("POST", lambdaIntegration);

// Create a new resource path for fetchDataDanaFunction
const fetchDataDanaPath = myRestApi.root.addResource("fetch-data-dana");
fetchDataDanaPath.addMethod("GET", fetchDataDanaIntegration, {
  authorizationType: AuthorizationType.NONE,
});

// Add a proxy resource path to the API
sessionPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// Create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// Create a new resource path with Cognito authorization
const booksPath = myRestApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// Create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/session", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/session/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/fetch-data-dana", "dev")}`,
      ],
    })
  ],
});

// Attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);

// Create a new policy for Rekognition and S3 access
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

// Attach the policy to the Lambda execution role
const lambdaRole = backend.myApiFunction.resources.lambda.role as Role;
lambdaRole.attachInlinePolicy(rekognitionAndS3Policy);

// Add outputs to the configuration file
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
