import { defineFunction } from '@aws-amplify/backend';

export const fetchDataDana = defineFunction({
    name: 'fetch-data-dana',
    timeoutSeconds: 60 // 1 minute timeout
});