import e, { Router } from "express";
import { authenticateVerifiedUserToken } from "../middlewares/jwtauth";
import { Mydb } from "../drizzle/db";
import { friendRequests, users } from "../drizzle/schema";
import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { saveImgOnDisk } from "../middlewares/multer.middleware";
import { uploadOnCloudinary } from "../functions/imageUploader";
import fs, { stat } from "fs";
import { posts } from "../drizzle/schema";
import { postImages } from "../drizzle/schema";
import { postTags } from "../drizzle/schema";
import { tags } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { sendOtpMail } from "../functions/mailer";
import { count } from "drizzle-orm";
import { create } from "domain";
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
        SELECT id, username, name, "profilePictureUrl" as avatar
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
        LIMIT 10
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
    const oneDayAgoISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const result = await Mydb.execute(sql`
      SELECT 
        p."id",
        p."userId",
        p."description",
        p."createdAt",
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT pi."imageUrl"), NULL) AS "imageUrls",
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT t."name"), NULL) AS "tags"
      FROM "posts" p
      JOIN "friendRequests" fr
        ON (
          (fr."fromUser" = ${userId} AND fr."toUser" = p."userId") OR
          (fr."toUser" = ${userId} AND fr."fromUser" = p."userId")
        )
      LEFT JOIN "postImages" pi ON pi."postId" = p."id"
      LEFT JOIN "postTags" pt ON pt."postId" = p."id"
      LEFT JOIN "tags" t ON t."id" = pt."tagId"
      WHERE fr."status" = 'accepted'
        AND p."createdAt" > ${oneDayAgoISO}
      GROUP BY p."id", p."userId", p."description", p."createdAt"
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


export default router;
