import { ApolloServer } from "apollo-server-express";
import typeDefs from "./typeDefs.js";
import resolvers from "./resolvers.js";
import jwt from "jsonwebtoken";
import express from 'express';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from "@graphql-tools/schema";
const app = express()

// const server = new ApolloServer({
//     typeDefs,
//     resolvers,
//     context: ({ req }) => {
//         return {
//             userId: verifyToken(req)
//         }
//     },
//     // introspection: true,
//     // playground: true,
// })

// let server = null;
// async function startServer() {
//     server = new ApolloServer({
//         typeDefs,
//         resolvers,
//         context: ({ req }) => {
//             return {
//                 userId: verifyToken(req)
//             }
//         },
//         // introspection: true,
//         // playground: true,
//     })
//     await server.start();
//     server.applyMiddleware({ app });
// }
// startServer();

const schema = makeExecutableSchema({ typeDefs, resolvers })

const context = ({ req }) => {
    return {
        userId: verifyToken(req)
    }
}
const verifyToken = (request) => {
    const token = request.headers.authorization
    if (token) {
        const { userId } = jwt.verify(token, process.env.JWT)
        return userId
    }
}
const apolloServer = new ApolloServer({ schema, context })
await apolloServer.start()
apolloServer.applyMiddleware({ app })

const server = app.listen(4000, () => {
    const wsServer = new WebSocketServer({
        server,
        path: '/graphql',
    });
    useServer({ schema }, wsServer)
    console.log(`server running on port 4000`);
});

// server.listen().then(({ url }) => {
//     console.log(`🚀  Server ready at ${url}`)
// })