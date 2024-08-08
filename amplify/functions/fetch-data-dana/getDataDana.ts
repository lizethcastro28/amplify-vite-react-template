import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';


export const getDataDana = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    console.log('-----------getDataDanaFunction------', event)
    try {
        //const danaParam = event.requestContext;

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify('Hello from Lambda getDataDana: ')
        };
    } catch (error: unknown) {
        console.error('Error getDataDana:', error);

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
