import { APIGatewayProxyHandler } from 'aws-lambda';


export const handler: APIGatewayProxyHandler = async (event) => {
  const params = event.queryStringParameters;
    return {
      statusCode: 200,
      body: JSON.stringify({ mensage: 'Hello lambda' }),
    };
  
};
