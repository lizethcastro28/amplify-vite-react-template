import { defineFunction } from '@aws-amplify/backend';

export const fetchDataDana = defineFunction({
    // optionally specify a name for the Function (defaults to directory name)
    name: 'fetch-data-dana',
    // optionally specify a path to your handler (defaults to "./handler.ts")
    entry: './handler.ts',
    timeoutSeconds: 60 // 1 minute timeout
});