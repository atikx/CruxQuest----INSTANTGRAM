import { index } from "drizzle-orm/gel-core";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  serial,
  boolean,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").unique().notNull(),
    username: text("username").notNull().unique(),
    passwordHash: text("passwordHash"),
    name: text("name"),
    avatar: text("profilePictureUrl").default(
      "https://img.freepik.com/premium-photo/anime-male-avatar_950633-956.jpg"
    ),
    aboutMe: text("aboutMe"),
    otp: integer("otp"),
    isEmailVerified: boolean("isEmailVerified").default(false),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => {
    return {
      username_index: index("username_index").on(table.username),
    };
  }
);

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const postImages = pgTable("postImages", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("postId")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  imageUrl: text("imageUrl").notNull(),
});

export const postTags = pgTable(
  "postTags",
  {
    postId: uuid("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.tagId] }),
  })
);

export const friendRequests = pgTable(
  "friendRequests",
  {
    id: uuid("id").defaultRandom(),
    fromUser: uuid("fromUser")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUser: uuid("toUser")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "accepted", "rejected"],
    }).default("pending"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    unique: primaryKey({ columns: [table.fromUser, table.toUser] }),
  })
);

export const likes = pgTable(
  "likes",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.postId] }),
  })
);

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("postId")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  parentId: uuid("parentId").references(() => comments.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
