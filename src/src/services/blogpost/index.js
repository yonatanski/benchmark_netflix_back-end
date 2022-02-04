import express from "express" // 3RD PARTY MODULE DOES NEED TO INSTALL
import uniqid from "uniqid" // genertae unique id => 3RD PARTY MODULE DOES NEED TO INSTALL (npm i uniqid)
import { blogPostValidatioMiddlewares } from "./validation.js"
import { validationResult } from "express-validator"
import createHttpError from "http-errors"
import { readBlogPostJson, writeBlogPostJson, getBooksReadableStream } from "../../lib/fs-tools.js"
import { uploadFile, uploadAvatarFile } from "../../lib/fs-tools.js"
import multer from "multer" // it is middleware
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { pipeline } from "stream"
import { createGzip } from "zlib"
import json2csv from "json2csv"

import { getPDFReadableStream, generatePDFAsync } from "../../lib/pdf-tools.js"

const blogpostRouter = express.Router()

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary, // search automatically for process.env.CLOUDINARY_URL
    params: {
      folder: "blogpost",
    },
  }),
}).single("cover")

// ================================CREATING END POINT METHODS===========================

//1 *******POST******
blogpostRouter.post("/", blogPostValidatioMiddlewares, async (req, res, next) => {
  const errorList = validationResult(req)
  try {
    if (!errorList.isEmpty()) {
      // if we had validation errors -> we need to trigger bad request Error handler
      next(createHttpError(400, { errorList }))
    } else {
      const newBlogPost = { id: uniqid(), ...req.body, createdAt: new Date() }
      const BlogpostsJsonArray = await readBlogPostJson()
      BlogpostsJsonArray.push(newBlogPost)
      await writeBlogPostJson(BlogpostsJsonArray)
      res.status(201).send({ id: newBlogPost.id })
    }
  } catch (error) {
    next(error)
  }
})

//1 *******GET******
blogpostRouter.get("/", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()
    if (req.query && req.query.title) {
      const filterdAuthors = BlogpostsJsonArray.filter((blog) => blog.title == req.query.title)
      res.send(filterdAuthors)
    } else {
      res.send(BlogpostsJsonArray)
    }
  } catch (error) {
    next(error)
  }
})

// *******GET WITH ID******
blogpostRouter.get("/:id", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()

    const specficAuthor = BlogpostsJsonArray.find((blog) => blog.id == req.params.id)

    res.send(specficAuthor)
  } catch (error) {
    next(error)
  }
})

//1 **********PUT **************
blogpostRouter.put("/:id", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()
    const index = BlogpostsJsonArray.findIndex((blog) => blog.id === req.params.id) //findIndexToUpdate
    const blogpostToModify = BlogpostsJsonArray[index]
    const updateBlogpost = { ...blogpostToModify, ...req.body, updatedAt: new Date() }

    BlogpostsJsonArray[index] = updateBlogpost
    await writeBlogPostJson(BlogpostsJsonArray)
    res.send(updateBlogpost)
  } catch (error) {
    next(error)
  }
})

//1 *******DELETE******
blogpostRouter.delete("/:id", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()
    const remainingAuthors = BlogpostsJsonArray.filter((blog) => blog.id !== req.params.id)
    await writeBlogPostJson(remainingAuthors)
    res.status(204).send(`USER SUCCESSFULLY DELETED`)
  } catch (error) {
    next(error)
  }
})

// ===========================  for comment============================

blogpostRouter.put("/:id/comments", async (req, res, next) => {
  try {
    const { text, userName } = req.body
    const comment = { id: uniqid(), text, userName, createdAt: new Date() }
    const blogPostJson = await readBlogPostJson() //reading  blogPostJson is (array of object) =--> [{--},{--},{--},{--},{--}]
    const index = blogPostJson.findIndex((blog) => blog.id == req.params.id)
    // console.log("this is index", index)

    const blogToModify = blogPostJson[index]
    // console.log("this is index 2", bookToModify)
    blogToModify.comments = blogToModify.comments || []
    // const UpdatedReqBody = req.body // incoming change inputted by user from FE
    // console.log("this is req.body", UpdatedReqBody)

    const updatedBlog = { ...blogToModify, comments: [...blogToModify.comments, comment], updatedAt: new Date(), id: req.params.id } // union of two bodies
    // console.log("this is updateBook", updatedBlog)

    blogPostJson[index] = updatedBlog
    await writeBlogPostJson(blogPostJson)

    res.send(updatedBlog)
  } catch (error) {
    next(error)
  }
})
blogpostRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const blogPostJson = await readBlogPostJson() //reading  blogPostJson is (array of object) =--> [{--},{--},{--},{--},{--}]

    const singleBlog = blogPostJson.find((b) => b.id == req.params.id) //findindg the exact data needed
    console.log(singleBlog)

    singleBlog.comments = singleBlog.comments || []
    res.send(singleBlog.comments)
  } catch (error) {
    next(error)
  }
})
// ===========================//============================

