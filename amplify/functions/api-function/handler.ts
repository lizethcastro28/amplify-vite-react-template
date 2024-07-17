import type { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import * as AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const httpMethod = event.httpMethod;
    console.log("------HTTP Method:", httpMethod);
    console.log("------event", event);

    let response: APIGatewayProxyResult;

    switch (httpMethod) {
        case "GET":
            response = await getFaceLivenessSession(event);
            break;
        case "POST":
            response = await createSessionLiveness(event);
            break;
        default:
            response = handleUnknownRequest(event);
            break;
    }

    return response;
};

// Función para manejar solicitudes GET

const getFaceLivenessSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    console.log('-------getFaceLivenessSession event: ', event);

    // Verificar si pathParameters está presente y tiene sessionId
    const sessionId = event.pathParameters?.sessionId;

    if (!sessionId) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({ error: "Missing sessionId in path parameters" })
        };
    }
    
    try {
        const params = {
            SessionId: sessionId
        };
        const session = await rekognition.getFaceLivenessSessionResults(params).promise();
        console.log('----->>>>getFaceLivenessSessionResults: ', session);
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(session)
        };
    } catch (error: unknown) {
        console.error('Error getting session result:', error);

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({ error: errorMessage })
        };
    }
};


// Función para manejar solicitudes POST
const createSessionLiveness = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
   console.log('----------->>>......createSessionLiveness------')
    try {
        const clientRequestToken = event.requestContext.requestId; 

        const params = {
            ClientRequestToken: clientRequestToken, // Opcional pero recomendado para idempotencia
            //KmsKeyId: 'tu-kms-key-id', // Opcional, para encriptar las imágenes almacenadas
            Settings: { // Opcional, para configurar el almacenamiento de imágenes y el límite de imágenes de auditoría
              AuditImagesLimit: 2, // Puedes especificar de 0 a 4
              OutputConfig: {
                S3Bucket: 'video-signature3-images',
                S3KeyPrefix: 'liveness-sessions/'
              }
            }
          };

        const session = await rekognition.createFaceLivenessSession(params).promise();
        console.log('--------------->......la session creada en backend: ', session);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(session)
        };
    } catch (error: unknown) {
        console.log('Entra en el catch....');
        console.error('----->>>>>>Error creating liveness session:', error);

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({ error: errorMessage })
        };
    }
};

// Función para manejar solicitudes desconocidas
const handleUnknownRequest = (event: APIGatewayEvent): APIGatewayProxyResult => {
    return {
        statusCode: 405, // Método no permitido
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        },
        body: JSON.stringify(`Method ${event.httpMethod} not allowed`),
    };
};
