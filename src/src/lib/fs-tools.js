import fs, { write } from "fs-extra"
import { fileURLToPath } from "url"
import { dirname, join, extname } from "path"

const { readJSON, writeJSON, writeFile, createReadStream } = fs // they come from fs extra and destructuring here  fs.readJSON and fs.writeJSON

// =======================================finding daynamic path=======================================
const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), "../data")

const full_blogPost_JSONpath = join(dataFolderPath, "blogpost.json") // =====>this is the shortest way getting dynamic path of the "blogpost.json" path in difrent opreating system
const full_Authors_JSONpath = join(dataFolderPath, "authors.json")
const publicFolderPath = join(process.cwd(), "./public/img/blogpost")
// const blogPost_JSONpath = fileURLToPath(import.meta.url)

// const parentdirrctory = dirname(booksJSONPath)

// const full_blogPost_JSONpath = join(parentdirrctory, "book.json")

//=========FUNCTION TO READ AND WRITE THE JSON FILE===========
export const readBlogPostJson = () => readJSON(full_blogPost_JSONpath) // READING the json data and JSON.parse convert buffer to readable stream
export const writeBlogPostJson = (content) => writeJSON(full_blogPost_JSONpath, content) //writting on blogpost.json and stringfy as json mode

export const readAuthorJson = () => readJSON(full_Authors_JSONpath)
export const writeAuthorJson = (content) => writeJSON(full_Authors_JSONpath, content)

export const saveBlogPostPictures = (fileName, contentAsBuffer) => writeFile(join(publicFolderPath, fileName), contentAsBuffer)

export const getBooksReadableStream = () => createReadStream(full_blogPost_JSONpath)

export const uploadFile = (req, res, next) => {
  try {
    const { originalname, buffer } = req.file

    const extesnion = extname(originalname)
    const fileName = `${req.params.id}${extesnion}`

    const pathToFile = join(publicFolderPath, fileName)
    fs.writeFileSync(pathToFile, buffer)
    const link = `http://localhost:3004/${fileName}`
    req.file = link
    next()
    // console.log("from tools.js", req.file)
    // console.log(publicFolderPath)
    // res.send("ok")
  } catch (error) {
    next(error)
  }
}
export const uploadAvatarFile = (req, res, next) => {
  try {
    const { originalname, buffer } = req.file

    const extesnion = extname(originalname)
    const attachtoLink = "avatarimage"
    const fileName = `${req.params.id}${attachtoLink}${extesnion}`

    const pathToFile = join(publicFolderPath, fileName)
    fs.writeFileSync(pathToFile, buffer)
    const link = `http://localhost:3004/${fileName}`
    req.file = link
    next()
    // console.log("from tools.js", req.file)
    // console.log(publicFolderPath)
    // res.send("ok")
  } catch (error) {
    next(error)
  }
}
