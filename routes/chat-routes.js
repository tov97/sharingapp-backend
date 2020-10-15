const express = require("express");

const router = express.Router();
// const chatControllers = require("../controllers/chat-controller");
// const app = express();
// const http = require("http");
// const server = http.createServer(app);
// const io = require("socket.io")(server, {
//   origins: "http://localhost:*",
//   path: "/socket.io",
// });

router.get("/", (req, res) => {
  res.send("Server is up");
});

module.exports = router;
