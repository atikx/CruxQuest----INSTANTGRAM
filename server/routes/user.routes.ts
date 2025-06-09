import { Router } from "express";
import { zodValidater } from "../middlewares/zodValidator";
import * as userSchemas from "../schemaValidator/user.validator";
import { Mydb } from "../drizzle/db";
import {
  comments,
  likes,
  posts,
  postTags,
  tags,
  users,
} from "../drizzle/schema";
import { eq, or, sql, desc } from "drizzle-orm";
import { generateToken } from "../functions/tokenGenerator";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../middlewares/jwtauth";
import { inArray, gte, and } from "drizzle-orm";
import serviceAccount from "../config/fire-base.json" assert { type: "json" };
import admin from "firebase-admin";
import { sendOtpMail } from "../functions/mailer";
import redis from "../redisClient";

const router = Router();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

router.post("/auth/google", async (req: any, res: any) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    const user = await admin.auth().verifyIdToken(req.body.token);
    if (!user.email) {
      return res.status(400).json({ message: "Email is required" });
    }
    console.log(user);

    const existingUser = await Mydb.select({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      avatar: users.avatar,
      isEmailVerified: users.isEmailVerified,
    })
      .from(users)
      .where(eq(users.email, user.email));
    if (existingUser.length == 0) {
      return res.status(404).json({
        message: "User not found, please register first",
      });
    }
    res.cookie("token", generateToken(existingUser[0].id), {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      message: "Login successful",
      user: existingUser[0],
    });
  } catch (error) {
    console.error("Error during Google authentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/auth/signup",
  zodValidater(userSchemas.signupSchema),
  async (req, res) => {
    try {
      // Check if the username or email already exists
      const EmailAlreadyExists = await Mydb.select()
        .from(users)
        .where(eq(users.email, req.body.email));
      if (EmailAlreadyExists.length > 0) {
        return res.status(400).send("User already exists with this email ");
      }
      // check if username already exists
      const UserNameAlreadyExists = await Mydb.select()
        .from(users)
        .where(eq(users.username, req.body.username));
      if (UserNameAlreadyExists.length > 0) {
        return res.status(400).send("User already exists with this username");
      }
      const hashedPassword = await bcrypt.hash(req.body.password.trim(), 10);
      const otp = Math.floor(100000 + Math.random() * 900000);
      const newUser = await Mydb.insert(users)
        .values({
          username: req.body.username.trim(),
          email: req.body.email.trim(),
          passwordHash: hashedPassword,
          otp: otp,
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          isEmailVerified: users.isEmailVerified,
        });
      if (newUser.length === 0) {
        return res.status(500).send("Failed to create user");
      }
      res.cookie("token", generateToken(newUser[0].id), {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res
        .status(200)
        .json({ message: "Registration successful", user: newUser[0] });

      await sendOtpMail(newUser[0].email, otp);
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/auth/login",
  zodValidater(userSchemas.loginSchema),
  async (req, res) => {
    try {
      const user = await Mydb.select({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
        isEmailVerified: users.isEmailVerified,
        passwordHash: users.passwordHash,
      })
        .from(users)
        .where(eq(users.username, req.body.username));

      if (user.length === 0) {
        return res.status(400).send("Invalid Username");
      }
      const isMatch = await bcrypt.compare(
        req.body.password,
        user[0].passwordHash as string
      );
      if (!isMatch) {
        return res.status(400).send("Invalid Password");
      }
      res.cookie("token", generateToken(user[0].id), {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user[0].id,
          email: user[0].email,
          username: user[0].username,
          name: user[0].name,
          avatar: user[0].avatar,
          isEmailVerified: user[0].isEmailVerified,
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post("/auth/logout", authenticateToken, (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 0,
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/auth/getuser", authenticateToken, async (req, res) => {
  try {
    const user = await Mydb.select({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      avatar: users.avatar,
      isEmailVerified: users.isEmailVerified,
    })
      .from(users)
      .where(eq(users.id, req.userId));
    if (user.length !== 0) {
      return res.status(200).json({
        message: "User is logged in",
        user: user[0],
      });
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    console.error("Error in /checkUser route:", error);
    res.status(500).send("Internal server error");
  }
});

router.post("/auth/verifyOtp", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || typeof otp !== "number") {
      return res.status(400).send("Invalid OTP");
    }

    const user = await Mydb.select()
      .from(users)
      .where(eq(users.id, req.userId));

    if (user.length === 0) {
      return res.status(400).send("Invalid OTP or user not found");
    }

    // Update user's email verification status
    const verifiedUser = await Mydb.update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.id, user[0].id))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
        isEmailVerified: users.isEmailVerified,
      });

    res
      .status(200)
      .json({ message: "OTP verified successfully", user: verifiedUser[0] });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/sendOtp", authenticateToken, async (req: any, res: any) => {
  try {
    const { userId } = req;
    // const otp = Math.floor(100000 + Math.random() * 900000);
    const user = await Mydb.update(users)
      .set({
        otp: Math.floor(100000 + Math.random() * 900000),
      })
      .where(eq(users.id, userId))
      .returning({
        otp: users.otp,
        email: users.email,
      });

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = user[0].otp;

    res.status(200).json({
      message: "OTP sent successfully",
    });
    otp && (await sendOtpMail(user[0].email, otp));
  } catch (error) {
    console.error("❌ Error in /sendOtp:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get(
  "/getPostsToExplore",
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const timeFilter = req.query.timeFilter || "All Time";
      const sort = req.query.sort || "New";
      const tags = req.query.tags
        ? (req.query.tags as string).split(",").filter(Boolean)
        : [];

      if (page < 1) {
        return res.status(400).json({ message: "Page must be greater than 0" });
      }
      if (limit < 1 || limit > 100) {
        return res
          .status(400)
          .json({ message: "Limit must be between 1 and 100" });
      }

      const offset = (page - 1) * limit;

      // Redis Caching: only for page 1
      const isCacheable = page === 1;
      const cacheKey = `explore:${sort}:${timeFilter}:${
        tags.join(",") || "all"
      }`;

      if (isCacheable) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log("🔁 Returning cached explore data");
          return res.status(200).json(JSON.parse(cached));
        }
      }

      let whereConditions: any[] = [];

      if (timeFilter !== "All Time") {
        const now = new Date();
        let timeThreshold: Date;

        switch (timeFilter) {
          case "Last 24 Hours":
            timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "Last Week":
            timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "Last Month":
            timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "Last Year":
            timeThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            timeThreshold = new Date(0);
        }

        whereConditions.push(gte(posts.createdAt, timeThreshold));
      }

      let filteredPostIds: string[] = [];
      if (tags.length > 0) {
        const tagRecords = await Mydb.query.tags.findMany({
          where: inArray(tags.name, tags),
        });
        const tagIds = tagRecords.map((t) => t.id);
        if (tagIds.length > 0) {
          const postTagRecords = await Mydb.query.postTags.findMany({
            where: inArray(postTags.tagId, tagIds),
            columns: { postId: true },
          });
          filteredPostIds = postTagRecords.map((pt) => pt.postId);
          if (filteredPostIds.length > 0) {
            whereConditions.push(inArray(posts.id, filteredPostIds));
          } else {
            return res.status(200).json({
              message: "Posts fetched successfully",
              posts: [],
              pagination: {
                currentPage: page,
                totalPages: 0,
                totalItems: 0,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            });
          }
        }
      }

      const totalPosts = await Mydb.query.posts.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      });

      let postsData;

      if (sort === "New") {
        postsData = await Mydb.query.posts.findMany({
          where:
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          limit,
          offset,
          orderBy: [desc(posts.createdAt)],
          with: {
            user: {
              columns: {
                username: true,
                name: true,
                avatar: true,
              },
            },
            images: {
              columns: {
                imageUrl: true,
              },
            },
            tags: {
              with: {
                tag: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        });
      } else {
        const baseQuery = Mydb.select({
          id: posts.id,
          description: posts.description,
          createdAt: posts.createdAt,
          userId: posts.userId,
          likesCount: sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0)`.mapWith(
            Number
          ),
          commentsCount:
            sql`COALESCE(COUNT(DISTINCT ${comments.id}), 0)`.mapWith(Number),
        })
          .from(posts)
          .leftJoin(likes, eq(posts.id, likes.postId))
          .leftJoin(comments, eq(posts.id, comments.postId))
          .where(
            whereConditions.length > 0 ? and(...whereConditions) : undefined
          )
          .groupBy(posts.id, posts.description, posts.createdAt, posts.userId);

        let sortedPosts;
        switch (sort) {
          case "Top":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0)`),
                desc(posts.createdAt)
              )
              .limit(limit)
              .offset(offset);
            break;
          case "Hot":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`
                  CASE 
                    WHEN EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600 > 0 
                    THEN COALESCE(COUNT(DISTINCT ${likes.userId}), 0) / (EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600)
                    ELSE COALESCE(COUNT(DISTINCT ${likes.userId}), 0) * 1000
                  END
                `),
                desc(posts.createdAt)
              )
              .limit(limit)
              .offset(offset);
            break;
          case "Controversial":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`
                  CASE 
                    WHEN COALESCE(COUNT(DISTINCT ${likes.userId}), 0) > 0 
                    THEN COALESCE(COUNT(DISTINCT ${comments.id}), 0)::float / COALESCE(COUNT(DISTINCT ${likes.userId}), 1)::float
                    ELSE COALESCE(COUNT(DISTINCT ${comments.id}), 0)
                  END
                `),
                desc(
                  sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0) + COALESCE(COUNT(DISTINCT ${comments.id}), 0)`
                )
              )
              .limit(limit)
              .offset(offset);
            break;
        }

        const postIds = sortedPosts.map((p) => p.id);
        postsData = await Mydb.query.posts.findMany({
          where: inArray(posts.id, postIds),
          with: {
            user: {
              columns: {
                username: true,
                name: true,
                avatar: true,
              },
            },
            images: {
              columns: {
                imageUrl: true,
              },
            },
            tags: {
              with: {
                tag: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        const postOrderMap = new Map(
          sortedPosts.map((p, index) => [p.id, index])
        );
        postsData.sort(
          (a, b) => postOrderMap.get(a.id)! - postOrderMap.get(b.id)!
        );
      }

      const postIds = postsData.map((p) => p.id);

      const likesCounts = await Mydb.select({
        postId: likes.postId,
        count: sql`COUNT(*)`.mapWith(Number),
      })
        .from(likes)
        .where(inArray(likes.postId, postIds))
        .groupBy(likes.postId);

      const commentsCounts = await Mydb.select({
        postId: comments.postId,
        count: sql`COUNT(*)`.mapWith(Number),
      })
        .from(comments)
        .where(inArray(comments.postId, postIds))
        .groupBy(comments.postId);

      const likesCountMap = new Map(
        likesCounts.map((l) => [l.postId, l.count])
      );
      const commentsCountMap = new Map(
        commentsCounts.map((c) => [c.postId, c.count])
      );

      const postsWithCounts = postsData.map((post) => ({
        ...post,
        likeCount: likesCountMap.get(post.id) || 0,
        commentCount: commentsCountMap.get(post.id) || 0,
      }));

      const totalItems = totalPosts.length;
      const totalPages = Math.ceil(totalItems / limit);

      const responsePayload = {
        message: "Posts fetched successfully",
        posts: postsWithCounts,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit,
        },
      };

      if (isCacheable) {
        await redis.set(cacheKey, JSON.stringify(responsePayload), { EX: 300 }); // 5 minutes
        console.log("📦 Cached explore data in Redis");
      }

      return res.status(200).json(responsePayload);
    } catch (error) {
      console.error("Error fetching posts:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get(
  "/getPostsByTag/:tagName",
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const tagName = req.params.tagName;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const timeFilter = req.query.timeFilter || "All Time";
      const sort = req.query.sort || "New";

      if (page < 1) {
        return res.status(400).json({ message: "Page must be greater than 0" });
      }
      if (limit < 1 || limit > 100) {
        return res
          .status(400)
          .json({ message: "Limit must be between 1 and 100" });
      }

      const offset = (page - 1) * limit;

      const tag = await Mydb.query.tags.findFirst({
        where: eq(tags.name, tagName),
      });

      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }

      const allPostIds = await Mydb.query.postTags.findMany({
        where: eq(postTags.tagId, tag.id),
        columns: { postId: true },
      });

      if (allPostIds.length === 0) {
        return res.status(200).json({
          message: "Posts fetched successfully",
          posts: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }

      const allPostIdList = allPostIds.map((pt) => pt.postId);
      let whereConditions: any[] = [inArray(posts.id, allPostIdList)];

      // Time filter logic
      if (timeFilter !== "All Time") {
        const now = new Date();
        let timeThreshold: Date;

        switch (timeFilter) {
          case "Last 24 Hours":
            timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "Last Week":
            timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "Last Month":
            timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "Last Year":
            timeThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            timeThreshold = new Date(0);
        }
        whereConditions.push(gte(posts.createdAt, timeThreshold));
      }

      const filteredPosts = await Mydb.query.posts.findMany({
        where: and(...whereConditions),
        columns: { id: true },
      });

      const totalItems = filteredPosts.length;

      let postsWithTag;

      if (sort === "New") {
        postsWithTag = await Mydb.query.posts.findMany({
          where: and(...whereConditions),
          limit: limit,
          offset: offset,
          orderBy: [desc(posts.createdAt)],
          with: {
            user: {
              columns: {
                username: true,
                name: true,
                avatar: true,
              },
            },
            images: {
              columns: {
                imageUrl: true,
              },
            },
            tags: {
              with: {
                tag: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        });
      } else {
        // Custom sorting queries for Top, Hot, Controversial
        const baseQuery = Mydb.select({
          id: posts.id,
          description: posts.description,
          createdAt: posts.createdAt,
          userId: posts.userId,
          likesCount: sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0)`.mapWith(
            Number
          ),
          commentsCount:
            sql`COALESCE(COUNT(DISTINCT ${comments.id}), 0)`.mapWith(Number),
        })
          .from(posts)
          .leftJoin(likes, eq(posts.id, likes.postId))
          .leftJoin(comments, eq(posts.id, comments.postId))
          .where(and(...whereConditions))
          .groupBy(posts.id, posts.description, posts.createdAt, posts.userId);

        let sortedPosts;
        switch (sort) {
          case "Top":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0)`),
                desc(posts.createdAt)
              )
              .limit(limit)
              .offset(offset);
            break;
          case "Hot":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`
                  CASE 
                    WHEN EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600 > 0 
                    THEN COALESCE(COUNT(DISTINCT ${likes.userId}), 0) / (EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600)
                    ELSE COALESCE(COUNT(DISTINCT ${likes.userId}), 0) * 1000
                  END
                `),
                desc(posts.createdAt)
              )
              .limit(limit)
              .offset(offset);
            break;
          case "Controversial":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`
                  CASE 
                    WHEN COALESCE(COUNT(DISTINCT ${likes.userId}), 0) > 0 
                    THEN COALESCE(COUNT(DISTINCT ${comments.id}), 0)::float / COALESCE(COUNT(DISTINCT ${likes.userId}), 1)::float
                    ELSE COALESCE(COUNT(DISTINCT ${comments.id}), 0)
                  END
                `),
                desc(
                  sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0) + COALESCE(COUNT(DISTINCT ${comments.id}), 0)`
                )
              )
              .limit(limit)
              .offset(offset);
            break;
        }

        const postIds = sortedPosts.map((p) => p.id);

        postsWithTag = await Mydb.query.posts.findMany({
          where: inArray(posts.id, postIds),
          with: {
            user: {
              columns: {
                username: true,
                name: true,
                avatar: true,
              },
            },
            images: {
              columns: {
                imageUrl: true,
              },
            },
            tags: {
              with: {
                tag: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Maintain sort order
        const postOrderMap = new Map(
          sortedPosts.map((p, index) => [p.id, index])
        );
        postsWithTag.sort(
          (a, b) => postOrderMap.get(a.id)! - postOrderMap.get(b.id)!
        );
      }

      const postIds = postsWithTag.map((p) => p.id);

      // Get counts
      const likesCountRaw = await Mydb.select({
        postId: likes.postId,
        count: sql`count(*)`,
      })
        .from(likes)
        .where(inArray(likes.postId, postIds))
        .groupBy(likes.postId);

      const commentsCountRaw = await Mydb.select({
        postId: comments.postId,
        count: sql`count(*)`,
      })
        .from(comments)
        .where(inArray(comments.postId, postIds))
        .groupBy(comments.postId);

      const likesCountMap = new Map(
        likesCountRaw.map(({ postId, count }) => [postId, Number(count)])
      );
      const commentsCountMap = new Map(
        commentsCountRaw.map(({ postId, count }) => [postId, Number(count)])
      );

      const postsWithCounts = postsWithTag.map((post) => ({
        ...post,
        likesCount: likesCountMap.get(post.id) || 0,
        commentsCount: commentsCountMap.get(post.id) || 0,
      }));

      const totalPages = Math.ceil(totalItems / limit);

      return res.status(200).json({
        message: "Posts fetched successfully",
        posts: postsWithCounts,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit: limit,
        },
      });
    } catch (error) {
      console.error("Error in /getPostsByTag:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.get(
  "/getSearchedPosts/:searchQuery",
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const searchQuery = req.params.searchQuery.trim();
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const timeFilter = req.query.timeFilter || "All Time";
      const sort = req.query.sort || "New";

      if (page < 1) {
        return res.status(400).json({ message: "Page must be greater than 0" });
      }
      if (limit < 1 || limit > 100) {
        return res
          .status(400)
          .json({ message: "Limit must be between 1 and 100" });
      }

      const offset = (page - 1) * limit;

      let whereConditions: any[] = [
        sql`${posts.description} ILIKE ${"%" + searchQuery + "%"}`,
      ];

      // Time filter
      if (timeFilter !== "All Time") {
        const now = new Date();
        let timeThreshold: Date;
        switch (timeFilter) {
          case "Last 24 Hours":
            timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "Last Week":
            timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "Last Month":
            timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "Last Year":
            timeThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            timeThreshold = new Date(0);
        }
        whereConditions.push(gte(posts.createdAt, timeThreshold));
      }

      const filteredPosts = await Mydb.query.posts.findMany({
        where: and(...whereConditions),
        columns: { id: true },
      });

      const totalItems = filteredPosts.length;

      let postsFound;

      if (sort === "New") {
        postsFound = await Mydb.query.posts.findMany({
          where: and(...whereConditions),
          limit,
          offset,
          orderBy: [desc(posts.createdAt)],
          with: {
            user: {
              columns: { username: true, name: true, avatar: true },
            },
            images: {
              columns: { imageUrl: true },
            },
            tags: {
              with: {
                tag: {
                  columns: { name: true },
                },
              },
            },
          },
        });
      } else {
        const baseQuery = Mydb.select({
          id: posts.id,
          description: posts.description,
          createdAt: posts.createdAt,
          userId: posts.userId,
          likesCount: sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0)`.mapWith(
            Number
          ),
          commentsCount:
            sql`COALESCE(COUNT(DISTINCT ${comments.id}), 0)`.mapWith(Number),
        })
          .from(posts)
          .leftJoin(likes, eq(posts.id, likes.postId))
          .leftJoin(comments, eq(posts.id, comments.postId))
          .where(and(...whereConditions))
          .groupBy(posts.id, posts.description, posts.createdAt, posts.userId);

        let sortedPosts;
        switch (sort) {
          case "Top":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0)`),
                desc(posts.createdAt)
              )
              .limit(limit)
              .offset(offset);
            break;
          case "Hot":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`
                  CASE 
                    WHEN EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600 > 0 
                    THEN COALESCE(COUNT(DISTINCT ${likes.userId}), 0) / (EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600)
                    ELSE COALESCE(COUNT(DISTINCT ${likes.userId}), 0) * 1000
                  END
                `),
                desc(posts.createdAt)
              )
              .limit(limit)
              .offset(offset);
            break;
          case "Controversial":
            sortedPosts = await baseQuery
              .orderBy(
                desc(sql`
                  CASE 
                    WHEN COALESCE(COUNT(DISTINCT ${likes.userId}), 0) > 0 
                    THEN COALESCE(COUNT(DISTINCT ${comments.id}), 0)::float / COALESCE(COUNT(DISTINCT ${likes.userId}), 1)::float
                    ELSE COALESCE(COUNT(DISTINCT ${comments.id}), 0)
                  END
                `),
                desc(
                  sql`COALESCE(COUNT(DISTINCT ${likes.userId}), 0) + COALESCE(COUNT(DISTINCT ${comments.id}), 0)`
                )
              )
              .limit(limit)
              .offset(offset);
            break;
        }

        const postIds = sortedPosts.map((p) => p.id);

        postsFound = await Mydb.query.posts.findMany({
          where: inArray(posts.id, postIds),
          with: {
            user: {
              columns: { username: true, name: true, avatar: true },
            },
            images: {
              columns: { imageUrl: true },
            },
            tags: {
              with: {
                tag: {
                  columns: { name: true },
                },
              },
            },
          },
        });

        const orderMap = new Map(sortedPosts.map((p, i) => [p.id, i]));
        postsFound.sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);
      }

      const postIds = postsFound.map((p) => p.id);

      const likesCountRaw = await Mydb.select({
        postId: likes.postId,
        count: sql`count(*)`,
      })
        .from(likes)
        .where(inArray(likes.postId, postIds))
        .groupBy(likes.postId);

      const commentsCountRaw = await Mydb.select({
        postId: comments.postId,
        count: sql`count(*)`,
      })
        .from(comments)
        .where(inArray(comments.postId, postIds))
        .groupBy(comments.postId);

      const likesCountMap = new Map(
        likesCountRaw.map(({ postId, count }) => [postId, Number(count)])
      );
      const commentsCountMap = new Map(
        commentsCountRaw.map(({ postId, count }) => [postId, Number(count)])
      );

      const postsWithCounts = postsFound.map((post) => ({
        ...post,
        likesCount: likesCountMap.get(post.id) || 0,
        commentsCount: commentsCountMap.get(post.id) || 0,
      }));

      const totalPages = Math.ceil(totalItems / limit);

      return res.status(200).json({
        message: "Searched posts fetched successfully",
        posts: postsWithCounts,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit,
        },
      });
    } catch (error) {
      console.error("❌ Error in /getSearchedPosts:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);




export default router;
