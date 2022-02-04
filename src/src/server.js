import express from "express" // 3RD PARTY MODULE DOES NEED TO INSTALL
import listEndpoints from "express-list-endpoints"
import cors from "cors"
import authorsRouter from "./services/authors/index.js"
import blogpostRouter from "./services/blogpost/index.js"
import { join } from "path"
import { badReequestHandler, unauthorizedtHandler, notFoundHandler, genericErrorHandler } from "./errorHandler.js"

const server = express() // declearing server

const publicFolderPath = join(process.cwd(), "./public/img/blogpost")

// CORS FUNCTIONS --------------------------------
const whitelist = [process.env.FE_LOCAL_URL, process.env.FE_PRODUCTION_URL]

console.log("Permitted origins:")
console.table(whitelist)
const corsfUN = {
  origin: function (origin, next) {
    //cors is global middle ware so every request  we are able to detect the origin from this function

    console.log("CURRENT", origin)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      next(null, true)
    } else {
      next(new Error("CORS Error"))
    }
  },
}

server.use(cors())
server.use(express.static("./dist"))

server.use(express.json()) // if this not worte here the request body will be undifend

server.use(express.static(publicFolderPath)) // thid help us to use the link for images

// ************************** ENDPOINT ****************
server.use("/authors", authorsRouter)
server.use("/blogpost", blogpostRouter)

// ====================================ERROR MIDDLEWARES======================================

server.use(badReequestHandler)
server.use(unauthorizedtHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

console.table(listEndpoints(server)) // TO PRINT THE END POINT TABLE ON TERMINAL

const port = process.env.PORT || 3005
server.listen(port, () => {
  console.log("SEREVER IS 🏃‍♂️🏃‍♂️🏃‍♂️🏃‍♂️ ON PORT", port)
})
