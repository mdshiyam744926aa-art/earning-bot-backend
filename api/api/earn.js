// api/earn.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CERT_URL
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, amount, taskId } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ success: false, message: 'Missing data' });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    const currentBalance = userDoc.exists ? (userDoc.data().balance || 0) : 0;
    const newBalance = currentBalance + amount;
    
    await userRef.set({ balance: newBalance, lastUpdated: new Date() }, { merge: true });
    
    // ট্রানজেকশন লগ
    await db.collection('transactions').add({
      userId: userId,
      amount: amount,
      taskId: taskId,
      timestamp: new Date()
    });
    
    return res.json({ 
      success: true, 
      newBalance: newBalance,
      message: `+${amount} TK added!`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
