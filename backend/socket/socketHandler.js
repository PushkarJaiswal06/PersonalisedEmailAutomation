export const initializeSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });

    socket.on('subscribeToProgress', (campaignId) => {
      socket.join(`campaign-${campaignId}`);
      console.log(`Client ${socket.id} subscribed to campaign ${campaignId}`);
    });

    socket.on('unsubscribeFromProgress', (campaignId) => {
      socket.leave(`campaign-${campaignId}`);
      console.log(`Client ${socket.id} unsubscribed from campaign ${campaignId}`);
    });
  });

  return io;
};
