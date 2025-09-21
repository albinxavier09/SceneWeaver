'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import DinoRunner from "@/components/DinoRunner";

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">Scenestitch</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-black transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <section ref={heroRef} className="h-[calc(100vh-64px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <DinoRunner containerRef={heroRef} />
        <div className="max-w-7xl mx-auto text-center relative z-30">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Storyboard Smarter.
            <br />
            <span className="text-gray-600">Faster. Together.</span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            A minimalistic black-and-white storyboarding app that allows you to create, 
            connect, and manage scenes with AI assistance. Perfect for filmmakers, 
            animators, and storytellers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-black text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="border border-gray-300 text-black px-8 py-4 rounded-md text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
