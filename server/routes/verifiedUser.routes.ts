import { Router } from "express";
import { authenticateVerifiedUserToken } from "../middlewares/jwtauth";
import { Mydb } from "../drizzle/db";
import { friendRequests, likes, users } from "../drizzle/schema";
import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { saveImgOnDisk } from "../middlewares/multer.middleware";
import { uploadOnCloudinary } from "../functions/imageUploader";
import fs from "fs";
import { posts } from "../drizzle/schema";
import { postImages } from "../drizzle/schema";
import { postTags } from "../drizzle/schema";
import { tags } from "../drizzle/schema";
import { comments } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { sendMilestoneMail } from "../functions/mailer";
const router = Router();

router.use(authenticateVerifiedUserToken);

router.post(
  "/addNewPost",
  saveImgOnDisk.array("images"), // multer handles multiple images
  async (req: any, res: any) => {
    try {
      const { description, tags: userTags } = req.body;
      const tagArray = JSON.parse(userTags || "[]");

      const newPost = await Mydb.insert(posts)
        .values({
          userId: req.verifiedUser.id,
          description: description.trim(),
        })
        .returning({
          postId: posts.id,
        });

      console.log("🏷️ Tags:", userTags);

      // Handle image upload to Cloudinary
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }

      const imageUploadPromises = req.files.map(async (file) => {
        const filePath = file.path;
        const cloudUrl = await uploadOnCloudinary(filePath);

        // Cleanup local temp file
        fs.unlinkSync(filePath);

        return cloudUrl;
      });

      const imageUrls = await Promise.all(imageUploadPromises);

      console.log("✅ Uploaded Image URLs:", imageUrls);

      for (const imageUrl of imageUrls) {
        await Mydb.insert(postImages).values({
          postId: newPost[0].postId,
          imageUrl: imageUrl,
        });
      }

      for (const tag of tagArray) {
        // Check if tag exists, if not create it
        const existingTag = await Mydb.select({
          tagId: tags.id,
        })
          .from(tags)
          .where(eq(tags.name, tag.trim().toLowerCase()))
          .limit(1);

        if (existingTag.length === 0) {
          // create new tag
          const newTag = await Mydb.insert(tags)
            .values({
              name: tag.trim().toLowerCase(),
            })
            .returning({
              tagId: tags.id,
            });
          const tagId = newTag[0].tagId;
          await Mydb.insert(postTags).values({
            postId: newPost[0].postId,
            tagId: tagId,
          });
        } else {
          // use existing tag
          const tagId = existingTag[0].tagId;
          await Mydb.insert(postTags).values({
            postId: newPost[0].postId,
            tagId: tagId,
          });
        }
      }

      console.log("✅ Post created successfully with ID:", newPost[0].postId);
      console.log("✅ Image URLs associated with post:", imageUrls);
      console.log("✅ Tags associated with post:", tagArray);

      return res.status(200).json({
        message: "Post created successfully",
        postId: newPost[0].postId,
        imageUrls: imageUrls,
        tags: tagArray,
      });
    } catch (error) {
      console.error("❌ Error in /addNewPost:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.get("/getYourPosts", async (req: any, res: any) => {
  try {
    const userId = req.verifiedUser.id;
    const postsWithExtras = await Mydb.query.posts.findMany({
      where: (posts, { eq }) => eq(posts.userId, userId),
      with: {
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

    res.status(200).json({
      message: "Your posts fetched successfully",
      posts: postsWithExtras,
    });
  } catch (error) {
    console.error("❌ Error in /getYourPosts:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/deletePost", async (req: any, res: any) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    // Delete the post
    const deletedPost = await Mydb.delete(posts)
      .where(eq(posts.id, postId))
      .returning({
        id: posts.id,
      });
    if (deletedPost.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    console.log("✅ Post deleted successfully with ID:", postId);
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("❌ Error in /deletePost:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/getFullUserData", async (req: any, res: any) => {
  try {
    const userId = req.verifiedUser.id;

    // Get user data
    const generalUserData = await Mydb.select({
      aboutMe: users.aboutMe,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(eq(users.id, userId));

    // Get user posts count
    const postsCount = await Mydb.select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, userId));

    // Get user friends count
    const friendsCount = await Mydb.select({ count: count() })
      .from(friendRequests)
      .where(
        and(
          or(
            eq(friendRequests.fromUser, userId),
            eq(friendRequests.toUser, userId)
          ),
          eq(friendRequests.status, "accepted")
        )
      );

    return res.status(200).json({
      message: "User data fetched successfully",
      userData: {
        aboutMe: generalUserData[0]?.aboutMe || "",
        createdAt: generalUserData[0]?.createdAt || null,
        postsCount: postsCount[0]?.count || 0,
        friendsCount: friendsCount[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("❌ Error in /getFullUserData:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put(
  "/updateAvatar",
  saveImgOnDisk.single("image"),
  async (req: any, res: any) => {
    try {
      const userId = req.verifiedUser.id;
      const localFilePath = req.file?.path;
      if (!localFilePath) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
      console.log(cloudinaryResponse);
      // Update user avatar in the database
      const updatedUser = await Mydb.update(users)
        .set({
          avatar: cloudinaryResponse,
        })
        .where(eq(users.id, userId))
        .returning({
          avatar: users.avatar,
        });
      if (updatedUser.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({
        message: "Avatar updated successfully",
        avatar: updatedUser[0].avatar,
      });
    } catch (error) {
      console.error("Error in /saveImg route:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/searchUser", async (req: any, res: any) => {
  try {
    const rawQuery = req.query.query;
    const query =
      typeof rawQuery === "string" ? rawQuery.trim().toLowerCase() : "";
    const user = req.verifiedUser;

    if (!query) {
      return res.status(400).json({ message: "Invalid search query" });
    }

    // 1. Get search results (fuzzy match)
    const searchResults = await Mydb.execute(
      sql`
        SELECT id, username, name, "avatar" as avatar
        FROM users
        WHERE id != ${user.id}
        AND (
          similarity(lower(username), ${query}) > 0.2
          OR similarity(lower(name), ${query}) > 0.2
        )
        ORDER BY GREATEST(
          similarity(lower(username), ${query}),
          similarity(lower(name), ${query})
        ) DESC
      `
    );

    if (searchResults.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // 2. Get friend request statuses in both directions
    const userIds = searchResults.map((u: any) => u.id);
    const friendStatuses = await Mydb.select({
      fromUser: friendRequests.fromUser,
      toUser: friendRequests.toUser,
      status: friendRequests.status,
    })
      .from(friendRequests)
      .where(
        or(
          and(
            eq(friendRequests.fromUser, user.id),
            inArray(friendRequests.toUser, userIds)
          ),
          and(
            eq(friendRequests.toUser, user.id),
            inArray(friendRequests.fromUser, userIds)
          )
        )
      );

    // 3. Build status map
    const statusMap = new Map<string, string>();

    for (const req of friendStatuses) {
      const otherUserId = req.fromUser === user.id ? req.toUser : req.fromUser;
      const isSentByUser = req.fromUser === user.id;

      const current = statusMap.get(otherUserId);

      if (req.status === "accepted") {
        statusMap.set(otherUserId, "accepted");
      } else if (req.status === "pending" && isSentByUser) {
        if (!current) statusMap.set(otherUserId, "sent");
      } else if (req.status === "rejected" && isSentByUser) {
        if (!current) statusMap.set(otherUserId, "rejected");
      }
    }

    // 4. Add status to each user
    const resultsWithStatus = searchResults.map((u: any) => ({
      ...u,
      status: statusMap.get(u.id) || "not_sent",
    }));

    return res.status(200).json({
      message: "Users found",
      searchResults: resultsWithStatus,
    });
  } catch (error) {
    console.error("❌ Error in /searchUser:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/sendFriendRequest", async (req: any, res: any) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.verifiedUser.id;

    if (!toUserId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if the friend request already exists
    const existingRequest = await Mydb.select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.fromUser, fromUserId),
          eq(friendRequests.toUser, toUserId)
        )
      );

    if (existingRequest.length > 0) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Create a new friend request
    await Mydb.insert(friendRequests).values({
      fromUser: fromUserId,
      toUser: toUserId,
      status: "pending",
    });

    return res
      .status(200)
      .json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("❌ Error in /sendFriendRequest:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/getFriendRequests", async (req: any, res: any) => {
  try {
    const userId = req.verifiedUser.id;

    // Fetch friend requests with sender details (fromUser)
    const requests = await Mydb.query.friendRequests.findMany({
      where: (friendRequests, { eq, and }) =>
        and(
          eq(friendRequests.toUser, userId),
          eq(friendRequests.status, "pending")
        ),
      with: {
        fromUser: {
          columns: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json({ message: "Friend requests fetched successfully", requests });
  } catch (error) {
    console.error("❌ Error in /getFriendRequests:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/acceptFriendRequest", async (req: any, res: any) => {
  try {
    const { requestId } = req.body;
    const userId = req.verifiedUser.id;
    if (!requestId) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    // check if the request exists
    const request = await Mydb.select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.toUser, userId),
          eq(friendRequests.status, "pending")
        )
      );
    if (request.length === 0) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    // Update the request status to accepted
    const updatedRequest = await Mydb.update(friendRequests)
      .set({ status: "accepted" })
      .where(eq(friendRequests.id, requestId))
      .returning({
        id: friendRequests.id,
        userId: friendRequests.toUser,
        friendId: friendRequests.fromUser,
      });

    if (updatedRequest.length === 0) {
      return res.status(400).json({ message: "Failed to accept request" });
    }

    // delete the rejected request if it exists
    await Mydb.delete(friendRequests).where(
      and(
        or(
          and(
            eq(friendRequests.fromUser, updatedRequest[0].friendId),
            eq(friendRequests.toUser, updatedRequest[0].userId)
          ),
          and(
            eq(friendRequests.fromUser, updatedRequest[0].userId),
            eq(friendRequests.toUser, updatedRequest[0].friendId)
          )
        ),
        eq(friendRequests.status, "rejected")
      )
    );

    return res.status(200).json({
      message: "Friend request accepted successfully",
      requestId: updatedRequest[0].id,
    });
  } catch (error) {
    console.error("❌ Error in /acceptFriendRequest:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/declineFriendRequest", async (req: any, res: any) => {
  try {
    const { requestId } = req.body;
    const userId = req.verifiedUser.id;
    if (!requestId) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    // check if the request exists
    const request = await Mydb.select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.toUser, userId),
          eq(friendRequests.status, "pending")
        )
      );
    if (request.length === 0) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    // Update the request status to accepted
    const updatedRequest = await Mydb.update(friendRequests)
      .set({ status: "rejected" })
      .where(eq(friendRequests.id, requestId))
      .returning({
        id: friendRequests.id,
      });

    if (updatedRequest.length === 0) {
      return res.status(400).json({ message: "Failed to accept request" });
    }

    return res.status(200).json({
      message: "Friend request accepted successfully",
      requestId: updatedRequest[0].id,
    });
  } catch (error) {
    console.error("❌ Error in /acceptFriendRequest:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/removeFriend", async (req: any, res: any) => {
  try {
    const { friendId } = req.body;
    const userId = req.verifiedUser.id;

    if (!friendId) {
      return res.status(400).json({ message: "Invalid friend ID" });
    }

    const deletedRequest = await Mydb.delete(friendRequests)
      .where(
        and(
          or(
            and(
              eq(friendRequests.fromUser, userId),
              eq(friendRequests.toUser, friendId)
            ),
            and(
              eq(friendRequests.fromUser, friendId),
              eq(friendRequests.toUser, userId)
            )
          ),
          eq(friendRequests.status, "accepted")
        )
      )
      .returning({
        id: friendRequests.id,
      });

    if (deletedRequest.length === 0) {
      return res.status(404).json({ message: "Friend not found" });
    }

    return res.status(200).json({
      message: "Friend removed successfully",
      requestId: deletedRequest[0].id,
    });
  } catch (error) {
    console.error("❌ Error in /removeFriend:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/updateProfile", async (req: any, res: any) => {
  try {
    const { name, newPassword, bio } = req.body;
    const user = req.verifiedUser;
    if (!name && !newPassword && !bio) {
      return res.status(400).json({ message: "No fields to update" });
    }
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    // update user profile
    const updatedUser = await Mydb.update(users)
      .set({
        name: name.trim() ? name.trim() : user.name,
        passwordHash: newPassword.trim() ? hashedPassword : user.password,
        aboutMe: bio.trim() ? bio.trim() : user.aboutMe,
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        aboutMe: users.aboutMe,
      });
    if (updatedUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("❌ Error in /updateProfile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/getFriendPosts", async (req: any, res: any) => {
  try {
    const userId = req.verifiedUser.id;
    const oneDayAgoISO = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const result = await Mydb.execute(sql`
      SELECT 
        p."id",
        p."userId",
        p."description",
        p."createdAt",
        u."avatar",
        u."username",
        u."name",
        u."id" AS "userId",
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT pi."imageUrl"), NULL) AS "imageUrls",
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT t."name"), NULL) AS "tags",
        COUNT(DISTINCT l."userId") AS "likeCount",
        -- 👇 Compute if current user liked the post
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM "likes" l2 
            WHERE l2."postId" = p."id" AND l2."userId" = ${userId}
          )
          THEN true
          ELSE false
        END AS "isLiked"
      FROM "posts" p
      JOIN "users" u ON u."id" = p."userId"
      JOIN "friendRequests" fr
        ON (
          (fr."fromUser" = ${userId} AND fr."toUser" = p."userId") OR
          (fr."toUser" = ${userId} AND fr."fromUser" = p."userId")
        )
      LEFT JOIN "postImages" pi ON pi."postId" = p."id"
      LEFT JOIN "postTags" pt ON pt."postId" = p."id"
      LEFT JOIN "tags" t ON t."id" = pt."tagId"
      LEFT JOIN "likes" l ON l."postId" = p."id"
      WHERE fr."status" = 'accepted'
        AND p."createdAt" > ${oneDayAgoISO}
      GROUP BY 
        p."id", p."userId", p."description", p."createdAt", 
        u."avatar", u."username", u."name", u."id"
      ORDER BY p."createdAt" DESC;
    `);

    return res.status(200).json({
      message: "Friend posts fetched successfully",
      posts: result,
    });
  } catch (error) {
    console.error("❌ Error in /getFriendPosts:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/getComments/:postId", async (req: any, res: any) => {
  try {
    const postId = req.params.postId;
    if (!postId) {
      return res.status(400).json({ message: "No post ID" });
    }

    // Fetch comments for the post
    const comments = await Mydb.query.posts.findMany({
      where: (posts, { eq }) => eq(posts.id, postId),
      columns: {
        id: true,
      },
      with: {
        comments: {
          columns: {
            id: true,
            parentId: true,
            content: true,
            createdAt: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (comments.length === 0 || !comments[0].comments) {
      return res.status(404).json({ message: "Post not found or no comments" });
    }

    return res.status(200).json({
      message: "Comments fetched successfully",
      comments: comments,
    });

    if (comments.length === 0) {
      return res.status(404).json({ message: "Post not found or no comments" });
    }

    return res.status(200).json({
      message: "Comments fetched successfully",
      comments: comments[0].comments,
    });
  } catch (error) {
    console.error("❌ Error in /getComments:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/getPost/:postId", async (req: any, res: any) => {
  try {
    const postId = req.params.postId;
    if (!postId) {
      return res.status(400).json({ message: "No post ID provided" });
    }

    // Fetch the post with its images, tags, and user details
    const post = await Mydb.query.posts.findFirst({
      where: (posts, { eq }) => eq(posts.id, postId),
      with: {
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
        user: {
          columns: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Fetch like count
    const likeCountResult = await Mydb.select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.postId, postId));

    const likeCount = likeCountResult[0]?.count ?? 0;

    // Fetch already liked status by the current user
    const alreadyLiked = await Mydb.select()
      .from(likes)
      .where(
        and(eq(likes.postId, postId), eq(likes.userId, req.verifiedUser.id))
      );
    const isLiked = alreadyLiked.length > 0;
    return res.status(200).json({
      message: "Post fetched successfully",
      post: {
        ...post,
        likeCount,
        isLiked,
      },
    });
  } catch (error) {
    console.error("❌ Error in /getPost:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/addComment", async (req: any, res: any) => {
  try {
    const { postId, content, parentId } = req.body;
    const userId = req.verifiedUser.id;

    if (!postId || !content) {
      return res
        .status(400)
        .json({ message: "Post ID and content are required" });
    }

    // Insert the comment into the database
    const newComment = await Mydb.insert(comments)
      .values({
        userId: userId,
        postId: postId,
        content: content.trim(),
        parentId: parentId || null, // Allow parentId to be optional
      })
      .returning({
        id: comments.id,
        userId: comments.userId,
        postId: comments.postId,
        content: comments.content,
        createdAt: comments.createdAt,
        parentId: comments.parentId,
      });
    if (newComment.length === 0) {
      return res.status(500).json({ message: "Failed to add comment" });
    }

    return res.status(201).json({
      message: "Comment added successfully",
      comment: newComment[0],
    });
  } catch (error) {
    console.error("❌ Error in /addComment:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/likePost/:postId", async (req: any, res: any) => {
  try {
    const postId = req.params.postId;
    const userId = req.verifiedUser.id;

    console.log("Like request for postId:", postId, "by userId:", userId);

    // Insert like
    const newLike = await Mydb.insert(likes)
      .values({
        postId: postId,
        userId: userId,
      })
      .returning({
        id: likes.userId,
      });

    if (newLike.length === 0) {
      return res.status(400).json({ message: "Failed to like post" });
    }

    // Count total likes for the post
    const [{ count }] = await Mydb.select({
      count: sql<number>`COUNT(*)`,
    })
      .from(likes)
      .where(sql`"postId" = ${postId}`);

    res.status(200).json({
      message: "Post liked successfully",
      totalLikes: count,
    });

    if (count == 1 || count == 100 || count == 1000) {
      console.log(`Milestone reached: ${count} likes for post ${postId}`);
      // get author with join
      const [result] = await Mydb.select({
        email: users.email,
        name: users.name,
        username: users.username,
      })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.id, postId));

      if (result?.email) {
        await sendMilestoneMail(
          result.email,
          result.name || result.username,
          postId,
          count
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in /likePost:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/unlikePost/:postId", async (req: any, res: any) => {
  try {
    const postId = req.params.postId;
    const userId = req.verifiedUser.id;

    // Delete like
    const deletedLike = await Mydb.delete(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
      .returning({
        id: likes.userId,
      });

    if (deletedLike.length === 0) {
      return res.status(400).json({ message: "Failed to unlike post" });
    }

    // Count total likes for the post
    const [{ count }] = await Mydb.select({
      count: sql<number>`COUNT(*)`,
    })
      .from(likes)
      .where(sql`"postId" = ${postId}`);

    res.status(200).json({
      message: "Post unliked successfully",
      totalLikes: count,
    });
  } catch (error) {
    console.error("❌ Error in /unlikePost:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Updated /getFriends route with pagination
router.get("/getFriends", async (req: any, res: any) => {
  try {
    const userId = req.verifiedUser.id;

    // Get pagination parameters from query string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get total count of friends using correct Drizzle syntax
    const totalCountResult = await Mydb.select({ count: count() })
      .from(friendRequests)
      .where(
        and(
          or(
            eq(friendRequests.fromUser, userId),
            eq(friendRequests.toUser, userId)
          ),
          eq(friendRequests.status, "accepted")
        )
      );

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated friends
    const friends = await Mydb.query.friendRequests.findMany({
      where: (friendRequests, { eq, and, or }) =>
        and(
          or(
            eq(friendRequests.fromUser, userId),
            eq(friendRequests.toUser, userId)
          ),
          eq(friendRequests.status, "accepted")
        ),
      with: {
        fromUser: {
          columns: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        toUser: {
          columns: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      limit: limit,
      offset: offset,
    });

    // Map to get only the friend details
    const friendList = friends.map((friend) => {
      return friend.fromUser.id === userId ? friend.toUser : friend.fromUser;
    });

    return res.status(200).json({
      message: "Friends fetched successfully",
      friends: friendList,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error in /getFriends:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});



router.get("/searchFriends/:query", async (req: any, res: any) => {
  try {
    const rawQuery = req.params.query;
    const query =
      typeof rawQuery === "string" ? rawQuery.trim().toLowerCase() : "";
    const user = req.verifiedUser;

    // Get pagination parameters from query string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: "Invalid search query" });
    }

    // Get total count for pagination metadata
    const countResult = await Mydb.execute(
      sql`
        SELECT COUNT(*) as total
        FROM "friendRequests" fr
        JOIN users u ON (
          (fr."fromUser" = ${user.id} AND fr."toUser" = u.id)
          OR
          (fr."toUser" = ${user.id} AND fr."fromUser" = u.id)
        )
        WHERE fr.status = 'accepted'
        AND (
          similarity(lower(u.username), ${query}) > 0.2
          OR similarity(lower(u.name), ${query}) > 0.2
        )
      `
    );

    const totalCount = parseInt(countResult[0]?.total || "0");
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const acceptedFriends = await Mydb.execute(
      sql`
        SELECT 
          u.id, u.username, u.name, u."avatar"
        FROM "friendRequests" fr
        JOIN users u ON (
          (fr."fromUser" = ${user.id} AND fr."toUser" = u.id)
          OR
          (fr."toUser" = ${user.id} AND fr."fromUser" = u.id)
        )
        WHERE fr.status = 'accepted'
        AND (
          similarity(lower(u.username), ${query}) > 0.2
          OR similarity(lower(u.name), ${query}) > 0.2
        )
        ORDER BY GREATEST(
          similarity(lower(u.username), ${query}),
          similarity(lower(u.name), ${query})
        ) DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    );

    if (acceptedFriends.length === 0 && page === 1) {
      return res.status(404).json({ message: "No matching friends found" });
    }

    return res.status(200).json({
      message: "Friends found",
      searchResults: acceptedFriends,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error in /searchFriends:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
