"use client";
import React, { useState } from "react";
import { Sparkles, ImagePlus } from "lucide-react";

export default function AdCopyGenerator() {
  const [step, setStep] = useState(1);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [formQuestions, setFormQuestions] = useState([]);
  const [formAnswers, setFormAnswers] = useState({});
  const [generatedImage, setGeneratedImage] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState("");
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
      await generateCaption();
    } catch (err) {
      setError(err.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const generateCaption = async () => {
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
              "You are a creative copywriter. Generate a catchy, engaging ad caption based on the product details. Keep it concise (1-2 sentences, max 150 characters). Make it compelling and action-oriented. Return ONLY the caption text.",
          },
          {
            role: "user",
            content: `Original request: "${initialPrompt}". Details: ${answersText}`,
          },
        ],
        temperature: 0.9,
      });

      const caption = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
      setGeneratedCaption(caption);
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to generate caption");
    }
  };

  const reset = () => {
    setStep(1);
    setInitialPrompt("");
    setFormQuestions([]);
    setFormAnswers({});
    setGeneratedImage("");
    setGeneratedCaption("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-20 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4 bg-white/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/60 shadow-lg">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AdWiz
            </h1>
          </div>
          <p className="text-gray-600 text-sm font-light">Generate stunning ad copy in minutes</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Initial Prompt */}
        {step === 1 && (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-10">
            <label className="block text-sm font-light text-gray-700 mb-4">
              What would you like to advertise?
            </label>
            <input
              type="text"
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="e.g., make an ad for sweatshirts"
              className="w-full px-5 py-4 bg-white/80 border-0 rounded-2xl focus:ring-2 focus:ring-purple-400 outline-none mb-6 text-gray-800 placeholder-gray-400"
              onKeyPress={(e) =>
                e.key === "Enter" && !loading && initialPrompt && generateForm()
              }
            />
            <button
              onClick={generateForm}
              disabled={loading || !initialPrompt}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-light"
            >
              {loading ? "Generating..." : "Continue"}
            </button>
          </div>
        )}

        {/* Step 2: Form Questions */}
        {step === 2 && (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-10">
            <h2 className="text-xl font-light text-gray-800 mb-8">Customize Your Ad</h2>
            <div className="space-y-6">
              {formQuestions.map((q, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-light text-gray-700 mb-3">
                    {q.question}
                  </label>
                  {q.options?.length > 0 ? (
                    <select
                      value={formAnswers[idx] || ""}
                      onChange={(e) =>
                        setFormAnswers({ ...formAnswers, [idx]: e.target.value })
                      }
                      className="w-full px-5 py-3 bg-white/80 border-0 rounded-2xl focus:ring-2 focus:ring-purple-400 outline-none text-gray-800"
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
                      className="w-full px-5 py-3 bg-white/80 border-0 rounded-2xl focus:ring-2 focus:ring-purple-400 outline-none text-gray-800"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-10 flex gap-4">
              <button
                onClick={reset}
                className="flex-1 bg-white/80 text-gray-700 py-4 rounded-2xl hover:bg-white transition-all font-light"
              >
                Start Over
              </button>
              <button
                onClick={generateImagePrompt}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-light flex items-center justify-center gap-2"
              >
                <ImagePlus className="w-5 h-5" />
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generated Image */}
        {step === 3 && generatedImage && (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-10">
            <h2 className="text-xl font-light text-gray-800 mb-8">Your Ad</h2>
            <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
              <img src={generatedImage} alt="Generated ad" className="w-full h-auto" />
            </div>
            {generatedCaption && (
              <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50">
                <p className="text-gray-800 text-center text-lg font-light italic">
                  "{generatedCaption}"
                </p>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 bg-white/80 text-gray-700 py-4 rounded-2xl hover:bg-white transition-all font-light"
              >
                Create New Ad
              </button>
              <a
                href={generatedImage}
                download="ad-image.png"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl hover:shadow-xl transition-all font-light text-center"
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