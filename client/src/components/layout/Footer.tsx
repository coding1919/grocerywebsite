import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <i className="ri-shopping-basket-2-fill text-3xl text-primary mr-2"></i>
              <span className="text-xl font-semibold text-gray-800">QuickMart</span>
            </div>
            <p className="text-gray-600 mb-4">
              Order groceries online with fast delivery right to your doorstep.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-600 hover:text-primary">Home</Link></li>
              <li><Link href="/orders" className="text-gray-600 hover:text-primary">My Orders</Link></li>
              <li><Link href="/vendor/login" className="text-gray-600 hover:text-primary">Become a Vendor</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-primary">Fruits & Vegetables</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Dairy & Eggs</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Bakery</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Meat & Seafood</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Household</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <i className="ri-map-pin-line text-primary mt-1 mr-2"></i>
                <span className="text-gray-600">123 Grocery St, New York, NY 10001</span>
              </li>
              <li className="flex items-start">
                <i className="ri-mail-line text-primary mt-1 mr-2"></i>
                <span className="text-gray-600">support@quickmart.com</span>
              </li>
              <li className="flex items-start">
                <i className="ri-customer-service-2-line text-primary mt-1 mr-2"></i>
                <span className="text-gray-600">+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} QuickMart. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-primary text-lg">
                <i className="ri-facebook-fill"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary text-lg">
                <i className="ri-twitter-fill"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary text-lg">
                <i className="ri-instagram-line"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
