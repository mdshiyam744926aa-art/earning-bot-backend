// api/verify.js
import admin from 'firebase-admin';

// Firebase Admin SDK Initialize (শুধু একবার)
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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, taskId, taskUrl } = req.body;
  const BOT_TOKEN = "8624301994:AAETElpDPnRh-y4z_H74XOiGDxby_kz8Psg";

  if (!userId) {
    return res.status(400).json({ success: false, message: 'Missing user ID' });
  }

  // চ্যানেল আইডি বের করুন
  let chatId = taskUrl;
  if (taskUrl?.includes('t.me/')) {
    chatId = '@' + taskUrl.split('t.me/')[1].split('/')[0].split('?')[0];
  } else if (taskUrl?.startsWith('@')) {
    chatId = taskUrl;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`
    );
    const data = await response.json();

    if (data.ok) {
      const status = data.result.status;
      const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);
      
      return res.json({ 
        success: true, 
        isMember: isMember,
        message: isMember ? '✅ Verified!' : '❌ Not a member!'
      });
    } else {
      return res.json({ success: false, message: 'Verification failed' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
