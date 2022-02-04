export const badReequestHandler = (err, req, res, next) => {
  console.log(err.errorList)
  if (err.status == 400) {
    res.status(400).send({ message: err.errorList })
  } else {
    next(err)
  }
}
export const unauthorizedtHandler = (err, req, res, next) => {
  if (err.status == 401) {
    res.status(401).send({ message: "unauthorized" })
  } else {
    next(err)
  }
}
export const notFoundHandler = (err, req, res, next) => {
  if (err.status == 404) {
    res.status(404).send({ message: err.message || "NOT FOUND 404" })
  } else {
    next(err)
  }
}
export const genericErrorHandler = (err, req, res, next) => {
  console.log("hedy im the roor middleware", err)
  res.status(500).send({ message: "Generic Server Error" })
}
