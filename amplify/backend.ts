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

// Crear un nuevo stack para la API
const apiStack = backend.createStack("api-stack");

// Crear una nueva API REST
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restringir esto a los dominios de confianza
    allowMethods: Cors.ALL_METHODS, // Especificar solo los métodos necesarios
    allowHeaders: Cors.DEFAULT_HEADERS, // Especificar solo los encabezados necesarios
  },
});

// Crear una integración Lambda
const lambdaIntegration = new LambdaIntegration(
  backend.myApiFunction.resources.lambda
);

// Crear el recurso /session
const sessionPath = myRestApi.root.addResource("session");

// Agregar métodos a /session
sessionPath.addMethod("POST", lambdaIntegration, {
  authorizationType: AuthorizationType.IAM,
});

// Crear el recurso /session/{sessionId}
const sessionIdResource = sessionPath.addResource("{sessionId}");

// Agregar métodos a /session/{sessionId}
sessionIdResource.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.IAM,
});

// Crear una nueva política IAM para permitir invocar la API
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

// Adjuntar la política a los roles IAM autenticados y no autenticados
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);

// Crear una nueva política para Rekognition y S3
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

// Adjuntar la política al rol de ejecución de Lambda
const lambdaRole = backend.myApiFunction.resources.lambda.role as Role;
lambdaRole.attachInlinePolicy(rekognitionAndS3Policy);

// Agregar salidas al archivo de configuración
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

backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(livenessPolicy);
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(livenessPolicy);
