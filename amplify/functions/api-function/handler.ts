import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition();

export const handler: APIGatewayProxyHandler = async (event) => {
    const httpMethod = event.httpMethod; // Obtiene el método HTTP de la solicitud
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
        // Agrega más casos para otros métodos HTTP si es necesario
        default:
            response = handleUnknownRequest(event);
            break;
    }

    return response;
};

// Función para manejar solicitudes GET
const getFaceLivenessSession = async (event: any): Promise<APIGatewayProxyResult> => {
    const sessionId = event.pathParameters.sessionId;
    try {
        const params = {
            SessionId: sessionId
        };
        const session = await rekognition.getFaceLivenessSessionResults(params).promise();
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
const createSessionLiveness = async (event: any): Promise<APIGatewayProxyResult> => {
    try {
        const params = {
            ClientRequestToken: `token-${Date.now()}`, // Cambia esto según sea necesario
            FaceLivenessConfig: {
                // Configura los parámetros según sea necesario
                LivenessType: 'LIVENESS',
                TimeoutSeconds: 60
            }
        };

        const session = await rekognition.createFaceLivenessSession(params).promise();
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(session)
        };
    } catch (error: unknown) {
        console.error('Error creating session:', error);

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
const handleUnknownRequest = (event: any): APIGatewayProxyResult => {
    return {
        statusCode: 405, // Método no permitido
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        },
        body: JSON.stringify(`-----Method ${event.httpMethod} not allowed`),
    };
};
