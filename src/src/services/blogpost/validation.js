import {} from "express"
import { body } from "express-validator"

export const blogPostValidatioMiddlewares = [
  body("category").exists().withMessage("category is a mandatory filed"),
  body("title").exists().withMessage("title is a mandatory filed"),
  body("cover").exists().withMessage("cover is a mandatory filed"),
  //   body("readTime").exists().withMessage("readTime  is a mandatory filed"),
  body("content").exists().withMessage("content is a mandatory filed"),
  body("author").exists().withMessage("author is a mandatory filed"),
]
