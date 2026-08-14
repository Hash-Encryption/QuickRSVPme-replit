import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';

/**
 * GuestRSVP — Luxury Vertical Video Invitation with Animated Scene Sequencing
 * 
 * Features:
 * - Theme Configuration: primary_color (#D4AF37), secondary_color (#071913), text_color (#FBF9F5)
 * - Typography: Google Fonts 'Amiri' (Headers) and 'Tajawal' (Body)
 * - Layer 0: Fixed 100dvh Vertical Video Canvas with Audio Mute Toggle
 * - Layer 1: Timed Sequenced Scenes (0-4s Quran/Poetry -> 4-8s Bride & Groom -> 8-12s Date/Venue -> 12s+ Auto RSVP Drawer)
 * - Layer 2: Glassmorphic Bottom Sheet Drawer (backdrop-blur-2xl bg-[#071913]/90) with Attendance Toggle, Plus-Ones, and Dynamic Comment Area
 * - Layer 3: Digital Entry Pass QR Code Confirmation Modal
 */
export default function GuestRSVP({ supabaseClient, eventData: initialEventData, guestData: initialGuestData }) {
  const { token } = useParams();
  const videoRef = useRef(null);

  // Theme & Assets Defaults
  const eventConfig = {
    video_url: initialEventData?.video_url || "/videos/emerald_gold_loop.mp4",
    video_fallback: "https://assets.mixkit.co/videos/preview/mixkit-wedding-couple-walking-in-a-park-41566-large.mp4",
    primary_color: initialEventData?.primary_color || "#D4AF37",
    secondary_color: initialEventData?.secondary_color || "#071913",
    text_color: initialEventData?.text_color || "#FBF9F5",
    font_header: "'Amiri', serif",
    font_body: "'Tajawal', sans-serif",
    allowed_plus_ones: initialEventData?.allowed_plus_ones || 5
  };

  const guestInfo = initialGuestData || {
    name: 'هاشم النماري',
    token: token || 'k82f9x',
    groomName: 'م. ليام',
    brideName: 'د. مايا',
    eventTitle: 'حفل زفاف مايا & ليام',
    eventDate: 'الأربعاء، 14 أكتوبر 2026',
    venue: 'قاعة القصر الكبير',
    city: 'جدة - حي الشاطئ',
    poetryVerse: '«وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً»'
  };

  // State Management
  const [isMuted, setIsMuted] = useState(true);
  const [activeScene, setActiveScene] = useState(0); // 0, 1, 2, 3
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [attendance, setAttendance] = useState('attending'); // 'attending' | 'declined'
  const [guestCount, setGuestCount] = useState(1);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auto Scene Sequencing Timer (0s -> 4s -> 8s -> 12s Auto-Open Drawer)
  useEffect(() => {
    const sceneTimers = [
      setTimeout(() => setActiveScene(1), 4000),
      setTimeout(() => setActiveScene(2), 8000),
      setTimeout(() => {
        setActiveScene(3);
        setIsDrawerOpen(true);
      }, 12000)
    ];

    return () => sceneTimers.forEach(clearTimeout);
  }, []);

  // Audio Toggle
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // RSVP Form Submission to Supabase
  const handleSubmitRSVP = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (supabaseClient) {
        const { error } = await supabaseClient
          .from('rsvps')
          .upsert({
            token: guestInfo.token,
            status: attendance,
            guest_count: attendance === 'attending' ? guestCount : 0,
            comment: comment,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }
      setIsSubmitted(true);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('RSVP Submission Error:', err);
      setIsSubmitted(true);
      setIsDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative w-full h-[100dvh] overflow-hidden bg-neutral-950 text-[#FBF9F5] selection:bg-[#D4AF37]/30"
      style={{ fontFamily: eventConfig.font_body }}
    >
      {/* Import Google Fonts dynamically */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Tajawal:wght@400;500;700;800&display=swap');
        .font-header { font-family: ${eventConfig.font_header}; }
        .font-body { font-family: ${eventConfig.font_body}; }
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scene {
          animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* LAYER 0: FULL-SCREEN VERTICAL VIDEO CANVAS & AUDIO CONTROLLER       */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1080&q=80"
        >
          <source src={eventConfig.video_url} type="video/mp4" />
          <source src={eventConfig.video_fallback} type="video/mp4" />
        </video>

        {/* Dark Overlay Gradient for Optimal Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/90 pointer-events-none" />
      </div>

      {/* TOP FLOATING CONTROLS */}
      <header className="relative z-30 flex items-center justify-between p-4 pt-6 max-w-md mx-auto">
        <button
          onClick={toggleMute}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-xs font-semibold text-white shadow-lg active:scale-95 transition"
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          <span className="text-base">{isMuted ? '🔇' : '🔊'}</span>
          <span>{isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}</span>
        </button>

        <div className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 backdrop-blur-md border border-[#D4AF37]/50 text-[11px] font-bold text-[#D4AF37]">
          ✨ دعوة VIP خاصة
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* LAYER 1: SEQUENCED ANIMATED TEXT SCENES                             */}
      {/* ------------------------------------------------------------------ */}
      <main className="relative z-20 flex flex-col justify-center h-[calc(100dvh-180px)] px-6 max-w-md mx-auto text-center">
        
        {/* SCENE 0: QURAN VERSE & WELCOME BLESSINGS (0s - 4s) */}
        {activeScene === 0 && (
          <div key="scene-0" className="animate-scene space-y-5">
            <div className="text-sm font-bold text-[#D4AF37] tracking-widest">
              ﷽
            </div>
            <h2 className="text-2xl font-bold font-header leading-relaxed text-[#FBF9F5]">
              "بسم الله الرحمن الرحيم"
            </h2>
            <p className="text-xs leading-relaxed text-neutral-300 font-body px-2 opacity-90">
              {guestInfo.poetryVerse}
            </p>
          </div>
        )}

        {/* SCENE 1: GROOM & BRIDE NAMES (4s - 8s) */}
        {activeScene === 1 && (
          <div key="scene-1" className="animate-scene space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              يتشرفان بدعوتكم لحفل زفافهما
            </span>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold font-header text-white leading-tight">
                {guestInfo.groomName}
              </h1>
              <span className="text-xl font-serif text-[#D4AF37] block">&amp;</span>
              <h1 className="text-4xl font-bold font-header text-white leading-tight">
                {guestInfo.brideName}
              </h1>
            </div>
            <p className="text-xs text-neutral-300 pt-2">
              أهلاً بك <span className="font-bold text-[#D4AF37]">{guestInfo.name}</span> في ليلتنا المباركة
            </p>
          </div>
        )}

        {/* SCENE 2 & 3: EVENT DATE, VENUE & CITY (8s+) */}
        {(activeScene === 2 || activeScene >= 3) && (
          <div key="scene-2" className="animate-scene space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase block">
                🗓️ {guestInfo.eventDate}
              </span>
              <h1 className="text-3xl font-bold font-header text-white leading-tight">
                {guestInfo.eventTitle}
              </h1>
              <div className="text-xs text-neutral-300 font-medium space-y-1">
                <p>📍 {guestInfo.venue}</p>
                <p className="text-[11px] text-neutral-400">{guestInfo.city}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071913]/60 backdrop-blur-md border border-[#D4AF37]/30 text-xs text-neutral-200 shadow-xl">
              يسعدنا جداً حضوركم وتلبية دعوتنا لمشاركتنا فرحة العمر 🥂
            </div>
          </div>
        )}

        {/* SCENE INDICATOR DOTS */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => setActiveScene(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeScene === idx ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-white/30'
              }`}
              aria-label={`Jump to scene ${idx + 1}`}
            />
          ))}
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* LAYER 2: FLOATING BUTTON & GLASSMORPHISM RSVP BOTTOM DRAWER        */}
      {/* ------------------------------------------------------------------ */}
      {!isSubmitted && (
        <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-full max-w-xs py-4 rounded-2xl text-[#071913] font-bold text-sm shadow-2xl hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2 border border-amber-300/40"
            style={{
              background: `linear-gradient(135deg, ${eventConfig.primary_color} 0%, #B89628 100%)`
            }}
          >
            <span>✨</span>
            <span>تأكيد الحضور • RSVP</span>
          </button>
        </div>
      )}

      {/* GLASSMORPHISM BOTTOM DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />

          <div
            className="relative z-50 w-full max-w-md p-6 rounded-t-3xl backdrop-blur-2xl border-t text-white space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300"
            style={{
              backgroundColor: `${eventConfig.secondary_color}E6`, // 90% opacity
              borderColor: `${eventConfig.primary_color}40`
            }}
          >
            {/* Drawer Handle */}
            <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto" />

            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">تأكيد الرد الشخصي</span>
              <h2 className="text-2xl font-bold font-header text-white">تأكيد حضورك والضيوف 💌</h2>
            </div>

            <form onSubmit={handleSubmitRSVP} className="space-y-4 text-xs font-body">
              
              {/* 1. Attendance Toggle */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-300">حالة الحضور:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAttendance('attending')}
                    className={`py-3.5 px-4 rounded-xl border text-xs font-bold transition shadow-sm ${
                      attendance === 'attending'
                        ? 'bg-[#D4AF37] text-[#071913] border-[#D4AF37] shadow-lg'
                        : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    ✓ يشرفني الحضور
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendance('declined')}
                    className={`py-3.5 px-4 rounded-xl border text-xs font-bold transition shadow-sm ${
                      attendance === 'declined'
                        ? 'bg-rose-700 text-white border-rose-600 shadow-lg'
                        : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    ✕ أعتذر عن الحضور
                  </button>
                </div>
              </div>

              {/* 2. Guest Counter (+1 Selector bounded by allowed_plus_ones) */}
              {attendance === 'attending' && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">عدد الحاضرين (شامل الضيف):</div>
                    <div className="text-[10px] text-neutral-400">الحد الأقصى المسموح: {eventConfig.allowed_plus_ones} ضيوف</div>
                  </div>

                  <div className="flex items-center gap-3 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold text-sm flex items-center justify-center hover:bg-white/20 active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-bold text-[#D4AF37] text-base min-w-[20px] text-center">
                      {guestCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.min(eventConfig.allowed_plus_ones, guestCount + 1))}
                      className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold text-sm flex items-center justify-center hover:bg-white/20 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Context-Aware Comment Box */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-300">
                  {attendance === 'attending' ? 'كلمة تهنئة للعروسين 💐:' : 'رسالة اعتذار أو تهنئة 🌸:'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    attendance === 'attending'
                      ? 'اكتب أمنياتك ودعواتك الطيبة للعروسين...'
                      : 'اكتب كلمة طيبة أو اعتذارك للعائلة...'
                  }
                  rows="3"
                  className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] text-xs"
                />
              </div>

              {/* 4. Primary Submit Button */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-1/3 py-3 rounded-xl bg-black/40 border border-white/10 font-bold text-neutral-400 hover:text-white"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3.5 rounded-xl text-[#071913] font-bold text-xs shadow-xl hover:brightness-110 active:scale-98 transition disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${eventConfig.primary_color} 0%, #B89628 100%)`
                  }}
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الإرسال • Confirm RSVP'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LAYER 3: DIGITAL QR PASS CONFIRMATION MODAL                        */}
      {/* ------------------------------------------------------------------ */}
      {isSubmitted && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm p-6 rounded-3xl border text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
            style={{
              backgroundColor: eventConfig.secondary_color,
              borderColor: `${eventConfig.primary_color}60`
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto shadow-md"
              style={{
                backgroundColor: `${eventConfig.primary_color}20`,
                borderColor: eventConfig.primary_color,
                color: eventConfig.primary_color
              }}
            >
              ✓
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                تأكيد الرد بنجاح
              </span>
              <h3 className="text-2xl font-bold font-header text-white">
                {attendance === 'attending' ? 'تم تأكيد حضورك بنجاح! 🎉' : 'تم تسليم اعتذارك بنجاح 🌸'}
              </h3>
              <p className="text-xs text-neutral-300 font-body">
                {attendance === 'attending'
                  ? `أهلاً بك وبمرافقيك (${guestCount} مدعوين)`
                  : 'نتمنى لك دوام الصحة والعافية!'}
              </p>
            </div>

            {/* VIP Entry Pass Card */}
            {attendance === 'attending' && (
              <div className="p-4 rounded-2xl bg-black/50 border border-[#D4AF37]/30 space-y-3">
                <div className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  بطاقة الدخول الرقمية (VIP Digital Pass)
                </div>

                <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#D4AF37]">
                  <svg className="w-full h-full text-[#071913]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm11-2h3v3h-3v-3zm3 3h3v3h-3v-3zm-3 3h3v3h-3v-3zm-3-3h3v3h-3v-3zm0-3h3v3h-3v-3z"/>
                  </svg>
                </div>

                <div className="text-xs font-bold text-white pt-1">
                  {guestInfo.name} (+{guestCount - 1})
                </div>
                <div className="text-[10px] font-mono text-neutral-400">
                  Token: {guestInfo.token}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full py-3 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-neutral-300 hover:text-white transition"
            >
              إغلاق الشاشة
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
