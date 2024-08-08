import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { fetchDataDana } from '../functions/fetch-data-dana/resource';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  fetchDataDana: a
    .query()
    .arguments({
      dana: a.string().default(""),
    })
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(fetchDataDana)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
