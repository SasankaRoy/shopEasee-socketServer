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
// active user list store...
let connectUserList = [];


// connection  event....
io.on("connection", (socket) => {
  console.log("the user is connect");

  const newUserId = socket.handshake.query.userId;
  const userRole = socket.handshake.query.role;


  if (!connectUserList.includes(newUserId)) {
    connectUserList.push({ userId: newUserId, socketId: socket.id, userRole });
  }




  let singleUserId, adminUser;

  // new order or getting order's.........
  socket.on('NEW__ORDER',async(newOrder)=>{
    const {oder, productIds, userId, subTotal} = newOrder;    

    const newOder = new Order({
      userId,
      userName: oder.fullName,
      email: oder.email,
      address: oder.fullAddress,
      phoneNumber: oder.phoneNumber,
      alternativePhoneNumber: oder.alternatePhoneNumber,
      country: oder.country,
      paymentMethod: oder.payMethod,
      totalPrice: subTotal,
      itemList: productIds,
    })
    const savedOrder =await newOder.save();

    adminUser = connectUserList.find(admin => admin.userRole === 'admin');

    console.log(adminUser,'adminUser line no 67')

    io.to(adminUser.socketId).emit('NEW__ORDERLIST',{savedOrder})

    socket.emit('ORDER__PLACED',{success:'your order have been placed'});  // sending the response back to the client to notify...

  })


// when the admin changes the status of a  single user..
  socket.on("CHANGE__STATUS", ({ productId, userId, oderStatus }) => {

    // finding the user from the connected user array...

    singleUserId = connectUserList.find((user) => user.userId === userId);

    

    if (singleUserId) {
      io.to(singleUserId.socketId).emit("STATUS__CHANGED", { oderStatus });
    } else {
      console.log("user not connected");
    }
  });


  // cancel order event...
  socket.on('CANCEL__ORDER', async ({ userId, orderId }) => {
    try {
      const findOrder = await Order.findOneAndUpdate({ _id: orderId }, { "status": "cancel" }, { returnOriginal: false }).exec();
      if (findOrder) {
        const newOrderList = await Order.find({ userId });

        singleUserId = connectUserList.find((user) => user.userId === userId); // for the user or the client....
        adminUser = connectUserList.find(admin => admin.userRole === 'admin');        

        if (singleUserId) {
          io.to(singleUserId.socketId).emit('UPDATED__ORDERLIST', { orders: newOrderList })
        }

        if(adminUser){
          const updateOrderList = await Order.find();  // because we need to send the updated order list to the admin user....
          io.to(adminUser.socketId).emit('ORDERLIST__UPDATE',{orders : updateOrderList});
        }
      }

    } catch (error) {
      console.log("error", error);
    }
  })

  // disconnecting event....
  socket.on("disconnect", () => {
    const disconnectUser = connectUserList.findIndex(
      (user) => user.socketId === socket.id
    );

    if (disconnectUser !== -1) {
      connectUserList.splice(disconnectUser, 1);
    }
  });
});
