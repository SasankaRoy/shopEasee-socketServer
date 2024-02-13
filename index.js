const express = require("express");
const Order = require("./Database/Order");

const Server = require("socket.io").Server;

const app = express();
const port = 5000;

require("./Database/connectDB");



const io = new Server(expressServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://shop-easee.vercel.app",
      "http://192.168.29.68:3000",
    ],
  },
});

let connectUserList = [];

io.on("connection", (socket) => {
  console.log("the user is connect");

  const newUserId = socket.handshake.query.userId;

  if (!connectUserList.includes(newUserId)) {
    connectUserList.push({ userId: newUserId, socketId: socket.id });
  }

  let singleUserId;

  socket.on("CHANGE__STATUS", ({ productId, userId, oderStatus }) => {
    // console.log(connectUserList.includes(userId), 'if the user is already connected');

    singleUserId = connectUserList.find((user) => user.userId === userId);

    if (singleUserId) {
      console.log(singleUserId, "singleUser");
      io.to(singleUserId.socketId).emit("STATUS__CHANGED", { oderStatus });
    } else {
      console.log("user not connected");
    }

    // socket.broadcast.emit('STATUS__CHANGED','hello from the server')
  });

  socket.on("disconnect", () => {
    const disconnectUser = connectUserList.findIndex(
      (user) => user.socketId === socket.id
    );

    if (disconnectUser !== -1) {
      connectUserList.splice(disconnectUser, 1);
    }
  });
});




const expressServer = app.listen(process.env.PORT || port, () => {
  console.log(`listening on port ${port}`);
});
