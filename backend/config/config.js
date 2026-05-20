let io;

export const initSocket = async (server) => {
  const { Server } = await import("socket.io");
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  });
};

export const getIO = () => io;
