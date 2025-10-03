"use client";
import React, { useState } from "react";
import { Sparkles, ImagePlus } from "lucide-react";


export default function AdCopyGenerator() {
  const [step, setStep] = useState(1);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [formQuestions, setFormQuestions] = useState([]);
  const [formAnswers, setFormAnswers] = useState({});
  const [generatedImage, setGeneratedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const callOpenAI = async (endpoint, payload) => {
    const res = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, payload }),
    });


    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.error);
    return data;
  };


  const generateForm = async () => {
    setLoading(true);
    setError("");


    try {
      const data = await callOpenAI("chat/completions", {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a marketing expert. Generate contextual form questions based on the user's ad request. Return ONLY a JSON array with this exact structure: [{\"question\": \"question text\", \"options\": [\"option1\", \"option2\", \"option3\"]}]. Questions should cover: target segment, positioning, product features, pricing/discount, availability, promotion channels, and color theme.",
          },
          {
            role: "user",
            content: `Generate form questions for this ad request: "${initialPrompt}"`,
          },
        ],
        temperature: 0.7,
      });


      const content = data.choices[0].message.content;
      const questions = JSON.parse(content.match(/\[[\s\S]*\]/)[0]);
      setFormQuestions(questions);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to generate form.");
    } finally {
      setLoading(false);
    }
  };


  const generateImagePrompt = async () => {
    setLoading(true);
    setError("");


    try {
      const answersText = formQuestions
        .map((q, i) => `${q.question} ${formAnswers[i] || "Not specified"}`)
        .join(". ");


      const data = await callOpenAI("chat/completions", {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at creating DALL-E prompts for advertising images. Create a detailed, visual prompt for an ad image based on the user's answers. Focus on visual elements, composition, style, and atmosphere. Keep it under 400 characters. Return ONLY the prompt text, no explanations.",
          },
          {
            role: "user",
            content: `Original request: "${initialPrompt}". Details: ${answersText}`,
          },
        ],
        temperature: 0.8,
      });


      const imagePrompt = data.choices[0].message.content.trim();
      await generateImage(imagePrompt);
    } catch (err) {
      setError(err.message || "Failed to generate image prompt");
      setLoading(false);
    }
  };


  const generateImage = async (prompt) => {
    try {
      const data = await callOpenAI("images/generations", {
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });


      setGeneratedImage(data.data[0].url);
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };


  const reset = () => {
    setStep(1);
    setInitialPrompt("");
    setFormQuestions([]);
    setFormAnswers({});
    setGeneratedImage("");
    setError("");
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 bg-white/40 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/60 shadow-lg">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            <h1 className="text-xl sm:text-2xl font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AdWiz
            </h1>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm font-light px-4">Generate stunning ad copy in minutes</p>
        </div>
        {/* Error Display */}
        {error && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-2xl text-red-700 text-xs sm:text-sm">
            {error}
          </div>
        )}


        {/* Step 1: Initial Prompt */}
        {step === 1 && (
          <>
            {/* How It Works Section */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/60 shadow-2xl p-6 sm:p-8 md:p-10 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-light text-gray-800 mb-4 sm:mb-6 text-center">How It Works</h2>
              
              {/* Instructions */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-light">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 text-sm sm:text-base">Describe Your Product</h3>
                    <p className="text-xs sm:text-sm text-gray-600 font-light">Tell us what you want to advertise in simple words</p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-light">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 text-sm sm:text-base">Customize Details</h3>
                    <p className="text-xs sm:text-sm text-gray-600 font-light">Answer a few questions about your target audience and preferences</p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-light">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 text-sm sm:text-base">Get Your Ad</h3>
                    <p className="text-xs sm:text-sm text-gray-600 font-light">AI generates a professional ad image ready to download and use</p>
                  </div>
                </div>
              </div>

              {/* Video Tutorial */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 text-center">Watch Tutorial</h3>
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/Gz1P7K_Yy_s"
                    title="AdWiz Tutorial"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Input Section */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/60 shadow-2xl p-6 sm:p-8 md:p-10">
              <label className="block text-xs sm:text-sm font-light text-gray-700 mb-3 sm:mb-4">
                What would you like to advertise?
              </label>
              <input
                type="text"
                value={initialPrompt}
                onChange={(e) => setInitialPrompt(e.target.value)}
                placeholder="e.g., make an ad for sweatshirts"
                className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/80 border-0 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-400 outline-none mb-4 sm:mb-6 text-sm sm:text-base text-gray-800 placeholder-gray-400"
                onKeyPress={(e) =>
                  e.key === "Enter" && !loading && initialPrompt && generateForm()
                }
              />
              <button
                onClick={generateForm}
                disabled={loading || !initialPrompt}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-light text-sm sm:text-base"
              >
                {loading ? "Generating..." : "Continue"}
              </button>
            </div>
            
          </>
          
        )}

        
        {/* Step 2: Form Questions */}
        {step === 2 && (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/60 shadow-2xl p-6 sm:p-8 md:p-10">
            <h2 className="text-lg sm:text-xl font-light text-gray-800 mb-6 sm:mb-8">Customize Your Ad</h2>
            <div className="space-y-4 sm:space-y-6">
              {formQuestions.map((q, idx) => (
                <div key={idx}>
                  <label className="block text-xs sm:text-sm font-light text-gray-700 mb-2 sm:mb-3">
                    {q.question}
                  </label>
                  {q.options?.length > 0 ? (
                    <select
                      value={formAnswers[idx] || ""}
                      onChange={(e) =>
                        setFormAnswers({ ...formAnswers, [idx]: e.target.value })
                      }
                      className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white/80 border-0 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-400 outline-none text-sm sm:text-base text-gray-800"
                    >
                      <option value="">Select an option</option>
                      {q.options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formAnswers[idx] || ""}
                      onChange={(e) =>
                        setFormAnswers({ ...formAnswers, [idx]: e.target.value })
                      }
                      className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white/80 border-0 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-400 outline-none text-sm sm:text-base text-gray-800"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={reset}
                className="w-full sm:flex-1 bg-white/80 text-gray-700 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-white transition-all font-light text-sm sm:text-base"
              >
                Start Over
              </button>
              <button
                onClick={generateImagePrompt}
                disabled={loading}
                className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-light flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        )}


        {/* Step 3: Generated Image */}
        {step === 3 && generatedImage && (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/60 shadow-2xl p-6 sm:p-8 md:p-10">
            <h2 className="text-lg sm:text-xl font-light text-gray-800 mb-6 sm:mb-8">Your Ad</h2>
            <div className="mb-6 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
              <img src={generatedImage} alt="Generated ad" className="w-full h-auto" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={reset}
                className="w-full sm:flex-1 bg-white/80 text-gray-700 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-white transition-all font-light text-sm sm:text-base"
              >
                Create New Ad
              </button>
              <a
                href={generatedImage}
                download="ad-image.png"
                className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:shadow-xl transition-all font-light text-center text-sm sm:text-base"
              >
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}