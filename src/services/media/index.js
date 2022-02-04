import express from "express" // 3RD PARTY MODULE DOES NEED TO INSTALL
import uniqid from "uniqid" // genertae unique id => 3RD PARTY MODULE DOES NEED TO INSTALL (npm i uniqid)
import { mediaValidatioMiddlewares } from "./validation.js"
import { validationResult } from "express-validator"
import createHttpError from "http-errors"
import { readMediaJson, writeMediatJson, getBooksReadableStream } from "../../lib/fs-tools.js"
import { uploadFile, uploadAvatarFile } from "../../lib/fs-tools.js"
import multer from "multer" // it is middleware
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { pipeline } from "stream"
import { createGzip } from "zlib"
import json2csv from "json2csv"

import { getPDFReadableStream, generatePDFAsync } from "../../lib/pdf-tools.js"

const mediaRouter = express.Router()

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary, // search automatically for process.env.CLOUDINARY_URL
    params: {
      folder: "netflix",
    },
  }),
}).single("poster")

// ================================CREATING END POINT METHODS===========================

//1 *******POST******
mediaRouter.post("/", mediaValidatioMiddlewares, async (req, res, next) => {
  const errorList = validationResult(req)
  try {
    if (!errorList.isEmpty()) {
      // if we had validation errors -> we need to trigger bad request Error handler
      next(createHttpError(400, { errorList }))
    } else {
      const newMedia = { ...req.body, imdbID: uniqid(), createdAt: new Date() }
      const mediaJsonArray = await readMediaJson()
      mediaJsonArray.push(newMedia)
      await writeMediatJson(mediaJsonArray)
      res.status(201).send({ imdbID: newMedia.imdbID })
    }
  } catch (error) {
    next(error)
  }
})

//1 *******GET******
mediaRouter.get("/", async (req, res, next) => {
  try {
    const mediaJsonArray = await readMediaJson()
    if (req.query && req.query.title) {
      const filterdMedia = mediaJsonArray.filter((blog) => blog.title == req.query.title)
      res.send(filterdMedia)
    } else {
      res.send(mediaJsonArray)
    }
  } catch (error) {
    next(error)
  }
})

// *******GET WITH ID******
mediaRouter.get("/:id", async (req, res, next) => {
  try {
    const mediaJsonArray = await readMediaJson()

    const specficMedia = mediaJsonArray.find((blog) => blog.id == req.params.id)

    res.send(specficMedia)
  } catch (error) {
    next(error)
  }
})

//1 **********PUT **************
mediaRouter.put("/:id", async (req, res, next) => {
  try {
    const mediaJsonArray = await readMediaJson()
    const index = mediaJsonArray.findIndex((blog) => blog.imdbID === req.params.id) //findIndexToUpdate
    const mediaToModify = mediaJsonArray[index]
    const updateBlogpost = { ...mediaToModify, ...req.body, updatedAt: new Date() }

    mediaJsonArray[index] = updateBlogpost
    await writeMediatJson(mediaJsonArray)
    res.send(updateBlogpost)
  } catch (error) {
    next(error)
  }
})

//1 *******DELETE******
mediaRouter.delete("/:id", async (req, res, next) => {
  try {
    const mediaJsonArray = await readMediaJson()
    const remainingMedias = mediaJsonArray.filter((blog) => blog.id !== req.params.id)
    await writeMediatJson(remainingMedias)
    res.status(204).send(`USER SUCCESSFULLY DELETED`)
  } catch (error) {
    next(error)
  }
})

// ===========================  for comment============================

