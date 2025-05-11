export default function DeliveryBanner() {
  return (
    <section className="mb-10">
      <div className="bg-accent/10 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <img 
              src="https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300" 
              alt="Fast grocery delivery service" 
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
          </div>
          <div className="md:w-1/2 md:pl-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Fast & Reliable Delivery</h2>
            <p className="text-gray-600 mb-6">
              Our delivery partners ensure your groceries arrive fresh and on time. Enjoy contactless delivery right to your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center">
                <div className="bg-white shadow-sm rounded-full p-2 mr-3">
                  <i className="ri-time-line text-primary text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">30-Min Delivery</h3>
                  <p className="text-sm text-gray-500">For nearby stores</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-white shadow-sm rounded-full p-2 mr-3">
                  <i className="ri-shield-check-line text-primary text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Secure Packaging</h3>
                  <p className="text-sm text-gray-500">Safe & hygienic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
