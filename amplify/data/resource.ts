import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  supplier: a
    .model({
      id: a.id(),
      name: a.string(),
      products: a.hasMany("product", "supplierId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  product: a
    .model({
      id: a.id(),
      supplierId: a.id(),
      supplier: a.belongsTo("supplier", "supplierId"),
      name: a.string(),
      dose: a.integer(),
      quantity: a.integer(),
      expiration: a.date(),
      cost: a.float(),
      retail: a.float(),
      numSold: a.integer(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
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
