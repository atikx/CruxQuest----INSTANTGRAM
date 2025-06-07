// drizzle/schema.ts
import { pgTable, uuid, text, timestamp, serial, boolean, primaryKey, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// USERS
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  avatar: text("profilePictureUrl").default("https://img.freepik.com/premium-photo/anime-male-avatar_950633-956.jpg"),
  aboutMe: text("aboutMe"),
  otp: integer("otp"),
  isEmailVerified: boolean("isEmailVerified").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  sentFriendRequests: many(friendRequests, { relationName: "sent", fields: [users.id], references: [friendRequests.fromUser] }),
  receivedFriendRequests: many(friendRequests, { relationName: "received", fields: [users.id], references: [friendRequests.toUser] }),
}));

// TAGS
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}));

// POSTS
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  images: many(postImages),
  comments: many(comments),
  tags: many(postTags),
  likes: many(likes),
}));

// POST IMAGES
export const postImages = pgTable("postImages", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  imageUrl: text("imageUrl").notNull(),
});

export const postImagesRelations = relations(postImages, ({ one }) => ({
  post: one(posts, {
    fields: [postImages.postId],
    references: [posts.id],
  }),
}));

// POST TAGS
export const postTags = pgTable(
  "postTags",
  {
    postId: uuid("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tagId").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.tagId] }),
  })
);

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

// FRIEND REQUESTS
export const friendRequests = pgTable(
  "friendRequests",
  {
    id: uuid("id").defaultRandom(),
    fromUser: uuid("fromUser").notNull().references(() => users.id, { onDelete: "cascade" }),
    toUser: uuid("toUser").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted", "rejected"] }).default("pending"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    unique: primaryKey({ columns: [table.fromUser, table.toUser] }),
  })
);

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  fromUser: one(users, {
    fields: [friendRequests.fromUser],
    references: [users.id],
    relationName: "sent",
  }),
  toUser: one(users, {
    fields: [friendRequests.toUser],
    references: [users.id],
    relationName: "received",
  }),
}));

// LIKES
export const likes = pgTable(
  "likes",
  {
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.postId] }),
  })
);

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
}));

// COMMENTS
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  parentId: uuid("parentId").references(() => comments.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "parentComment",
  }),
  children: many(comments, {
    relationName: "parentComment",
  }),
}));
