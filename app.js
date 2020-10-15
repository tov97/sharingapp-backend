const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const chatRoutes = require("./routes/chat-routes");
const HttpError = require("./models/http-error");
const fs = require("fs");
const path = require("path");
const app = express();

//code for socket/chat
const cors = require("cors");
const whitelist = ["http://localhost:3000"];
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  origins: "http://localhost:*",
  path: "/",
});

app.use(bodyParser.json());
//serve an image statically
app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("chat message", (msg) => {
    console.log("message: " + JSON.stringify(msg));
    io.emit("chat message", msg);
  });
  socket.on("disconnect", () => {
    console.log("User left!");
  });
});

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);
app.use("/socket.io", chatRoutes);
//app.use("/socket.io", chatRoutes);

//error handlers
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    //deletes a file if an error happens during a signup or new place.
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured!" });
});

//establishes connection to the Mongo db with the url. If it were to fail, backend wont listen/start.
mongoose
  .connect(
    // `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nlsa3.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
    "mongodb+srv://trevor:DwG1YRYBbqbduDvw@cluster0.nlsa3.mongodb.net/chat?retryWrites=true&w=majority"
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    server.listen(5001);
  })
  .catch((err) => {
    console.log(err);
  });
