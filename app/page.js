import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      {/* Hero Section */}
      <section className="py-6 md:py-20">
        <div className="container mx-auto px-4">
          {/* Social Proof Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-indigo-600 via-amber-500 to-cyan-400 rounded-full shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-semibold text-white">5M+ Active Members</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-indigo-600 via-amber-500 to-cyan-400 rounded-full shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-sm font-semibold text-white">#1 New Chat App in Latin America</span>
            </div>
          </div>

          {/* Main Hero Content - Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Column - Text Content */}
            <div className="order-2 md:order-1">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Perfect AI Companion
                <span className="block text-gray-900">
                  Awaits
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                Experience intimate, personalized conversations with stunning AI companions.
                Available 24/7, completely private, and always ready to chat.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signin"
                  className="px-8 py-4 bg-blue-500 text-white text-lg font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/girls"
                  className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 text-lg font-bold rounded-full hover:bg-gray-50 transition-all duration-300 text-center"
                >
                  Meet Our Girls
                </Link>
              </div>
            </div>

            {/* Right Column - Featured Girl Card */}
            <div className="order-1 md:order-2">
              <div className="relative group">
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                  <div className="relative h-[500px] md:h-[600px]">
                    <Image
                      src="/second.jpg"
                      alt="Sofia - AI Companion"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-3xl font-bold text-white mb-1">Sofia</h3>
                      <p className="text-white/90 text-lg">24 years old</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
            Why Choose <span className="text-gray-900">NoviaChat</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Availability</h3>
              <p className="text-gray-600">Your AI companion is always here, ready to chat whenever you need her, day or night.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Privacy</h3>
              <p className="text-gray-600">Your conversations are completely private and secure. Chat without judgment or worry.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Personalized</h3>
              <p className="text-gray-600">Each conversation is tailored to you. She learns what you like and adapts to your preferences.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Exclusive Content</h3>
              <p className="text-gray-600">Unlock beautiful photos, videos, and exclusive content from your favorite companions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your Companions Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-6">
            Meet Your
            <span className="block text-gray-900">
              Dream Companions
            </span>
          </h2>
          <p className="text-xl text-gray-700 text-center mb-16 max-w-2xl mx-auto">
            Choose from our stunning AI companions, each with their own unique personality and style.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Girl 1 - Emma */}
            <div className="group relative bg-white rounded-3xl overflow-hidden hover:scale-105 transition-all duration-500 shadow-xl">
              <div className="relative h-[500px] overflow-hidden">
                <Image
                  src="/first.jpg"
                  alt="Emma"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-3xl font-bold text-white mb-2">Emma</h3>
                <p className="text-gray-200 mb-2 text-lg">22 years old</p>
                <p className="text-gray-300 mb-6">
                  Sweet and playful. I love deep conversations and making you smile. Always here to brighten your day.
                </p>
                <Link
                  href="/signin"
                  className="block w-full px-6 py-4 bg-blue-500 text-white text-lg font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl text-center"
                >
                  Start Chatting with Emma
                </Link>
              </div>
            </div>

            {/* Girl 2 - Sofia */}
            <div className="group relative bg-white rounded-3xl overflow-hidden hover:scale-105 transition-all duration-500 shadow-xl">
              <div className="relative h-[500px] overflow-hidden">
                <Image
                  src="/second.jpg"
                  alt="Sofia"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-3xl font-bold text-white mb-2">Sofia</h3>
                <p className="text-gray-200 mb-2 text-lg">24 years old</p>
                <p className="text-gray-300 mb-6">
                  Confident and adventurous. I know what I want and I'm not afraid to show it. Let's have some fun together.
                </p>
                <Link
                  href="/signin"
                  className="block w-full px-6 py-4 bg-blue-500 text-white text-lg font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl text-center"
                >
                  Start Chatting with Sofia
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-xl">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Your Account</h3>
              <p className="text-gray-600 text-lg">
                Sign up in seconds with just your email. It's completely free to get started.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-xl">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Companion</h3>
              <p className="text-gray-600 text-lg">
                Browse our stunning AI companions and pick the one that catches your eye.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-xl">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Chatting</h3>
              <p className="text-gray-600 text-lg">
                Begin your intimate conversations and unlock exclusive photos and content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Ready to Meet Your
            <span className="block text-gray-900">
              Perfect Match?
            </span>
          </h2>
          <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied users experiencing the future of AI companionship. Your perfect match is waiting.
          </p>
          <Link
            href="/signin"
            className="inline-block px-12 py-5 bg-blue-500 text-white text-xl font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 shadow-lg"
          >
            Join Now - It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 NoviaChat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
