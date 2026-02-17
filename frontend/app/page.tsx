import { Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-[radial-gradient(circle_at_center,#ffffff,#f7fdfb)]">
      <nav className="flex justify-between items-center p-2 bg-slate-100 shadow-md m-4">
        <div>
          <Link href="/" className="flex items-center font-bold">
            <Bot size={35} className="text-blue-600 mr-1"/> Prep<span className="text-red-700 text-xl">Bot</span>
          </Link>
        </div>
        <div className="flex items-center gap-12">
          <Link href="#work">How it works</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="/help">Help Center</Link>  
        </div>
        <div>
          <Link href="/register" className="mr-4 bg-blue-100 border-2 border-slate-300 px-2 py-1 rounded-[5px] hover:bg-blue-200 transition-all duration-200">Sign Up</Link>
          <Link href="/login" className="bg-blue-600 border-2 border-slate-300 text-white px-2 py-1 rounded-[5px] hover:bg-blue-700 transition-all duration-200">Log in</Link>
        </div>
      </nav>

      <main className="flex flex-col items-center gap-14">
        <div className="w-screen flex justify-around items-center mt-12">
          <div className="w-[40vw] h-[80vh] flex flex-col justify-center items-start">
            <h1 className="text-5xl font-bold">AI Powered</h1>
            <h1 className="text-5xl font-bold">Interview Platform</h1>
            <p className="mt-6 text-black/70">
              Experience real-time mock interviews powered by intelligent evaluation and instant feedback.
              Identify your skill gaps, improve communication, and track your readiness with data-driven insights.
              Prepare smarter. Perform better. Get hired faster.
            </p>
            <button className="mt-10 py-2 px-3 bg-emerald-600 rounded-xl text-white font-bold hover:bg-emerald-700 transition-colors duration-200">Get Started &gt;</button>
          </div>
          <div className="w-[40vw] h-[80vh]">
            <Image src="/professional-lawyer-explaining-reviewing-business-contract-with-female-client-office-caucasian-woman-listening-her-male-boss-talk-about-work-report.jpg" width={500} height={500} alt="img" className="object-cover w-full h-full rounded-full shadow-xl shadow-blue-200 border-t-4 border-green-400"/>
          </div>
        </div>

        <h1 className="text-3xl font-bold">One Platform Multi AI Interview Experences</h1>
        <div className="w-screen flex justify-around items-center">
          <div className="w-[40vw] h-[60vh]">
            <Image src="/pexels-tima-miroshnichenko-5439143.jpg" width={500} height={500} alt="img" className="object-cover w-full h-full rounded-4xl border-l-4 border-emerald-500"/>
          </div>
          <div className="w-[35vw] h-[60vh] flex flex-col justify-center items-end text-center text-xl text-black/70">
            Experience realistic technical, behavioral, and HR interviews powered by intelligent AI interviewers.
            Engage in live coding rounds with secure execution and instant performance analysis.
            Receive detailed feedback on communication, problem-solving, and domain knowledge.
            Track your progress with advanced analytics and personalized skill gap reports.
            Prepare smarter, improve faster, and walk into every interview with confidence.
          </div>
        </div>

        <h1 id="work" className="text-3xl font-bold text-center">
          How it works
          <p className="font-normal text-sm mt-1">
            Choose your interview type and start a real-time AI-powered session tailored to your role and skill level. Get instant <br/>
            feedback, performance analytics, and a personalized roadmap to improve and succeed.
          </p>
        </h1>
        <div className="flex justify-around gap-24">
          <div className="w-[15vw] h-[30vh] p-2 border-2 border-slate-200 rounded-xl shadow-2xl shadow-blue-400 flex flex-col gap-2">
            <h1 className="my-4 font-bold text-xl bg-linear-to-r from-emerald-700 to-cyan-600 bg-clip-text text-black/0">Choose Interview</h1>
            <div className="w-[80%] h-6 bg-slate-200 rounded-2xl"></div>
            <div className="flex">
              <span className="w-[30%] h-6 bg-slate-200 rounded-2xl mr-1"></span><span className="w-[30%] h-6 bg-slate-200 rounded-2xl"></span>
            </div>
            <div className="w-[70%] h-6 bg-slate-200 rounded-2xl"></div>
          </div>
          <div className="w-[15vw] h-[30vh] p-2 border-2 border-slate-200 rounded-xl shadow-2xl shadow-blue-400 flex flex-col gap-2">
            <h1 className="my-4 font-bold text-xl bg-linear-to-r from-emerald-700 to-cyan-600 bg-clip-text text-black/0">Real-Time Session</h1>
            <div className="w-[80%] h-6 bg-slate-200 rounded-2xl"></div>
            <div className="flex">
              <span className="w-[30%] h-6 bg-slate-200 rounded-2xl mr-1"></span><span className="w-[30%] h-6 bg-slate-200 rounded-2xl"></span>
            </div>
            <div className="w-[70%] h-6 bg-slate-200 rounded-2xl"></div>
          </div>
          <div className="w-[15vw] h-[30vh] p-2 border-2 border-slate-200 rounded-xl shadow-2xl shadow-blue-400 flex flex-col gap-2">
            <h1 className="my-4 font-bold text-xl bg-linear-to-r from-emerald-700 to-cyan-600 bg-clip-text text-black/0">Review & Feedback</h1>
            <div className="w-[80%] h-6 bg-slate-200 rounded-2xl"></div>
            <div className="flex">
              <span className="w-[30%] h-6 bg-slate-200 rounded-2xl mr-1"></span><span className="w-[30%] h-6 bg-slate-200 rounded-2xl"></span>
            </div>
            <div className="w-[70%] h-6 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </main>

      <footer className="bg-black mt-14 flex flex-col items-center justify-center gap-6">
          <div className="flex justify-around items-start pt-6 w-full">
            <div>
              <Link href="/" className="flex items-center font-bold text-white">
                <Bot size={35} className="text-blue-600 mr-1"/> Prep<span className="text-red-700 text-xl">Bot</span>
              </Link>
              <p className="text-white/70 text-sm">
                From coding rounds to HR questions, it provides instant feedback and data-driven <br/> insights to accelerate your career growth.
              </p>
            </div>
            <div className="text-white text-center">
              <h1 className="font-extrabold mb-2">Important links</h1>
              <ul className="flex gap-8">
                <Link href="#work">How it works</Link>
                <Link href="#pricing">Pricing</Link>
                <Link href="/help">Help Center</Link>  
              </ul>
            </div>
          </div>
          <hr className="w-[70vw] text-white/40"/>
          <h2 className="text-white text-sm mb-6">
            Copyright ©️ {new Date(Date.now()).getFullYear()} PrepBot | All rights reserved
          </h2>
        </footer>
    </div>
  )
}