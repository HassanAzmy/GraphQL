import { buildSchema } from "graphql";

export default buildSchema(`
   type Post {
      _id: ID!
      title: String!
      content: String!
      imageUrl: String!
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

   type PostData {
      posts: [Post!]!
      totalPosts: Int!
   }

   input UserInputData {
      email: String!
      name: String!
      password: String!
   }
   
   input PostInputData{
      title: String!
      content: String!
      imageUrl: String!
   }

   type Query {
      showPosts: PostData
   }

   type Mutation {
      createUser(userInput: UserInputData!): User!
      login(email: String!, password: String!): AuthData!
      createPost(postInput: PostInputData!): Post!
   }
`);