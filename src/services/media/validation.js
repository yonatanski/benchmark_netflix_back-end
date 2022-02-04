import {} from "express"
import { body } from "express-validator"

export const mediaValidatioMiddlewares = [
  body("Title").exists().withMessage("category is a mandatory filed"),
  body("Year").exists().withMessage("Year is a mandatory filed"),

  //   body("readTime").exists().withMessage("readTime  is a mandatory filed"),
  body("Type").exists().withMessage("Type is a mandatory filed"),
]
