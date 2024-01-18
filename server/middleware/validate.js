//middleware to sanitize user input
const { body, validationResult } = require("express-validator");

const validateFormFields = (validations) => {
  return async (req, res, next) => {
    const { username, email, password } = req.body;
    if (!username || !password || !email)
      return res
        .status(400)
        .json({ error: "Username, Email, & Password is required." });

    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length)
        return res.status(400).json({ error: result.errors });
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    res.status(400).json({ errors: errors.array() });
  };
};

module.exports = { body, validateFormFields };
