import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Try to import Razorpay, but handle failure gracefully
let RazorpayCheckout;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (error) {
  console.log('Razorpay native module not available, using fallback');
  RazorpayCheckout = null;
}

export const processRazorpayPayment = async (options) => {
  // Check if we're in Expo Go or native module is missing
  if (!RazorpayCheckout) {
    // Fallback to webview for Expo Go
    const paymentUrl = `https://checkout.razorpay.com/v1/checkout.js?key_id=${options.key}&order_id=${options.order_id}&amount=${options.amount}&currency=${options.currency}&name=${encodeURIComponent(options.name)}&description=${encodeURIComponent(options.description)}&prefill[name]=${encodeURIComponent(options.prefill.name)}&prefill[email]=${options.prefill.email}&prefill[contact]=${options.prefill.contact}`;
    
    try {
      const result = await WebBrowser.openBrowserAsync(paymentUrl);
      if (result.type === 'cancel') {
        throw { code: 'PAYMENT_CANCELLED', description: 'Payment cancelled' };
      }
      // Note: You'll need to handle webhook callbacks on your backend
      return { razorpay_payment_id: 'web_payment' };
    } catch (error) {
      throw error;
    }
  }

  // Native module is available (development build)
  return RazorpayCheckout.open(options);
};