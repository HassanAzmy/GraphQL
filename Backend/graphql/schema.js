import { buildSchema } from "graphql";

export default buildSchema(`
   type Post {
      _id: ID
      title: String!
      content: String!
      imageURL: String!
      creator: User!
      createAt: String!
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

   input UserInputData {
      email: String!
      name: String!
      password: String!
   } 
   
   type RootMutation {
      createUser(userInput: UserInputData): User
   }

   schema {
      mutation: RootMutation
   }   
`);