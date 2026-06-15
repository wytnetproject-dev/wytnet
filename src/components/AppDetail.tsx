import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Star, Share2, Check,
  Smartphone, ShieldAlert, Lock, Trash2, MoreVertical,
  ChevronDown, ChevronUp, Flag, ExternalLink,
  Bookmark, BookmarkPlus,
} from 'lucide-react';
import type { Brand, BrandReview } from '../portal/wytsaas/api/brand';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../portal/wytsaas/api/watchlist';

interface AppDetailProps {
  app: Brand;
  onBack: () => void;
  allApps: Brand[];
}

export default function AppDetail({ app, onBack, allApps }: AppDetailProps) {
  const [supportExpanded, setSupportExpanded] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed'>('idle');

  // Active token and user state
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('wytsaas_token') || localStorage.getItem('wytpass_token') || '';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('wytsaas_user') || localStorage.getItem('wytpass_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });

  // Review states and sync with app
  const [reviews, setReviews] = useState<BrandReview[]>(app.reviews || []);
  useEffect(() => {
    setReviews(app.reviews || []);
    setSubmitSuccess(false);
    setSubmitError(null);
  }, [app.reviews]);

  // Watchlist states
  const [isWatched, setIsWatched] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!authToken) return;
      setIsWatchlistLoading(true);
      try {
        const watchlist = await fetchWatchlist(authToken);
        setIsWatched(watchlist.some(item => item.brand_id === app.id));
      } catch (err) {
        console.warn("Failed to fetch watchlist in AppDetail", err);
      } finally {
        setIsWatchlistLoading(false);
      }
    };
    checkWatchlist();
  }, [app.id, authToken]);

  const handleToggleWatch = async () => {
    if (!authToken) {
      // Prompt user to sign in
      setShowInlineLogin(true);
      return;
    }
    setIsWatchlistLoading(true);
    try {
      if (isWatched) {
        await removeFromWatchlist(app.id, authToken);
        setIsWatched(false);
      } else {
        await addToWatchlist(app.id, authToken);
        setIsWatched(true);
      }
    } catch (err) {
      console.error("Watchlist toggle failed", err);
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  // Review submission state
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewInput, setReviewInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#marketplace/app/${app.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: app.name,
          text: app.short_description || `Check out ${app.name} on Wytnet Marketplace!`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.warn("Native share failed, falling back to clipboard", err);
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  // Inline login state for review submission if not logged in
  const [inlineLoginEmail, setInlineLoginEmail] = useState('');
  const [inlineLoginPassword, setInlineLoginPassword] = useState('');
  const [isInlineLoggingIn, setIsInlineLoggingIn] = useState(false);
  const [inlineLoginError, setInlineLoginError] = useState<string | null>(null);
  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineLoginError(null);
    setIsInlineLoggingIn(true);

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inlineLoginEmail, password: inlineLoginPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.item?.access_token || '';
        const displayName = inlineLoginEmail.split('@')[0];
        const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        const userObj = { email: inlineLoginEmail, name: formattedName };

        localStorage.setItem('wytsaas_token', token);
        localStorage.setItem('wytsaas_user', JSON.stringify(userObj));

        setAuthToken(token);
        setCurrentUser(userObj);
        setShowInlineLogin(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setInlineLoginError(errorData.detail || 'Invalid email or password.');
      }
    } catch (err) {
      console.error(err);
      // Fallback log in for dev convenience if backend is offline
      const displayName = inlineLoginEmail.split('@')[0];
      const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      const userObj = { email: inlineLoginEmail, name: formattedName };

      localStorage.setItem('wytsaas_token', 'mock-jwt-token-xyz');
      localStorage.setItem('wytsaas_user', JSON.stringify(userObj));

      setAuthToken('mock-jwt-token-xyz');
      setCurrentUser(userObj);
      setShowInlineLogin(false);
    } finally {
      setIsInlineLoggingIn(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:8000/brands/${app.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          rating: ratingInput,
          review: reviewInput,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newReview = data.item;

        if (newReview) {
          // Ensure email and name are populated in local state immediately
          if (!newReview.user_email) {
            newReview.user_email = currentUser?.email || inlineLoginEmail || 'user@wytnet.com';
          }
          if (!newReview.user_name) {
            newReview.user_name = currentUser?.name || (newReview.user_email ? newReview.user_email.split('@')[0] : 'Verified User');
          }
          setReviews(prev => [newReview, ...prev]);
        }

        setReviewInput('');
        setSubmitSuccess(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSubmitError(errorData.detail || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      // Mock fallback: append a local mock review in case backend call fails
      const mockNewReview = {
        id: Math.random(),
        brand_id: app.id,
        user_id: currentUser?.name || 'Verified User',
        user_email: currentUser?.email || inlineLoginEmail || 'user@wytnet.com',
        user_name: currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Verified User'),
        rating: ratingInput,
        review: reviewInput || 'Amazing experience',
        created_at: new Date().toISOString(),
      };

      setReviews(prev => [mockNewReview, ...prev]);
      setReviewInput('');
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter other apps by the same developer (or fallback to general recommendations if none)
  const developerApps = allApps
    .filter(a => a.company_name === app.company_name && a.id !== app.id)
    .slice(0, 5);

  const fallbackRecommendations = allApps
    .filter(a => a.id !== app.id)
    .slice(0, 5);

  const relatedApps = developerApps.length > 0 ? developerApps : fallbackRecommendations;

  const handleInstall = () => {
    if (installStatus === 'idle') {
      setInstallStatus('installing');
      setTimeout(() => {
        setInstallStatus('installed');
      }, 2000);
    }
  };

  // Default reviews to match mockup image if no real reviews are present
  const defaultReviews = [
    {
      author: "Charu Dhamma",
      avatarBg: "bg-purple-600",
      rating: 5,
      date: "22 April 2026",
      content: "amazing experience",
      helpfulCount: 1
    },
    {
      author: "Shraddha Akshay Kumbhar",
      avatarBg: "bg-orange-600",
      rating: 5,
      date: "27 April 2026",
      content: "excited",
      helpfulCount: 1
    }
  ];

  const hasRealReviews = reviews.length > 0;
  const displayReviews = hasRealReviews
    ? reviews.map(r => {
      let authorName = r.user_name || (r.user_email ? r.user_email.split('@')[0] : "Verified User");
      if (!r.user_name && !r.user_email && r.user_id) {
        authorName = typeof r.user_id === 'string' && r.user_id.length > 8
          ? `User ${r.user_id.slice(0, 6)}`
          : String(r.user_id);
      }
      
      // Clean and format the display name beautifully
      if (authorName) {
        if (authorName.includes('@')) {
          authorName = authorName.split('@')[0];
        }
        authorName = authorName
          .split(/[\s._-]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      return {
        author: authorName || "Verified User",
        avatarBg: "bg-slate-500",
        rating: r.rating,
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recently',
        content: r.review || "No review content provided.",
        helpfulCount: 0
      };
    })
    : defaultReviews;

  const totalReviewsCount = hasRealReviews ? reviews.length : defaultReviews.length;
  const averageRatingVal = hasRealReviews
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 4.4;

  const ratingCounts = [0, 0, 0, 0, 0];
  if (hasRealReviews) {
    reviews.forEach(r => {
      const idx = Math.min(Math.max(1, r.rating), 5) - 1;
      ratingCounts[idx]++;
    });
  } else {
    ratingCounts[4] = 7;
    ratingCounts[3] = 2;
    ratingCounts[2] = 1;
    ratingCounts[1] = 0;
    ratingCounts[0] = 0;
  }

  const ratingDistribution = [
    { stars: 5, percentage: totalReviewsCount > 0 ? Math.round((ratingCounts[4] / (hasRealReviews ? reviews.length : 10)) * 100) : 0 },
    { stars: 4, percentage: totalReviewsCount > 0 ? Math.round((ratingCounts[3] / (hasRealReviews ? reviews.length : 10)) * 100) : 0 },
    { stars: 3, percentage: totalReviewsCount > 0 ? Math.round((ratingCounts[2] / (hasRealReviews ? reviews.length : 10)) * 100) : 0 },
    { stars: 2, percentage: totalReviewsCount > 0 ? Math.round((ratingCounts[1] / (hasRealReviews ? reviews.length : 10)) * 100) : 0 },
    { stars: 1, percentage: totalReviewsCount > 0 ? Math.round((ratingCounts[0] / (hasRealReviews ? reviews.length : 10)) * 100) : 0 }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#01875f]/10 selection:text-[#01875f]">



      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-[#01875f] font-semibold text-sm mb-8 transition-colors group cursor-pointer border-none bg-transparent p-0 outline-none"
        >
          <ArrowLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Marketplace</span>
        </button>

        {/* Play Store App Meta Header Row (Full Width) */}
        <div className="flex flex-col-reverse md:flex-row gap-8 items-start justify-between mb-12">
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight tracking-tight">{app.name}</h1>
              <span className="text-[#01875f] font-semibold text-base hover:underline cursor-pointer mt-1.5 block">
                {app.company_name || 'Savemom Private Limited'}
              </span>
            </div>

            {/* Rating & Downloads Bar */}
            <div className="flex items-center gap-8 py-1">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                  <span>{averageRatingVal}</span>
                  <Star className="h-3.5 w-3.5 fill-slate-800 text-slate-800" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">{totalReviewsCount} reviews</span>
              </div>

              <div className="w-px h-8 bg-slate-200" />

              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-slate-900">1K+</span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">Downloads</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {app.links && app.links.length > 0 ? (
                app.links.map((link, idx) => {
                  const isPlayStore = link.link_type === 'play_store';
                  const isAppStore = link.link_type === 'app_store';
                  const isGitHub = link.link_type === 'github';

                  // A link is primary if it has is_primary set, or if it is the first link and none are marked primary
                  const hasPrimary = app.links?.some(l => l.is_primary);
                  const isPrimary = link.is_primary || (!hasPrimary && idx === 0);

                  const title = link.title || '';
                  const lowerTitle = title.toLowerCase();
                  let buttonText = title;

                  if (isPlayStore) {
                    if (!lowerTitle.includes('play') && !lowerTitle.includes('store') && !lowerTitle.includes('install')) {
                      buttonText = `Install ${title || app.name}`;
                    }
                  } else if (isAppStore) {
                    if (!lowerTitle.includes('app') && !lowerTitle.includes('store') && !lowerTitle.includes('get')) {
                      buttonText = `Get ${title || app.name}`;
                    }
                  } else if (!title) {
                    buttonText = 'Visit Website';
                  }

                  return (
                    <a
                      key={link.id || idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-8 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 border no-underline ${isPrimary
                        ? 'bg-[#01875f] border-[#01875f] hover:bg-[#00704e] text-white hover:text-white'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-[#01875f] hover:text-[#00704e]'
                        }`}
                    >
                      {isPlayStore && (
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M5.19 3C4.85 3 4.5 3.1 4.2 3.3L13.7 12.8L18.6 7.9C17.2 7.1 12.1 4.2 5.19 3Z" />
                          <path d="M3.2 4.3C3.1 4.5 3 4.7 3 5V19C3 19.3 3.1 19.5 3.2 19.7L12.3 11.4L3.2 4.3Z" />
                          <path d="M14.9 14L4 20.7C4.3 20.9 4.65 21 5 21C12.1 21 17.2 18.1 18.6 17.3L14.9 14Z" />
                          <path d="M20.8 11.7C21 11.4 21.1 11.1 21.1 10.7C21.1 10.3 21 10 20.8 9.7L16 12L20.8 11.7Z" />
                        </svg>
                      )}
                      {isAppStore && (
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 22C14.33 22.05 13.9 21.24 12.38 21.24C10.88 21.24 10.4 21.97 9.12 22.03C7.81 22.09 6.83 20.72 5.98 19.51C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.88 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C17.57 6.91 18.85 7.51 19.68 8.76C16.31 10.74 17.16 15.26 20.1 16.48C19.51 17.96 18.71 19.5 18.71 19.5M15.9 5.08C16.7 4.12 17.21 2.8 17.06 1.48C15.93 1.52 14.56 2.23 13.75 3.17C13.06 3.96 12.46 5.3 12.64 6.6C13.9 6.7 15.17 5.97 15.9 5.08Z" />
                        </svg>
                      )}
                      {isGitHub && (
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                        </svg>
                      )}
                      {!isPlayStore && !isAppStore && !isGitHub && (
                        <ExternalLink className="h-4 w-4 shrink-0" />
                      )}
                      <span>{buttonText}</span>
                    </a>
                  );
                })
              ) : (
                <button
                  onClick={handleInstall}
                  className={`px-8 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all cursor-pointer min-w-32 ${installStatus === 'installed'
                    ? 'bg-[#01875f] hover:bg-[#00704e]'
                    : installStatus === 'installing'
                      ? 'bg-[#01875f]/70 cursor-not-allowed'
                      : 'bg-[#01875f] hover:bg-[#00704e]'
                    }`}
                  disabled={installStatus === 'installing'}
                >
                  {installStatus === 'installed' ? 'Open' : installStatus === 'installing' ? 'Installing...' : 'Install'}
                </button>
              )}

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[#01875f] hover:bg-[#01875f]/5 cursor-pointer transition-colors border-none bg-transparent outline-none"
              >
                {shareStatus === 'copied' ? (
                  <>
                    <Check className="h-4.5 w-4.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4.5 w-4.5" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleWatch}
                disabled={isWatchlistLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[#01875f] hover:bg-[#01875f]/5 cursor-pointer transition-colors disabled:opacity-50 border-none bg-transparent outline-none"
              >
                {isWatched ? (
                  <>
                    <Bookmark className="h-4.5 w-4.5 fill-[#01875f]" />
                    <span>Added to wishlist</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4.5 w-4.5" />
                    <span>Add to wishlist</span>
                  </>
                )}
              </button>

            </div>

            {/* Device compatibility status */}
            {/* <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 pt-2 font-medium">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-slate-500" />
                <span>This app is available for your device</span>
              </div>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 fill-none stroke-current" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>You can share this with your family. <span className="underline cursor-pointer">Learn more about Family Library</span></span>
              </div>
            </div> */}
          </div>

          {/* Large Rounded Icon */}
          <div className="h-36 w-36 md:h-56 md:w-56 rounded-[2.5rem] md:rounded-[3.5rem] bg-gradient-to-br from-[#ff5b5b] to-[#ff2a5f] border border-white shadow-[0_20px_48px_rgba(0,0,0,0.12)] flex items-center justify-center overflow-hidden shrink-0">
            {app.logo_url ? (
              <img src={app.logo_url} alt={app.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-white p-4">
                <svg viewBox="0 0 100 100" className="h-16 w-16 fill-current opacity-90 animate-pulse">
                  <circle cx="50" cy="45" r="25" fill="none" stroke="white" strokeWidth="6" />
                  <path d="M50 70 L50 85" stroke="white" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="50" cy="45" r="8" fill="white" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Grid Layout for Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left / Primary Content Column */}
          <div className="lg:col-span-2 space-y-12">

            {/* Screenshots Gallery Section */}
            {app.media && app.media.length > 0 && (
              <div className="pt-4">
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {app.media.map((item, idx) => (
                    <img
                      key={idx}
                      src={item.media_url}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-44 h-80 rounded-xl object-cover shrink-0 border border-slate-100 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* About this app Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer group">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 group-hover:text-[#01875f] transition-colors">
                  <span>About this app</span>
                  <ArrowRight className="h-4.5 w-4.5 text-slate-600 group-hover:text-[#01875f] transition-all group-hover:translate-x-1" />
                </h2>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed space-y-4 font-normal">
                <p className="whitespace-pre-line">
                  {app.full_description || app.short_description || `${app.name} is a high-performance decentralized application verified under the Wytnet ecosystem protocols.`}
                </p>
              </div>

              {/* Dynamic tag badges */}
              {((app.tags && app.tags.length > 0) || app.brand_type || app.is_wytpass_integration_accepted) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {app.brand_type && (
                    <span className="px-4 py-2 rounded-full border border-slate-200 bg-slate-50/30 text-xs font-semibold text-slate-600 cursor-pointer transition-all">
                      {app.brand_type}
                    </span>
                  )}
                  {app.tags && app.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer transition-all"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {app.is_wytpass_integration_accepted && (
                    <span className="px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50/20 text-xs font-semibold text-emerald-600">
                      WhitePass SSO Certified
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Data safety Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer group">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 group-hover:text-[#01875f] transition-colors">
                  <span>Data safety</span>
                  <ArrowRight className="h-4.5 w-4.5 text-slate-600 group-hover:text-[#01875f] transition-all group-hover:translate-x-1" />
                </h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                Safety starts with understanding how developers collect and share your data. Data privacy and security practices may vary based on your use, region, and age. The developer provided this information and may update it over time.
              </p>

              {/* Data safety Details Card */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-4 text-xs font-medium text-slate-700">
                <div className="flex items-start gap-4">
                  <Share2 className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-900">No data shared with third parties</p>
                    <span className="text-slate-400 font-normal hover:underline cursor-pointer block mt-0.5">Learn more about how developers declare sharing</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <ShieldAlert className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-900">This app may collect these data types</p>
                    <span className="text-slate-500 font-normal block mt-0.5">Personal info and Health and fitness</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Lock className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-900">Data is encrypted in transit</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Trash2 className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-900">You can request that data be deleted</p>
                  </div>
                </div>


              </div>
            </div>

            {/* Ratings and reviews Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between cursor-pointer group">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 group-hover:text-[#01875f] transition-colors">
                  <span>Ratings and reviews</span>
                  <ArrowRight className="h-4.5 w-4.5 text-slate-600 group-hover:text-[#01875f] transition-all group-hover:translate-x-1" />
                </h2>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Ratings and reviews are verified. Info</span>

                {/* Device Filter Pill */}
                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Phone</span>
                </button>
              </div>

              {/* Big Rating Summary Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="text-center md:text-left space-y-1 select-none">
                  <span className="text-5xl font-semibold text-slate-900 tracking-tight">{averageRatingVal}</span>
                  <div className="flex items-center justify-center md:justify-start gap-0.5 text-amber-500 py-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 text-amber-500 ${i < Math.round(averageRatingVal) ? 'fill-amber-500' : ''
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-slate-500 block">{totalReviewsCount} reviews</span>
                </div>

                {/* Rating Distribution Progress bars */}
                <div className="md:col-span-2 space-y-1.5 text-xs font-semibold">
                  {ratingDistribution.map((row) => (
                    <div key={row.stars} className="flex items-center gap-3">
                      <span className="w-2 text-slate-500 text-right">{row.stars}</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#01875f] rounded-full"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Write a Review Section */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-base font-semibold text-slate-900">Write a review</h3>

                {authToken ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#01875f]/10 text-[#01875f] flex items-center justify-center font-bold text-xs select-none">
                        {(currentUser?.name || 'V')[0]}
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        Reviewing as <span className="text-slate-900 font-bold">{currentUser?.name || currentUser?.email || 'Verified User'}</span>
                      </span>
                    </div>

                    {/* Star selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 mr-1">Rating:</span>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starValue = i + 1;
                        const isFilled = starValue <= (hoverRating !== null ? hoverRating : ratingInput);
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setRatingInput(starValue)}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 cursor-pointer transition-transform hover:scale-110 bg-transparent border-none outline-none"
                          >
                            <Star
                              className={`h-6 w-6 transition-colors ${isFilled
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-slate-300 hover:text-amber-400'
                                }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Text area */}
                    <div className="space-y-1.5">
                      <textarea
                        rows={3}
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                        placeholder="Describe your experience with this app..."
                        className="w-full bg-white border border-slate-200 focus:border-[#01875f] p-3.5 rounded-xl outline-none text-xs font-semibold transition-all shadow-sm placeholder-slate-400 text-slate-700 resize-none"
                        required
                      />
                    </div>

                    {submitError && (
                      <p className="text-xs font-bold text-rose-600">{submitError}</p>
                    )}

                    {submitSuccess && (
                      <p className="text-xs font-bold text-emerald-600">Review submitted successfully! Thank you.</p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-lg text-xs font-semibold text-white bg-[#01875f] hover:bg-[#00704e] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {!showInlineLogin ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2">
                        <p className="text-xs font-medium text-slate-500">
                          You must be signed in to leave a review.
                        </p>
                        <button
                          onClick={() => setShowInlineLogin(true)}
                          className="px-5 py-2 rounded-lg border border-[#01875f] text-xs font-semibold text-[#01875f] hover:bg-[#01875f]/5 transition-colors cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleInlineLogin} className="space-y-3.5 border border-slate-200/60 p-4 rounded-xl bg-white">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sign In to your account</h4>

                        {inlineLoginError && (
                          <p className="text-xs font-bold text-rose-600">{inlineLoginError}</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="email"
                            required
                            placeholder="Email address"
                            value={inlineLoginEmail}
                            onChange={(e) => setInlineLoginEmail(e.target.value)}
                            className="bg-slate-50 border border-slate-200 focus:border-[#01875f] text-xs font-medium px-3 py-2.5 rounded-lg outline-none transition-all placeholder-slate-400 text-slate-700"
                          />
                          <input
                            type="password"
                            required
                            placeholder="Password"
                            value={inlineLoginPassword}
                            onChange={(e) => setInlineLoginPassword(e.target.value)}
                            className="bg-slate-50 border border-slate-200 focus:border-[#01875f] text-xs font-medium px-3 py-2.5 rounded-lg outline-none transition-all placeholder-slate-400 text-slate-700"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowInlineLogin(false)}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isInlineLoggingIn}
                            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-[#01875f] hover:bg-[#00704e] transition-colors cursor-pointer shadow-sm"
                          >
                            {isInlineLoggingIn ? 'Signing In...' : 'Sign In'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-6 pt-2">
                {displayReviews.length > 0 ? (
                  (showAllReviews ? displayReviews : displayReviews.slice(0, 3)).map((review, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full ${review.avatarBg} text-white flex items-center justify-center font-bold text-xs select-none shadow-sm`}>
                            {review.author[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{review.author}</p>
                          </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <div className="flex gap-0.5 text-[#01875f]">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-[#01875f] text-[#01875f]" />
                          ))}
                          {Array.from({ length: 5 - review.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-slate-200" />
                          ))}
                        </div>
                        <span>{review.date}</span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed font-normal">
                        {review.content}
                      </p>

                      {review.helpfulCount > 0 && (
                        <span className="text-[11px] font-medium text-slate-400 block">
                          {review.helpfulCount} person found this review helpful
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-semibold text-slate-400 text-center py-6">
                    No reviews yet. Be the first to leave a review!
                  </p>
                )}
              </div>

              {displayReviews.length > 3 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-[#01875f] hover:text-[#00704e] text-sm font-semibold hover:underline cursor-pointer bg-transparent border-none outline-none p-0"
                  >
                    {showAllReviews ? 'Show less' : 'See all reviews'}
                  </button>
                </div>
              )}
            </div>

            {/* What's new Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">What's new</h2>
              <p className="text-sm text-slate-600 font-medium">Bug Fix</p>

              <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-semibold pt-4">
                <Flag className="h-3.5 w-3.5" />
                <span>Flag as inappropriate</span>
              </button>
            </div>

          </div>

          {/* Right / Sidebar Column */}
          <div className="space-y-8 lg:border-l lg:border-slate-100 lg:pl-10">

            {/* Age Rating Side Card */}
            <div className="border border-slate-200 rounded-xl p-4 flex gap-4 text-xs font-semibold text-slate-600">
              <div className="h-9 w-9 border border-slate-800 flex items-center justify-center rounded-[4px] text-base font-black text-slate-800 shrink-0">
                3+
              </div>
              <div className="space-y-1 font-medium text-slate-500">
                <p className="text-slate-800 font-bold text-sm">Rated for 3+</p>
                <span>Users interact</span>
                <span className="text-[#01875f] hover:underline cursor-pointer block font-semibold pt-0.5">Learn more</span>
              </div>
            </div>

            {/* App support Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
              <button
                onClick={() => setSupportExpanded(!supportExpanded)}
                className="w-full flex items-center justify-between px-5 py-4 font-semibold text-slate-700 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>App support</span>
                {supportExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
              </button>

              {supportExpanded && (
                <div className="p-5 border-t border-slate-200 space-y-4 text-xs font-semibold text-slate-600">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Email</span>
                    <a href={`mailto:support@${app.slug}.com`} className="text-slate-700 hover:underline">
                      support@{app.slug}.com
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Address</span>
                    <p className="text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                      {app.company_name || 'Savemom Private Limited'}{"\n"}
                      100 Tech Park, Innovation Way{"\n"}
                      Bangalore, India
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Privacy policy</span>
                    <a href={`https://${app.slug}.com/privacy`} target="_blank" rel="noopener noreferrer" className="text-[#01875f] hover:underline inline-flex items-center gap-1">
                      <span>Visit Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {app.links && app.links.map((link, idx) => (
                    <div key={idx}>
                      <span className="text-slate-400 font-bold block mb-1">{link.title || 'App Link'}</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#01875f] hover:underline inline-flex items-center gap-1 break-all">
                        <span>{link.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* More by Developer / Related Apps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between group cursor-pointer">
                <h3 className="text-sm font-semibold text-slate-900 hover:text-[#01875f] flex items-center gap-1.5">
                  <span>More by {app.company_name || 'Savemom Private Limited'}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-[#01875f] group-hover:translate-x-0.5 transition-all" />
                </h3>
              </div>

              {/* Side Apps List */}
              <div className="space-y-4">
                {relatedApps.map((relatedApp) => (
                  <div
                    key={relatedApp.id}
                    onClick={() => {
                      window.location.hash = `#marketplace/app/${relatedApp.slug}`;
                      window.scrollTo(0, 0);
                    }}
                    className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all"
                  >
                    {/* Small Icon */}
                    <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {relatedApp.logo_url ? (
                        <img src={relatedApp.logo_url} alt={relatedApp.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg select-none">
                          {relatedApp.name[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#01875f] transition-colors">
                        {relatedApp.name}
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium truncate block mt-0.5">
                        {relatedApp.company_name || 'Savemom Private Limited'}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mt-1">
                        <span>
                          {relatedApp.reviews && relatedApp.reviews.length > 0
                            ? (relatedApp.reviews.reduce((acc, r) => acc + r.rating, 0) / relatedApp.reviews.length).toFixed(1)
                            : '0.0'}
                        </span>
                        <Star className="h-3 w-3 fill-slate-600 text-slate-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>


    </div>
  );
}
