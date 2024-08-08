import { AppSyncResolverHandler } from 'aws-lambda';

// Define the schema with authorization rules and handler
export const fetchDataDana: AppSyncResolverHandler<{ dana?: string }, string> = async (event) => {
    const { dana } = event.arguments;
    return `Respuesta de mi lambda, ${dana}!`;
};
