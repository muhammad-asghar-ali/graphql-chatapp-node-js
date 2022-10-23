import { gql } from "apollo-server-express";

const typeDefs = gql `
    type Query {
        users: [User]
        messagesByUser(receiverId: Int!): [Message]
    }

    input UserInput{
        firstname: String! 
        lastname: String!
        email: String!
        password: String!
    }

    input UserSigninInput{
        email: String!
        password: String!
    }
    
    type Mutation{
        signupUser(newUser: UserInput!): User
        signinUser(user: UserSigninInput!): Token
        createMessage(receiverId: Int!, text: String!): Message
    }

    scalar Date 
    
    type Message {
        id: ID! 
        text: String!
        receiverId: Int!       
        senderId: Int!
        createdAt: Date!
    }

    type Token {
        token: String!
    }
    
    type User{
        id: ID!
        firstname: String! 
        lastname: String!
        email: String!
    }

    type Subcription{
        messageAdded: Message
    }
`

export default typeDefs