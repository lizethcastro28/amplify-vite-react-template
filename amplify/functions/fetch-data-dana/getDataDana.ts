import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import https from 'https';
import AWS from 'aws-sdk';

import { secret } from "@aws-amplify/backend";

const secretsManager = new AWS.SecretsManager();

const getSecret = async (secretName: string): Promise<string> => {
    try {
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        if ('SecretString' in data) {
            return data.SecretString as string;
        }
        throw new Error('Secret not found');
    } catch (error) {
        console.error('Error retrieving secret:', error);
        throw error;
    }
};

export const getDataDana = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    console.log('-----------getDataDanaFunction------', event);
    try {
        const queryStringParameters = event.queryStringParameters;
        const danaParam = queryStringParameters ? queryStringParameters.dana : null;
        const idCompany = 'venturestars';

        if (!danaParam) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                },
                body: JSON.stringify({ error: 'danaParam no está definido' })
            };
        }

        if (!idCompany) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                },
                body: JSON.stringify({ error: 'idCompany no está definido' })
            };
        }

        const secretName = 'accessDana';
        const secreto = secret('secretName');
        console.log('==========secreto: ', secreto);
        const secretString = await getSecret(secretName);
        console.log('==========secretString: ', secretString);
        let user = secretString.replace('idCompany', idCompany);

        console.log('==========user: ', user)
        const base64Credentials = Buffer.from(user).toString('base64');

        const options = {
            hostname: 'appserv.danaconnect.com',
            path: `/api/1.0/rest/conversation/data/${encodeURIComponent(danaParam)}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${base64Credentials}`
            }
        };

        const body = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.headers['content-type'] === 'application/json') {
                        try {
                            resolve(JSON.parse(data));
                        } catch (parseError) {
                            reject(parseError);
                        }
                    } else {
                        resolve(data);
                    }
                });
            });
            req.on('error', (error) => {
                reject(error);
            });
            req.end();
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify(body)
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
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
