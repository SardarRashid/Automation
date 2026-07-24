import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const processHQPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { orderId, amount, method, customerId, customerName, date } = data;
  
  if (!orderId || !amount || !method) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required arguments: orderId, amount, or method.'
    );
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
    const updates: any = {};
    updates[`sales_payments/${paymentId}`] = paymentRecord;
    
    // We can also trigger the order status change if fully paid, but the client does this via transitionOrder for now.
    // In a complete enterprise shift, all workflow state machines move here.

    await db.ref().update(updates);
    
    return { success: true, paymentId };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new functions.https.HttpsError('internal', 'Unable to process payment atomically');
  }
});

export const adminUpdateUserPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { targetEmail, newPassword } = data;

  if (!targetEmail || !newPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required arguments: targetEmail, newPassword.'
    );
  }

  try {
    // 1. Verify caller is an admin
    const callerUid = context.auth.uid;
    const db = admin.database();
    
    // First we need the caller's userKey from uid_mappings
    const mappingSnap = await db.ref(`uid_mappings/${callerUid}`).once('value');
    const callerUserKey = mappingSnap.val();
    
    if (!callerUserKey) {
      throw new functions.https.HttpsError('permission-denied', 'Caller mapping not found.');
    }
    
    const callerRoleSnap = await db.ref(`users/${callerUserKey}/role`).once('value');
    const callerRole = callerRoleSnap.val();
    
    if (callerRole !== 'admin' && callerRole !== 'system_admin' && context.auth.token.email !== 'sardarrashid121@gmail.com') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can change passwords.');
    }

    // 2. Find target user UID
    const userRecord = await admin.auth().getUserByEmail(targetEmail);

    // 3. Update password
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error: any) {
    console.error('Error updating password:', error);
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'User not found in Firebase Auth.');
    }
    throw new functions.https.HttpsError('internal', 'Unable to update password: ' + error.message);
  }
});
