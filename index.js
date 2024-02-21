const express = require("express");
const Order = require("./Database/Order");

const Server = require("socket.io").Server;

const app = express();
const port = 5000;

require("./Database/connectDB");

const expressServer = app.listen(process.env.PORT || port, () => {
  console.log(`listening on port ${port}`);
});



const io = new Server(expressServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://shopeasee.vercel.app",
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

    // finding the user from the connected user array...

    singleUserId = connectUserList.find((user) => user.userId === userId);

    if (singleUserId) {
      io.to(singleUserId.socketId).emit("STATUS__CHANGED", { oderStatus });
    } else {
      console.log("user not connected");
    }
  });

  socket.on('CANCEL__ORDER', async ({ userId, orderId }) => {
    try {
      const findOrder = await Order.findOneAndUpdate({ _id: orderId }, { "status": "cancel" }, {  returnOriginal:false }).exec();
      if(findOrder){
        const newOrderList = await Order.find({userId});

        singleUserId = connectUserList.find((user)=> user.userId === userId);

        if(singleUserId){          
          io.to(singleUserId.socketId).emit('UPDATED__ORDERLIST',{orders:newOrderList})
        }
         
      }

      

    } catch (error) {
      console.log("error", error);
    }
  })

  socket.on("disconnect", () => {
    const disconnectUser = connectUserList.findIndex(
      (user) => user.socketId === socket.id
    );

    if (disconnectUser !== -1) {
      connectUserList.splice(disconnectUser, 1);
    }
  });
});





