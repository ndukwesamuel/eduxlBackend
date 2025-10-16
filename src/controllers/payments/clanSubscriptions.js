import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config()
// const { PAYSTACK_SECRET_KEY } = process.env;

//Test Key
const PAYSTACK_SECRET_KEY = "sk_test_2d8f13969ac7be3525ec8eff16a933054ccc6ee3";



// Map of subscription types to plan data
const subscriptionPlans = {
  monthly: { amount: 15000, interval: 'monthly', plan: 'PLN_ztpthfouk5bc4ki' },
  quarterly: { amount: 42000, interval: 'quarterly', plan: 'PLN_xxxxxxxxxx' }, 
  yearly: { amount: 160000, interval: 'yearly', plan: 'PLN_xxxxxxxxxx' },
};

// Route to handle subscription creation
export const clanSubscribe = async (req, res) => {
  try {
    const { email, subscriptionType } = req.body;
    const { clanId } = req.params;

    // Get the plan data based on the subscription type
    const selectedPlan = subscriptionPlans[subscriptionType];
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid subscription type' });
    }

    // Prepare request data
    const requestData = {
      email,
      amount: selectedPlan.amount * 100, 
      plan: selectedPlan.plan,
      metadata: {
        clanId,
      },
    };

    // Initialize Paystack transaction
    const paystackResponse = await initializePaystackTransaction(requestData);
    res.json(paystackResponse.data);
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

const testSecret = "sk_test_2d8f13969ac7be3525ec8eff16a933054ccc6ee3";
// Webhook endpoint to handle Paystack events
export const handleSubscriptionWebhooks = async (req, res) => {
  try {
    // const secret = testSecret;
    const secret = PAYSTACK_SECRET_KEY;
    const hash = req.headers['x-paystack-signature'];
    const event = req.body;
    
    // Validate webhook request
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(JSON.stringify(event));
    const calculatedHash = hmac.digest('hex');
    if (hash !== calculatedHash) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle Paystack event
    if (event.event === 'charge.success') {
      // Update clan status based on payment success
      const subscriptionData = event.data;
      const clanId = subscriptionData.metadata.clanId; 
      const isActive = true; 
      
      // Update clan status in the database
      // Clan.findByIdAndUpdate(clanId, { isActive });

      console.log('Clan status updated:', { clanId, isActive });
    }

    res.status(200).end();
  } catch (error) {
    console.error('Error handling Paystack webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to initialize Paystack transaction
// async function initializePaystackTransaction(requestData) {
//   const options = {
//     headers: {
//       Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//       'Content-Type': 'application/json',
//     },
//   };

//   return await axios.post('https://api.paystack.co/transaction/initialize', requestData, options);
// }

const initializePaystackTransaction = async (requestData) => {
  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', requestData, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error initializing Paystack transaction:', error.response ? error.response.data : error.message);
    throw error; 
  }
};