mediaRouter.put("/:id/reviews", async (req, res, next) => {
  try {
    const { comment, rate } = req.body
    const review = { id: uniqid(), comment, rate, elementId: uniqid(), createdAt: new Date() }
    const mediaJsonArray = await readMediaJson() //reading  mediaJsonArray is (array of object) =--> [{--},{--},{--},{--},{--}]
    const index = mediaJsonArray.findIndex((blog) => blog.imdbID == req.params.id)
    // console.log("this is index", index)

    const mediaToModify = mediaJsonArray[index]
    // console.log("this is index 2", bookToModify)
    mediaToModify.reviews = mediaToModify.reviews || []
    // const UpdatedReqBody = req.body // incoming change inputted by user from FE
    // console.log("this is req.body", UpdatedReqBody)

    const updatedMedia = { ...mediaToModify, reviews: [...mediaToModify.reviews, review], updatedAt: new Date(), id: req.params.id } // union of two bodies
    // console.log("this is updateBook", updatedMedia)

    mediaJsonArray[index] = updatedMedia
    await writeMediatJson(mediaJsonArray)

    res.send(updatedMedia)
  } catch (error) {
    next(error)
  }
})
mediaRouter.get("/:id/reviews", async (req, res, next) => {
  try {
    const mediaJsonArray = await readMediaJson() //reading  mediaJsonArray is (array of object) =--> [{--},{--},{--},{--},{--}]

    const singleBlog = mediaJsonArray.find((b) => b.imdbID == req.params.id) //findindg the exact data needed
    console.log(singleBlog)

    singleBlog.reviews = singleBlog.reviews || []
    res.send(singleBlog.reviews)
  } catch (error) {
    next(error)
  }
})
// ===========================//============================

// ===========================  for file upload============================

mediaRouter.patch("/:id/poster", cloudinaryUploader, async (req, res, next) => {
  try {
    const mediaJsonArray = await readMediaJson()
    const index = mediaJsonArray.findIndex((media) => media.imdbID == req.params.id)
    const mediaToModify = mediaJsonArray[index]
    // const UpdatedReqBody = req.body
    const updatedMedia = { ...mediaToModify, Poster: req.file.path, updatedAt: new Date() }
    mediaJsonArray[index] = updatedMedia
    await writeMediatJson(mediaJsonArray)

    res.send(updatedMedia)
  } catch (error) {
    console.log(error)
  }
})

// mediaRouter.patch("/:id/uploadSingleCover", multer().single("cover"), uploadFile, async (req, res, next) => {
//   try {
//     const mediaJsonArray = await readMediaJson() //reading  mediaJsonArray is (array of object) =--> [{--},{--},{--},{--},{--}]
//     const index = mediaJsonArray.findIndex((blog) => blog.id == req.params.id)
//     // console.log("this is index", index)

//     const mediaToModify = mediaJsonArray[index]
//     // console.log("this is index 2", bookToModify)

//     const UpdatedReqBody = req.body // incoming change inputted by user from FE
//     // console.log("this is req.body", UpdatedReqBody)

//     const updatedMedia = { ...mediaToModify, cover: req.file, updatedAt: new Date(), id: req.params.id } // union of two bodies
//     // console.log("this is updateBook", updatedMedia)

//     mediaJsonArray[index] = updatedMedia
//     await writeMediatJson(mediaJsonArray)

//     res.send(updatedMedia)
//   } catch (error) {
//     next(error)
//   }
// })

mediaRouter.put("/:id/uploadSingleAvatar", multer().single("avatar"), uploadAvatarFile, async (req, res, next) => {
  try {
    const mediaJsonArray = await readMediaJson() //array  json read//array json file reading
    const index = mediaJsonArray.findIndex((blog) => blog.id === req.params.id) //find index id matched with params
    const avatarlink = mediaJsonArray[index].author.name
    console.log(avatarlink)
    const updateAuthor = { ...mediaJsonArray[index], author: { name: avatarlink, avatar: req.file }, updatedAt: new Date(), id: req.params.id }
    mediaJsonArray[index] = updateAuthor
    await writeMediatJson(mediaJsonArray) //write//write
    res.send(updateAuthor)
  } catch (error) {
    next(error)
  }
})

mediaRouter.get("/:id/downloadPDF", async (req, res, next) => {
  try {
    const mediaJsonArray = await readMediaJson()

    const specficAuthor = mediaJsonArray.find((blog) => blog.imdbID == req.params.id)

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
mediaRouter.get("/downloadJSON", (req, res, next) => {
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

mediaRouter.get("/downloadCSV", (req, res, next) => {
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

mediaRouter.get("/asyncPDF", async (req, res, next) => {
  try {
    const path = await generatePDFAsync("SOME TEXT")
    // await sendEmail({ attachment: path }) // if generation of PDF is NOT async, I'm not sure that on this line here the PDF has been generated completely and correctly. If we do not await for the pdf to be generated and we send an email with that file, the result could be a corrupted PDF file
    res.send({ path })
  } catch (error) {
    next(error)
  }
})

// ===========================  for PDF upload============================

export default mediaRouter
