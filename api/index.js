const axios = require('axios');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, updateDoc, increment } = require('firebase/firestore');

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// FireBase OTP API Key
const API_KEY = process.env.API_KEY;

module.exports = async (req, res) => {
  // CORS - Allow all
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';

  try {
    // Check if direct access
    const isDirectAccess = !referer.includes('numbersellapi.vercel.app') && 
                           userAgent.includes('Mozilla');

    // If direct access, show HTML
    if (isDirectAccess && path && path !== 'health' && path !== 'signup' && path !== 'login' && path !== 'getUser' && path !== 'addBalance') {
      return res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Access Blocked</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #1a1a1a;
            color: white;
        }
        .container {
            background: #2d2d2d;
            padding: 40px;
            border-radius: 10px;
            border: 2px solid #ff4444;
            max-width: 600px;
            margin: 0 auto;
        }
        h1 { color: #ff4444; }
        .shayri { 
            color: #ffaa00; 
            font-style: italic;
            margin: 20px 0;
            padding: 20px;
            background: #333;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 Access Blocked</h1>
        <p>Direct API access is not allowed.</p>
        <div class="shayri">
            "Log kehte hain — 'Bhai tu hamesha smile karta hai!'<br>
            Arre naam hi Happy hai, rona toh gunah hai bhaiya! 😜"
        </div>
        <p>Please use the official website:</p>
        <a href="https://numbersellapi.vercel.app" style="color: #00ffff;">
            https://numbersellapi.vercel.app
        </a>
    </div>
</body>
</html>`);
    }

    // Auth Routes
    if (path === 'signup' && req.method === 'POST') {
      const { email, password, name } = req.body;
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: email,
          balance: 0,
          createdAt: new Date().toISOString()
        });
        
        return res.json({
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            name: name
          }
        });
      } catch (error) {
        return res.json({
          success: false,
          error: error.message
        });
      }
    }

    if (path === 'login' && req.method === 'POST') {
      const { email, password } = req.body;
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        return res.json({
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            name: userData.name,
            balance: userData.balance
          }
        });
      } catch (error) {
        return res.json({
          success: false,
          error: error.message
        });
      }
    }

    if (path === 'getUser' && req.method === 'GET') {
      const { uid } = req.query;
      
      if (!uid) {
        return res.json({ success: false, error: 'UID required' });
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        
        if (userDoc.exists()) {
          return res.json({
            success: true,
            user: userDoc.data()
          });
        } else {
          return res.json({ success: false, error: 'User not found' });
        }
      } catch (error) {
        return res.json({ success: false, error: error.message });
      }
    }

    if (path === 'addBalance' && req.method === 'POST') {
      const { uid, amount } = req.body;
      
      if (!uid || !amount) {
        return res.json({ success: false, error: 'UID and amount required' });
      }
      
      try {
        await updateDoc(doc(db, 'users', uid), {
          balance: increment(parseFloat(amount))
        });
        
        return res.json({
          success: true,
          message: `₹${amount} added successfully`
        });
      } catch (error) {
        return res.json({ success: false, error: error.message });
      }
    }

    // Normal API functionality (Your existing code)
    if (path === 'health') {
      return res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        firebase: {
          projectId: firebaseConfig.projectId ? 'Configured' : 'Not Configured'
        }
      });
    }

    if (path === 'getNumber') {
      const url = `https://firexotp.com/stubs/handler_api.php?action=getNumber&api_key=${API_KEY}&service=wa&country=51`;
      const response = await axios.get(url);
      const data = response.data;

      const parts = data.split(':');
      if (parts[0] === 'ACCESS_NUMBER' && parts.length === 3) {
        return res.json({
          success: true,
          id: parts[1],
          number: parts[2]
        });
      } else {
        return res.json({
          success: false,
          error: data
        });
      }
    }

    if (path === 'getOtp') {
      const { id } = req.query;
      if (!id) {
        return res.json({ success: false, error: 'ID required' });
      }

      const url = `https://firexotp.com/stubs/handler_api.php?action=getStatus&api_key=${API_KEY}&id=${id}`;
      const response = await axios.get(url);

      return res.json({
        success: true,
        data: response.data
      });
    }

    if (path === 'cancelNumber') {
      const { id } = req.query;
      if (!id) {
        return res.json({ success: false, error: 'ID required' });
      }

      const url = `https://firexotp.com/stubs/handler_api.php?action=setStatus&api_key=${API_KEY}&id=${id}&status=8`;
      const response = await axios.get(url);

      return res.json({
        success: true,
        data: response.data
      });
    }

    return res.json({ error: 'Invalid path' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
