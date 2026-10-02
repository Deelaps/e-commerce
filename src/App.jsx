import React, { useState } from 'react';
import { ShoppingCart, Store, User, ArrowLeft, Plus, Minus, Trash2, CheckCircle, CreditCard, Mail, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// 1. Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const PRODUCTS = [
  { id: 'p1', name: 'Premium Cotton T-Shirt', price: 25, icon: '👕', description: 'Classic fit, 100% combed cotton for ultimate comfort.', category: 'Apparel' },
  { id: 'p2', name: 'Ceramic Coffee Mug', price: 15, icon: '☕', description: 'Matte finish 12oz ceramic mug. Microwave safe.', category: 'Home' },
  { id: 'p3', name: 'Vintage Baseball Cap', price: 20, icon: '🧢', description: 'Adjustable strap, distressed look, washed cotton.', category: 'Accessories' },
  { id: 'p4', name: 'Wireless Headphones', price: 120, icon: '🎧', description: 'Active noise-cancelling over-ear headphones with 30h battery.', category: 'Electronics' },
  { id: 'p5', name: 'Minimalist Watch', price: 85, icon: '⌚', description: 'Sleek design with genuine leather band and quartz movement.', category: 'Accessories' },
  { id: 'p6', name: 'Canvas Backpack', price: 50, icon: '🎒', description: 'Durable, spacious, water-resistant everyday backpack.', category: 'Travel' },
  { id: 'p7', name: 'Polarized Sunglasses', price: 35, icon: '🕶️', description: 'UV400 protection with classic wayfarer frames.', category: 'Accessories' },
  { id: 'p8', name: 'Running Sneakers', price: 95, icon: '👟', description: 'Lightweight, breathable mesh upper for daily running.', category: 'Footwear' },
];

export default function App() {
  const [userEmail, setUserEmail] = useState(null);
  const [view, setView] = useState('catalog'); // 'catalog', 'cart', 'checkout', 'success'
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [lastOrderId, setLastOrderId] = useState('');

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  // 2. Handle Google Login Success
  const handleGoogleSuccess = (credentialResponse) => {
    console.log("Google Auth Success!");
    // In a real production app, decode the JWT to get the exact email
    setUserEmail("verified_user@gmail.com"); 
    setOrderError('');
  };

  // 3. Process Checkout with Supabase & Mailgun
  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!userEmail) {
      setOrderError("Please sign in with Google to secure your order.");
      return;
    }
    
    if (!supabase) {
      setOrderError("Database connection failed. Check your Supabase URL and Key in .env");
      return;
    }

    setIsProcessing(true);
    setOrderError('');
    
    const formData = new FormData(e.target);
    const shippingInfo = {
      contactEmail: formData.get('email'),
      fullName: formData.get('fullName'),
      address: formData.get('address'),
      city: formData.get('city'),
      zip: formData.get('zip'),
    };

    try {
      // A. Save to Supabase Database
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_email: userEmail,
          items: cart,
          total: cartTotal,
          shipping_info: shippingInfo,
          status: 'processing'
        }])
        .select();

      if (error) throw error;
      
      const newOrderId = data && data[0] ? data[0].id : Math.random().toString(36).substring(7);
      setLastOrderId(newOrderId);

      // B. Send Mailgun Confirmation
      const mailgunKey = import.meta.env.VITE_MAILGUN_API_KEY;
      if (mailgunKey) {
        console.log("Mocking Mailgun Email dispatch to:", shippingInfo.contactEmail);
        // Note: Actual Mailgun POST request should be done server-side on Vercel to avoid CORS
      }

      setCart([]);
      setView('success');
    } catch (err) {
      console.error("Order submission failed:", err);
      setOrderError("Failed to save order to Supabase. Check the console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderNavbar = () => (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => setView('catalog')}>
            <Store className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
            <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">NexusShop</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center text-sm text-gray-500">
              <User className="h-5 w-5 mr-1" />
              <span className={userEmail ? "text-green-600 font-medium" : ""}>
                {userEmail ? "Logged In" : "Guest"}
              </span>
            </div>
            
            <button onClick={() => setView('cart')} className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderCatalog = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Discover Your Style</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">Explore our premium collection of everyday essentials, hand-picked for quality and comfort.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PRODUCTS.map(product => (
          <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
            <div className="h-48 bg-gray-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
              {product.icon}
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">{product.category}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-4 flex-grow">{product.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xl font-extrabold text-gray-900">${product.price}</span>
                <button onClick={() => addToCart(product)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => setView('catalog')} className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Continue Shopping
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
          <button onClick={() => setView('catalog')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {cart.map(item => (
              <li key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center">
                <div className="flex items-center flex-1">
                  <div className="h-20 w-20 bg-gray-50 rounded-xl flex items-center justify-center text-4xl mr-6">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <p className="text-gray-500">${item.price} each</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 sm:mt-0 sm:w-48">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-gray-600 hover:text-gray-900">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-gray-600 hover:text-gray-900">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-end ml-6">
                    <span className="font-bold text-gray-900 mb-2">${item.price * item.quantity}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-200">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
              <p>Subtotal</p>
              <p>${cartTotal.toFixed(2)}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
            <button onClick={() => setView('checkout')} className="w-full bg-gray-900 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors flex justify-center items-center">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCheckout = () => (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => setView('cart')} className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Cart
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
            <p className="text-gray-500 mt-1">Order Summary: {cartItemCount} items • ${cartTotal.toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="p-6 sm:p-8">
          {orderError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
              {orderError}
            </div>
          )}

          {/* Google Auth Integration Section */}
          {!userEmail && (
            <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between">
               <div>
                 <h3 className="text-lg font-bold text-gray-900 mb-1">Step 1: Sign in securely</h3>
                 <p className="text-sm text-gray-600 mb-4 sm:mb-0">You must log in with Google to save this order to Supabase.</p>
               </div>
               <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setOrderError('Google Login Failed')} />
            </div>
          )}

          <div className={`space-y-6 ${!userEmail ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Mail className="h-5 w-5 mr-2 text-gray-400" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address (for Mailgun receipt)</label>
                  <input type="email" id="email" name="email" required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" 
                    placeholder="you@example.com" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                Shipping Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" id="fullName" name="fullName" required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input type="text" id="address" name="address" required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" id="city" name="city" required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
                  <input type="text" id="zip" name="zip" required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isProcessing || !userEmail}
              className={`w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${(isProcessing || !userEmail) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? 'Processing Order...' : `Pay $${cartTotal.toFixed(2)} & Save to Supabase`}
              {!isProcessing && <CreditCard className="ml-2 h-5 w-5" />}
            </button>
            <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center">
               Secured via Supabase Postgres Architecture
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-8">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Order Confirmed!</h1>
      <p className="text-lg text-gray-500 mb-8">
        Thank you for your purchase. Your order <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 text-sm">#{lastOrderId.substring(0,8)}</span> has been securely saved to Supabase.
      </p>
      <button onClick={() => setView('catalog')} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
        Continue Shopping
      </button>
    </div>
  );

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder"}>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        {renderNavbar()}
        
        <main className="pb-16">
          {view === 'catalog' && renderCatalog()}
          {view === 'cart' && renderCart()}
          {view === 'checkout' && renderCheckout()}
          {view === 'success' && renderSuccess()}
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}