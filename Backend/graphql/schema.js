import { buildSchema } from "graphql";

export default buildSchema(`
   type Post {
      _id: ID!
      title: String!
      content: String!
      imageURL: String!
      creator: User!
      createdAt: String!
      updatedAt: String!
   }
   
   type User {
      _id: ID!
      name: String!
      email: String!
      password: String
      status: String!
      posts: [Post!]!
   }

   type AuthData {
      token: String!
      userId: String!
   }

   input UserInputData {
      email: String!
      name: String!
      password: String!
   } 
   
   type Query {
      hello: String
   }

   type Mutation {
      createUser(userInput: UserInputData): User
      login(email: String!, password: String!): AuthData
   }  
`);