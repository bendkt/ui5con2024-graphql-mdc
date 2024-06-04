
const express = require('express');
const fs = require("fs");
const path = require("path");
const cors = require('cors');
const http = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { randomUUID } = require('crypto');

const { ApolloServer, gql } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

const MOUNTAINS_UPDATED = 'MOUNTAINS_UPDATED';

const typeDefs = gql(fs.readFileSync(path.resolve(__dirname, "./types.graphql"), 'utf8'))

const jsonData = require('./data.json');

const mountains = jsonData.mountains
const ranges = jsonData.ranges
const countries = jsonData.countries

const resolvers = {
  Query: {
    getRanges: () => ranges,
    getCountries: () => countries,
    getMountains: () => mountains,
    getMountain: ( _, { mountainId } )  => {
      return mountains.find(m => m.id === mountainId)
    }
  },
  Mutation: {
    createMountain: async (_, { mountain } )  => {
      const mountainWithId = {...mountain, id: randomUUID()};
      mountains.push(mountainWithId)
      pubsub.publish(MOUNTAINS_UPDATED, { mountainsUpdated: [mountainWithId] });
      return mountainWithId
    },
    updateMountain: async (_, { mountain } ) => {
      const index = mountains.findIndex(m => m.id === mountain.id)
      const targetMountain = mountains[index]
      if (targetMountain) {
        mountains[index] = mountain
        pubsub.publish(MOUNTAINS_UPDATED, { mountainsUpdated: [mountain] });
      }
      return mountain
    }
  },
  Subscription: {
    mountainsUpdated: {
      subscribe: () => pubsub.asyncIterator([MOUNTAINS_UPDATED]),
    },
  },
  Mountain: {
    parent_mountain: parent => {
      return mountains.find(m => m.id === parent.id_parent)
    },
    range: parent => {
      return ranges.find(r => r.id === parent.id_range);
    },
    countries: parent => {
      return parent.country_codes ? countries.filter(c => parent.country_codes.indexOf(c.code) !== -1) : [];
    },
  }
};

const schema = makeExecutableSchema({typeDefs, resolvers });

async function startApolloServer(schema) {
  const app = express();

  app.use(cors())

  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            }
          };
        }
      }
    ],
  });

  const subscriptionServer = SubscriptionServer.create({
    // This is the `schema` we just created.
    schema,
    // These are imported from `graphql`.
    execute,
    subscribe
  }, {
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // This `server` is the instance returned from `new ApolloServer`.
    path: server.graphqlPath,
  });

  await server.start();
  server.applyMiddleware({ app });
  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startApolloServer(schema);
