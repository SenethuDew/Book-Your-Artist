"use client";

import React, { useState } from 'react';
import { Camera, Music, Calendar, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

export default function CreativeArtistProfileForm() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const [formData, setFormData] = useState({
    stageName: '',
    category: '',
    bio: '',
    basePrice: '',
    travelRadius: ''
  });

  const handleCreateProfile = async () => {
    try {
      // Assuming /api/artists/profile takes genres, hourlyRate, travelRadius based on schema
      await apiCall('/api/artists/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genres: [formData.category],
          hourlyRate: Number(formData.basePrice) || 10,
          travelRadius: Number(formData.travelRadius) || 10,
        })
      });
      // Ideally we would also update the User document for stageName and bio if the backend supported it, 
      // but let's at least make the ArtistProfile so they exist as an artist!
      router.push('/home/artist');
    } catch (e: any) {
      console.error(e);
      alert('Failed to save profile: ' + (e.message || e.toString()));
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 tracking-tight">
            Craft Your Artist Persona
          </h2>
          <p className="mt-4 text-xl text-gray-400 font-light">
            Stand out from the crowd and let your talent shine.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-center items-center mb-12 space-x-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${
                  step >= num
                    ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {step > num ? <CheckCircle2 className="w-6 h-6" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={`w-24 h-1 mx-2 rounded transition-all duration-500 ${
                    step > num ? 'bg-purple-500' : 'bg-gray-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-gray-100">
          <div className="p-8 sm:p-12">
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              {/* STEP 1: Basic Info & Branding */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Music /></div>
                    <h3 className="text-2xl font-bold">The Basics</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold tracking-wide text-gray-300">Stage Name *</label>
                      <input type="text" value={formData.stageName} onChange={e => setFormData({...formData, stageName: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600 outline-none" placeholder="e.g. DJ Sparkle" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold tracking-wide text-gray-300">Category *</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer">
                        <option value="">Select your craft...</option>
                        <option value="DJ">DJ</option>
                        <option value="Band">Live Band</option>
                        <option value="Singer">Solo Singer</option>
                        <option value="Magician">Magician</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold tracking-wide text-gray-300">Your Bio / Elevator Pitch</label>
                    <textarea rows={4} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600 outline-none resize-none" placeholder="Tell event organizers what makes your performance unforgettable..."></textarea>
                  </div>
                </div>
              )}

              {/* STEP 2: Media & Gallery */}
              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400"><Camera /></div>
                    <h3 className="text-2xl font-bold">Visual Identity</h3>
                  </div>

                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-pink-500/50 transition-colors group cursor-pointer bg-black/20">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">Upload Profile Photo</h4>
                    <p className="text-gray-400">Drag & drop or click to browse</p>
                    <p className="text-sm text-gray-500 mt-2">JPEG, PNG, WebP up to 5MB</p>
                  </div>
                </div>
              )}

              {/* STEP 3: Pricing & Logistics */}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Calendar /></div>
                    <h3 className="text-2xl font-bold">Booking Details</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold tracking-wide text-gray-300">Base Price (Per Hour) *</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                        <input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-5 py-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="150" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold tracking-wide text-gray-300">Travel Radius (miles)</label>
                      <input type="number" value={formData.travelRadius} onChange={e => setFormData({...formData, travelRadius: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="50" />
                    </div>
                  </div>
                </div>
              )}

               {/* Navigation Buttons */}
               <div className="pt-8 mt-8 border-t border-white/10 flex justify-between items-center">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
                    step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  Back
                </button>
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-10 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] transition-all"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateProfile}
                    className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" /> Launch Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}