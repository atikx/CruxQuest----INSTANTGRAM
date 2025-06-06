import { Router } from "express";
import { authenticateVerifiedUserToken } from "../middlewares/jwtauth";
import { Mydb } from "../drizzle/db";
import { users } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { saveImgOnDisk } from "../middlewares/multer.middleware";
import { uploadOnCloudinary } from "../functions/imageUploader";
import fs from "fs";
import { posts } from "../drizzle/schema";
import { postImages } from "../drizzle/schema";
import { postTags } from "../drizzle/schema";
import { tags } from "../drizzle/schema";
import { sendOtpMail } from "../functions/mailer";
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



export default router;
