import express from "express" // 3RD PARTY MODULE DOES NEED TO INSTALL
import fs from "fs" // CORE MODEL DOESNT NEED TO INSTALLED->fs means file system
import { fileURLToPath } from "url" // CORE MODEL DOESNT NEED TO INSTALLED->fs means file system
import { dirname, join } from "path" // CORE MODEL DOESNT NEED TO INSTALLED->fs means file system
import uniqid from "uniqid" // genertae unique id => 3RD PARTY MODULE DOES NEED TO INSTALL (npm i uniqid)

const authorsRouter = express.Router()

//                               *************************** HOW TO FIND OUT THE PATH FOR THIS JASON DATA ********************

const full_author_JSONpath = join(dirname(fileURLToPath(import.meta.url)), "author.json") // =====>this is the shortest way getting dynamic path of the "author.json" path in difrent opreating system
// const thisFilePath = fileURLToPath(import.meta.url)

// const parentDirctory = dirname(thisFilePath)

// const full_author_JSONpath = join(parentDirctory, "author.json")

const readAuthors = () => JSON.parse(fs.readFileSync(full_author_JSONpath))
const writeAuthors = (content) => {
  fs.writeFileSync(full_author_JSONpath, JSON.stringify(content))
}

// ================================CREATING END POINT METHODS===========================

//1 *******POST******
authorsRouter.post("/", (req, res) => {
  try {
    const newAuthor = { ...req.body, avatar: `https://ui-avatars.com/api/?name=${req.body.name}${req.body.surname}`, createdAt: new Date(), id: uniqid() }
    const AuthorsJsonArray = readAuthors()
    AuthorsJsonArray.push(newAuthor)
    writeAuthors(AuthorsJsonArray)
    res.status(201).send({ id: newAuthor.id })
  } catch (error) {
    console.log(error)
  }
})

//1 *******GET******
authorsRouter.get("/", (req, res) => {
  try {
    const AuthorsJsonArray = readAuthors()
    if (req.query && req.query.name) {
      const filterdAuthors = AuthorsJsonArray.filter((author) => author.name == req.query.name)
      res.send(filterdAuthors)
    } else {
      res.send(AuthorsJsonArray)
    }
  } catch (error) {
    console.log(error)
  }
})

// *******GET WITH ID******
authorsRouter.get("/:id", (req, res) => {
  try {
    const AuthorsJsonArray = readAuthors()

    const specficAuthor = AuthorsJsonArray.find((author) => author.id == req.params.id)

    res.send(specficAuthor)
  } catch (error) {
    console.log(error)
  }
})

//1 **********PUT **************
authorsRouter.put("/:id", (req, res) => {
  try {
    const AuthorsJsonArray = readAuthors()
    const index = AuthorsJsonArray.findIndex((author) => author.id === req.params.id) //findIndexToUpdate
    const authorToModify = AuthorsJsonArray[index]
    const updateAuthor = { ...authorToModify, ...req.body, updatedAt: new Date() }

    AuthorsJsonArray[index] = updateAuthor
    writeAuthors(AuthorsJsonArray)
    res.send(updateAuthor)
  } catch (error) {
    console.log(error)
  }
})

//1 *******DELETE******
authorsRouter.delete("/:id", (req, res) => {
  try {
    const AuthorsJsonArray = readAuthors()
    const remainingAuthors = AuthorsJsonArray.filter((author) => author.id !== req.params.id)
    writeAuthors(remainingAuthors)
    res.status(204).send(`USER SUCCESSFULLY DELETED`)
  } catch (error) {
    console.log(error)
  }
})

export default authorsRouter
