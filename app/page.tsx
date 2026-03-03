"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Brain, Code2, TrendingUp, BarChart3, Target, 
  PlayCircle, CheckCircle2, ArrowRight, Users, Star, 
  Zap, Shield, Globe, ChevronRight, Mail, Phone, MapPin,
  Linkedin, Twitter, Github, Instagram, MessageSquare, 
  FileCode, Briefcase, Users2, Network, Menu, X,
} from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="w-full min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300">
              <Brain className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              PrepBot
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-slate-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="md">Log in</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="md">
                Get Started <ArrowRight size={16} />
              </Button>
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
              onClick={() => setMobileMenuOpen(m => !m)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 py-3 space-y-1">
            {[
              { href: '#features',     label: 'Features' },
              { href: '#how-it-works', label: 'How it Works' },
              { href: '#pricing',      label: 'Pricing' },
              { href: '#testimonials', label: 'Testimonials' },
            ].map(link => (
              <a key={link.href} href={link.href}
                className="block px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 mt-1 border-t border-slate-800">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="md" className="w-full justify-start">Log in</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8">
            <Badge variant="default" className="w-fit">
              <Sparkles size={14} className="mr-1" />
              AI-Powered Interview Platform
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-white">One Platform.</span><br />
              <span className="bg-linear-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Multiple AI Interview Experiences.
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
              Experience real-time mock interviews powered by intelligent evaluation and instant feedback.
              Identify your skill gaps, improve communication, and track your readiness with data-driven insights.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button variant="primary" size="xl">
                  Start Free Interview <Sparkles size={18} />
                </Button>
              </Link>
              <Button variant="secondary" size="xl">
                <PlayCircle size={20} />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-blue-500 border-2 border-slate-900" />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-white font-semibold">10k+</span>
                  <span className="text-slate-400"> users</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
                <span className="text-slate-400 ml-2 text-sm">4.9/5 rating</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-2xl shadow-purple-500/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="success">Live Interview</Badge>
                  <span className="text-slate-400 text-sm">12:34 / 45:00</span>
                </div>
                <div className="h-64 bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center animate-pulse">
                      <Brain size={40} className="text-white" />
                    </div>
                    <p className="text-slate-300 text-lg">AI Interviewer is asking...</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">85%</div>
                    <div className="text-xs text-slate-400">Confidence</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">12/15</div>
                    <div className="text-xs text-slate-400">Questions</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">A+</div>
                    <div className="text-xs text-slate-400">Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="default" className="mx-auto w-fit">
              <Zap size={14} className="mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Everything You Need to Ace Your Interview
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Comprehensive AI-driven tools designed to prepare you for any interview scenario
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: Brain, 
                title: "AI Evaluation Engine", 
                description: "Advanced AI analyzes your responses for content, clarity, and confidence",
                gradient: "from-purple-600 to-blue-600"
              },
              { 
                icon: Code2, 
                title: "Live Coding Sandbox", 
                description: "Practice coding interviews with real-time execution and debugging",
                gradient: "from-blue-600 to-cyan-600"
              },
              { 
                icon: Target, 
                title: "Skill Gap Analyzer", 
                description: "Identify weaknesses and get personalized improvement recommendations",
                gradient: "from-cyan-600 to-teal-600"
              },
              { 
                icon: BarChart3, 
                title: "Performance Analytics", 
                description: "Track progress with detailed metrics and historical comparisons",
                gradient: "from-teal-600 to-emerald-600"
              },
            ].map((feature, i) => (
              <Card key={i} className="group hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <feature.icon className="text-white" size={28} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="default" className="mx-auto w-fit">
              <Target size={14} className="mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              How It Works
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Get started in three simple steps and transform your interview preparation
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              {
                step: "01",
                icon: MessageSquare,
                title: "Choose Interview Type",
                description: "Select from Technical, Behavioral, HR, or System Design interviews based on your needs"
              },
              {
                step: "02",
                icon: Users,
                title: "Take AI Interview",
                description: "Engage with our intelligent AI interviewer that adapts to your responses in real-time"
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Get Feedback & Roadmap",
                description: "Receive detailed analysis, personalized feedback, and a custom learning roadmap"
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-linear-to-r from-purple-600 to-transparent -z-10" />
                )}
                <Card className="text-center h-full">
                  <CardHeader>
                    <div className="text-6xl font-bold bg-linear-to-br from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                      {item.step}
                    </div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <item.icon className="text-white" size={32} />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-400">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Categories */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="default" className="mx-auto w-fit">
              <Network size={14} className="mr-1" />
              Interview Types
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Master Every Interview Format
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Code2, title: "Technical", color: "purple" },
              { icon: MessageSquare, title: "Behavioral", color: "blue" },
              { icon: Briefcase, title: "HR", color: "cyan" },
              { icon: Network, title: "System Design", color: "teal" },
            ].map((category, i) => (
              <Card key={i} className="group cursor-pointer hover:scale-[1.05] transition-all duration-300">
                <CardHeader className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-linear-to-br from-${category.color}-600 to-${category.color}-500 flex items-center justify-center shadow-xl`}>
                    <category.icon className="text-white" size={40} />
                  </div>
                  <CardTitle className="text-2xl">{category.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    Practice with AI-powered {category.title.toLowerCase()} interviews
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                  <Button variant="ghost" size="sm" className="group-hover:text-purple-400">
                    Learn More <ChevronRight size={16} />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="default" className="mx-auto w-fit">
              <Users size={14} className="mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Loved by Professionals Worldwide
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                role: "Software Engineer at Google",
                content: "PrepBot helped me land my dream job! The AI feedback was incredibly accurate and helped me improve my communication skills.",
                rating: 5
              },
              {
                name: "Michael Rodriguez",
                role: "Product Manager at Amazon",
                content: "The behavioral interview practice was game-changing. I felt so prepared going into my interviews.",
                rating: 5
              },
              {
                name: "Priya Sharma",
                role: "Data Scientist at Microsoft",
                content: "The skill gap analysis pinpointed exactly what I needed to work on. Within 2 months, I got 3 offers!",
                rating: 5
              },
            ].map((testimonial, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {Array(testimonial.rating).fill(0).map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <CardDescription className="text-slate-300 text-base italic">
                    &quot;{testimonial.content}&quot;
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-600 to-blue-600" />
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="default" className="mx-auto w-fit">
              <Sparkles size={14} className="mr-1" />
              Pricing Plans
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-400">
              Start free, upgrade when you need more
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                description: "Perfect for getting started",
                features: [
                  "5 interviews per month",
                  "Basic feedback",
                  "Performance tracking",
                  "Email support"
                ],
                highlight: false
              },
              {
                name: "Pro",
                price: "$29",
                description: "Most popular for serious prep",
                features: [
                  "Unlimited interviews",
                  "Advanced AI feedback",
                  "Detailed analytics",
                  "Skill gap analysis",
                  "Priority support",
                  "Custom roadmaps"
                ],
                highlight: true
              },
              {
                name: "Enterprise",
                price: "$99",
                description: "For teams and organizations",
                features: [
                  "Everything in Pro",
                  "Team management",
                  "Custom branding",
                  "API access",
                  "Dedicated support",
                  "SLA guarantee"
                ],
                highlight: false
              },
            ].map((plan, i) => (
              <Card key={i} className={`${plan.highlight ? 'border-purple-500/50 shadow-2xl shadow-purple-500/20 md:scale-105' : ''} relative`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-lg shadow-purple-500/50">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={plan.highlight ? "primary" : "secondary"} 
                    size="lg" 
                    className="w-full"
                  >
                    {plan.name === "Free" ? "Get Started" : "Upgrade Now"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20" />
            <CardHeader className="text-center relative z-10 space-y-6 py-16">
              <CardTitle className="text-3xl sm:text-4xl md:text-5xl">
                Ready to Ace Your Next Interview?
              </CardTitle>
              <CardDescription className="text-xl text-slate-300">
                Join thousands of professionals who have transformed their interview skills
              </CardDescription>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link href="/register">
                  <Button variant="primary" size="xl">
                    Start Free Interview <Sparkles size={18} />
                  </Button>
                </Link>
                <Button variant="secondary" size="xl">
                  Schedule a Demo
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Brain className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold text-white">PrepBot</span>
              </div>
              <p className="text-slate-400 text-sm">
                Empowering professionals to succeed in their interview journey with AI-powered preparation.
              </p>
              <div className="flex gap-3">
                {[Twitter, Linkedin, Github, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors group">
                    <Icon size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              © 2026 PrepBot. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <span className="flex items-center gap-1">
                <Mail size={14} /> hello@prepbot.ai
              </span>
              <span className="flex items-center gap-1">
                <Globe size={14} /> Global
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}