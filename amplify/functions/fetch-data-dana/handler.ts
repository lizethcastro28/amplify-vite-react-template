import { AppSyncResolverHandler } from 'aws-lambda';

export const handler: AppSyncResolverHandler<{ dana?: string }, string> = async (event) => {
    // arguments typed from `.arguments()`
    const { dana } = event.arguments;
    return `Respuesta de mi lambda, ${dana}!`;
};
