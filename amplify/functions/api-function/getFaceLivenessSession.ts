import * as AWS from 'aws-sdk';
import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

const rekognition = new AWS.Rekognition();

export const getFaceLivenessSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    console.log('-------getFaceLivenessSession event: ');

    const path = event.path;
    const parts = path.split('/'); // Divide el path en partes separadas por '/'
    const sessionId = parts[2];

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
