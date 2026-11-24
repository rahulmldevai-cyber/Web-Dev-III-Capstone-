
const eventEmitter = require('./eventEmitter');
const { getIO } = require('./socket');

// Order Placed Event
eventEmitter.on('order-placed', (data) => {
    try {
        const io = getIO();

        // Notify customer
        io.to(`user:${data.customerId}`).emit('order-placed', {
            orderId: data.orderId,
            totalAmount: data.totalAmount,
            message: 'Your order has been placed successfully'
        });

        // Notify relevant sellers
        for (const sellerId of data.sellerIds || []) {
            io.to(`seller:${sellerId}`).emit('new-order', {
                orderId: data.orderId,
                message: 'You have received a new order'
            });
        }

        console.log('Order notifications sent');
    } catch (error) {
        console.error('Order notification error:', error.message);
    }
});

// Low Stock Event
eventEmitter.on('low-stock', (data) => {
    try {
        const io = getIO();

        io.to(`seller:${data.sellerId}`).emit('low-stock-alert', {
            productId: data.productId,
            productName: data.productName,
            remainingStock: data.stock,
            message: 'Product stock is running low'
        });

        io.to('admin').emit('low-stock-alert', {
            productId: data.productId,
            productName: data.productName,
            remainingStock: data.stock,
            sellerId: data.sellerId,
            message: 'A product has reached its low-stock threshold'
        });

        console.log('Low stock notifications sent');
    } catch (error) {
        console.error('Low stock notification error:', error.message);
    }
});

// Order Status Updated Event
eventEmitter.on('order-status-updated', (data) => {
    try {
        const io = getIO();

        io.to(`user:${data.customerId}`).emit('order-status-updated', {
            orderId: data.orderId,
            status: data.status,
            message: `Your order status is now ${data.status}`
        });

        console.log('Order status notification sent');
    } catch (error) {
        console.error('Order status notification error:', error.message);
    }
});

module.exports = eventEmitter;