// ===========================  for file upload============================
blogpostRouter.patch("/:id/uploadSingleCover", cloudinaryUploader, async (req, res, next) => {
  try {
    const blogPostJson = await readBlogPostJson()
    const index = blogPostJson.findIndex((blog) => blog.id == req.params.id)
    const blogToModify = blogPostJson[index]
    // const UpdatedReqBody = req.body
    const updatedBlog = { ...blogToModify, cover: req.file.path, updatedAt: new Date(), id: req.params.id }
    blogPostJson[index] = updatedBlog
    await writeBlogPostJson(blogPostJson)

    res.send(updatedBlog)
  } catch (error) {
    console.log(error)
  }
})

// blogpostRouter.patch("/:id/uploadSingleCover", multer().single("cover"), uploadFile, async (req, res, next) => {
//   try {
//     const blogPostJson = await readBlogPostJson() //reading  blogPostJson is (array of object) =--> [{--},{--},{--},{--},{--}]
//     const index = blogPostJson.findIndex((blog) => blog.id == req.params.id)
//     // console.log("this is index", index)

//     const blogToModify = blogPostJson[index]
//     // console.log("this is index 2", bookToModify)

//     const UpdatedReqBody = req.body // incoming change inputted by user from FE
//     // console.log("this is req.body", UpdatedReqBody)

//     const updatedBlog = { ...blogToModify, cover: req.file, updatedAt: new Date(), id: req.params.id } // union of two bodies
//     // console.log("this is updateBook", updatedBlog)

//     blogPostJson[index] = updatedBlog
//     await writeBlogPostJson(blogPostJson)

//     res.send(updatedBlog)
//   } catch (error) {
//     next(error)
//   }
// })

blogpostRouter.put("/:id/uploadSingleAvatar", multer().single("avatar"), uploadAvatarFile, async (req, res, next) => {
  try {
    const blogPostJson = await readBlogPostJson() //array  json read//array json file reading
    const index = blogPostJson.findIndex((blog) => blog.id === req.params.id) //find index id matched with params
    const avatarlink = blogPostJson[index].author.name
    console.log(avatarlink)
    const updateAuthor = { ...blogPostJson[index], author: { name: avatarlink, avatar: req.file }, updatedAt: new Date(), id: req.params.id }
    blogPostJson[index] = updateAuthor
    await writeBlogPostJson(blogPostJson) //write//write
    res.send(updateAuthor)
  } catch (error) {
    next(error)
  }
})

blogpostRouter.get("/:id/downloadPDF", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()

    const specficAuthor = BlogpostsJsonArray.find((blog) => blog.id == req.params.id)

    // res.send(specficAuthor)
    const source = await getPDFReadableStream(specficAuthor)
    res.setHeader("Content-Type", "application/pdf")
    pipeline(source, res, (err) => {
      if (err) {
        console.log(err)
        next(err)
      }
    })
    source.end()
  } catch (error) {
    next(error)
  }
})
blogpostRouter.get("/downloadJSON", (req, res, next) => {
  try {
    // SOURCE (file on disk, http requests,...) --> DESTINATION (file on disk, terminal, http responses,...)

    // In this example we are going to have: SOURCE (file on disk: books.json) --> DESTINATION (http response)

    res.setHeader("Content-Disposition", "attachment; filename=books.json.gz") // This header tells the browser to open the "Save file on Disk" dialog

    const source = getBooksReadableStream()
    console.log(source)
    const transform = createGzip()
    const destination = res

    pipeline(source, transform, destination, (err) => {
      if (err) next(err)
    })
  } catch (error) {
    next(error)
  }
})

blogpostRouter.get("/downloadCSV", (req, res, next) => {
  try {
    // SOURCE (books.json) --> TRANSFORM (csv) --> DESTINATION (res)

    res.setHeader("Content-Disposition", "attachment; filename=books.csv")

    const source = getBooksReadableStream()
    const transform = new json2csv.Transform({ fields: ["id", "category", "author", "content", "createdAt"] })
    const destination = res

    pipeline(source, transform, destination, (err) => {
      if (err) next(err)
    })
    res.send("ok")
  } catch (error) {
    next(error)
  }
})

blogpostRouter.get("/asyncPDF", async (req, res, next) => {
  try {
    const path = await generatePDFAsync("SOME TEXT")
    // await sendEmail({ attachment: path }) // if generation of PDF is NOT async, I'm not sure that on this line here the PDF has been generated completely and correctly. If we do not await for the pdf to be generated and we send an email with that file, the result could be a corrupted PDF file
    res.send({ path })
  } catch (error) {
    next(error)
  }
})

// ===========================  for PDF upload============================

export default blogpostRouter
