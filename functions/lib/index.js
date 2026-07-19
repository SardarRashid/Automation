"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processHQPayment = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.processHQPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { orderId, amount, method, customerId, customerName, date } = data;
    if (!orderId || !amount || !method) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments: orderId, amount, or method.');
    }
    const db = admin.database();
    try {
        const paymentId = `PAY-${Date.now()}`;
        const paymentRecord = {
            id: paymentId,
            orderId,
            customerId: customerId || 'Unknown',
            customerName: customerName || 'Unknown',
            amount,
            method,
            date: date || new Date().toISOString(),
            recordedBy: context.auth.uid,
            status: 'Verified'
        };
        // We use a multi-path update to simulate atomicity across multiple nodes
        // In a real V3, we could use Firestore transactions, but for Realtime Database we use atomic updates
        const updates = {};
        updates[`sales_payments/${paymentId}`] = paymentRecord;
        // We can also trigger the order status change if fully paid, but the client does this via transitionOrder for now.
        // In a complete enterprise shift, all workflow state machines move here.
        await db.ref().update(updates);
        return { success: true, paymentId };
    }
    catch (error) {
        console.error('Error processing payment:', error);
        throw new functions.https.HttpsError('internal', 'Unable to process payment atomically');
    }
});
//# sourceMappingURL=index.js.map