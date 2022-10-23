import bcrpyt from "bcryptjs"
import { AuthenticationError, ForbiddenError } from "apollo-server-express"
import { PrismaClient } from '@prisma/client'
import jwt from "jsonwebtoken"
import { PubSub } from "graphql-subscriptions"

const prisma = new PrismaClient()
const pubsub = new PubSub()

const MESSAGE_ADDED = "MESSAGE_ADDED"

const resolvers = {
    Query: {
        users: async(_, args, { userId }) => {
            if (!userId) throw new ForbiddenError("you must be logged in")
            const users = await prisma.users.findMany({
                orderBy: {
                    createdAt: "desc"
                },
                where: {
                    id: {
                        not: userId
                    }
                }
            })
            return users
        },
        messagesByUser: async(_, { receiverId }, { userId }) => {
            if (!userId) throw new ForbiddenError("you must be logged in")
            const messages = await prisma.messages.findMany({
                where: {
                    OR: [
                        { senderId: userId, receiverId: receiverId },
                        { senderId: receiverId, receiverId: userId }
                    ]
                },
                orderBy: {
                    createdAt: 'asc'
                }
            })
            return messages
        }
    },

    Mutation: {
        signupUser: async(_, { newUser }) => {
            const alreadyExist = await prisma.users.findUnique({ where: { email: newUser.email } })
            if (alreadyExist) throw new AuthenticationError("User already exist with this email")

            const hashPassword = await bcrpyt.hash(newUser.password, 10)
            const user = await prisma.users.create({
                data: {
                    ...newUser,
                    password: hashPassword
                }
            })
            return user
        },

        signinUser: async(_, { user }) => {
            const isUserExist = await prisma.users.findUnique({ where: { email: user.email } })
            if (!isUserExist) throw new AuthenticationError("User not exist")

            const doMatch = await bcrpyt.compare(user.password, isUserExist.password)
            if (!doMatch) throw new AuthenticationError("email or password is invalid")

            const token = jwt.sign({ userId: isUserExist.id }, process.env.JWT)
            return { token }
        },

        createMessage: async(_, { receiverId, text }, { userId }) => {
            if (!userId) throw new ForbiddenError("you must be logged in")
            const message = await prisma.messages.create({
                data: {
                    text: text,
                    receiverId: receiverId,
                    senderId: userId
                }
            })

            pubsub.publish(MESSAGE_ADDED, { messageAdded: message })
            return message
        }
    },

    Subscription: {
        messageAdded: {
            subscribe: () => pubsub.asyncIterator(MESSAGE_ADDED)
        }
    }
}

export default resolvers