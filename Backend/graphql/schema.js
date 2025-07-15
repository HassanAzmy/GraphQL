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
      showPosts(page: Int!): PostData!
      showSinglePost(postId: ID!): Post!
   }

   type Mutation {
      createUser(userInput: UserInputData!): User!
      login(email: String!, password: String!): AuthData!
      createPost(postInput: PostInputData!): Post!
      updatePost(postInput: PostInputData!, postId: ID!): Post!
      deletePost(postId: ID!): Boolean!
   }
`);