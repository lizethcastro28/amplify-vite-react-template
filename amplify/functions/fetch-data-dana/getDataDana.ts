import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';


export const getDataDana = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    console.log('-----------getDataDanaFunction------', event)
    try {
        // Obtener los parámetros de la cadena de consulta
        const queryStringParameters = event.queryStringParameters;
        const danaParam = queryStringParameters ? queryStringParameters.dana : null;

        // Aquí puedes usar `danaParam` como lo necesites
        console.log('------Query String Parameter dana:', danaParam);
        const responseBody = `Hello from Lambda getDataDana: ${danaParam}`;

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(responseBody)
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
