require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;

// only listen when running locally
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`);
    });
}

// export the express app for vercel server
module.exports = app;
