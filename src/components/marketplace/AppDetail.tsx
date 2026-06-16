import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Star, Share2, Check,
  Smartphone, ShieldAlert, Lock, Trash2, MoreVertical,
  ChevronDown, ChevronUp, Flag, ExternalLink,
  Bookmark, BookmarkPlus, X,
} from 'lucide-react';
import type { Brand, BrandReview } from '@/api/wytsaas/brand';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '@/api/wytsaas/watchlist';

interface AppDetailProps {
  app: Brand;
  onBack: () => void;
  allApps: Brand[];
}

export default function AppDetail({ app, onBack, allApps }: AppDetailProps) {
  const [supportExpanded, setSupportExpanded] = useState(false);

  const [modalLoginEmail, setModalLoginEmail] = useState('');
  const [modalLoginPassword, setModalLoginPassword] = useState('');
  const [isModalLoggingIn, setIsModalLoggingIn] = useState(false);
  const [modalLoginError, setModalLoginError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

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

  const [plans, setPlans] = useState<any[]>([]);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [activePlanId, setActivePlanId] = useState<number | null>(() => {
    try {
      const userStr = localStorage.getItem('wytsaas_user') || localStorage.getItem('wytpass_user');
      let userEmail = 'guest';
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.email) {
          userEmail = userObj.email;
        }
      }
      const activeSubs = localStorage.getItem(`mock_user_subscriptions_${userEmail}`);
      if (activeSubs) {
        const parsed = JSON.parse(activeSubs);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed)) {
            return null;
          } else if (parsed[app.id] !== undefined) {
            return Number(parsed[app.id]);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const isSubscribed = () => {
    if (activePlanId !== null) return true;
    try {
      const userStr = localStorage.getItem('wytsaas_user') || localStorage.getItem('wytpass_user');
      let userEmail = 'guest';
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.email) {
          userEmail = userObj.email;
        }
      }
      const activeSubs = localStorage.getItem(`mock_user_subscriptions_${userEmail}`);
      if (activeSubs) {
        const parsed = JSON.parse(activeSubs);
        if (Array.isArray(parsed)) {
          return parsed.includes(app.id);
        } else if (parsed && typeof parsed === 'object') {
          return parsed[app.id] !== undefined;
        }
      }
    } catch {}
    return false;
  };

  // Load Razorpay SDK Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load plans from API or local storage
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const headers: any = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        const response = await fetch(`http://localhost:8000/brands/subscription-plans/?brand_id=${app.id}`, {
          headers
        });
        if (response.ok) {
          const data = await response.json();
          const fetchedPlans = data.items || [];
          if (fetchedPlans.length > 0) {
            setPlans(fetchedPlans);
          } else {
            const storedPlans = localStorage.getItem('mock_subscription_plans');
            if (storedPlans) {
              const allPlans = JSON.parse(storedPlans);
              const brandPlans = Array.isArray(allPlans) ? allPlans.filter((p: any) => p.brand_id === app.id) : [];
              setPlans(brandPlans);
            } else {
              setPlans([]);
            }
          }
        } else {
          throw new Error();
        }
      } catch (err) {
        const storedPlans = localStorage.getItem('mock_subscription_plans');
        if (storedPlans) {
          const allPlans = JSON.parse(storedPlans);
          const brandPlans = Array.isArray(allPlans) ? allPlans.filter((p: any) => p.brand_id === app.id) : [];
          setPlans(brandPlans);
        } else {
          setPlans([]);
        }
      }
    };
    loadPlans();
  }, [app.id]);

  // Load active subscription from API if authenticated
  useEffect(() => {
    const fetchActiveSubscription = async () => {
      if (!authToken) return;
      try {
        const response = await fetch('http://localhost:8000/brands/subscriptions', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const list = data.items || [];
          const matched = list.find((sub: any) => sub.brand_id === app.id && sub.status === 'active');
          if (matched) {
            setActivePlanId(Number(matched.plan_id));
          } else {
            setActivePlanId(null);
          }
        } else {
          throw new Error("Failed to fetch active subscriptions");
        }
      } catch (err) {
        console.warn("Failed to fetch active subscriptions from backend, using local storage fallback", err);
        try {
          const userStr = localStorage.getItem('wytsaas_user') || localStorage.getItem('wytpass_user');
          let userEmail = 'guest';
          if (userStr) {
            const userObj = JSON.parse(userStr);
            if (userObj && userObj.email) {
              userEmail = userObj.email;
            }
          }
          const activeSubs = localStorage.getItem(`mock_user_subscriptions_${userEmail}`);
          if (activeSubs) {
            const parsed = JSON.parse(activeSubs);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed[app.id] !== undefined) {
              setActivePlanId(Number(parsed[app.id]));
              return;
            }
          }
        } catch (e) {
          console.error(e);
        }
        setActivePlanId(null);
      }
    };
    fetchActiveSubscription();
  }, [app.id, authToken]);

  const handleSubscribe = () => {
    if (!authToken) {
      setIsLoginModalOpen(true);
    } else {
      setIsPlansModalOpen(true);
    }
  };

  const handleModalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoginError(null);
    setIsModalLoggingIn(true);

    const completeLogin = (token: string, userObj: any) => {
      localStorage.setItem('wytsaas_token', token);
      localStorage.setItem('wytsaas_user', JSON.stringify(userObj));
      setAuthToken(token);
      setCurrentUser(userObj);
      setIsLoginModalOpen(false);
      setIsPlansModalOpen(true);
      setModalLoginEmail('');
      setModalLoginPassword('');
    };

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: modalLoginEmail, password: modalLoginPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.item?.access_token || '';
        const displayName = modalLoginEmail.split('@')[0];
        const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        const userObj = { email: modalLoginEmail, name: formattedName };
        completeLogin(token, userObj);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setModalLoginError(errorData.detail || 'Invalid email or password.');
      }
    } catch (err) {
      console.error(err);
      const displayName = modalLoginEmail.split('@')[0];
      const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      const userObj = { email: modalLoginEmail, name: formattedName };
      completeLogin('mock-jwt-token-xyz', userObj);
    } finally {
      setIsModalLoggingIn(false);
    }
  };

  const handleSelectPlan = async (planId: number) => {
    if (!authToken) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsPaymentProcessing(true);
    try {
      const orderRes = await fetch(`http://localhost:8000/brands/${app.id}/payment/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ plan_id: planId })
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create payment order");
      }

      const orderData = await orderRes.json();
      const { order_id, amount, currency, key_id, is_mock } = orderData;

      if (is_mock) {
        setTimeout(async () => {
          try {
            const verifyRes = await fetch(`http://localhost:8000/brands/${app.id}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                razorpay_order_id: order_id,
                razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
                razorpay_signature: "mock_signature_abc123",
                plan_id: planId
              })
            });

            if (verifyRes.ok) {
              setActivePlanId(planId);
              try {
                const userStr = localStorage.getItem('wytsaas_user') || localStorage.getItem('wytpass_user');
                let userEmail = 'guest';
                if (userStr) {
                  const userObj = JSON.parse(userStr);
                  if (userObj && userObj.email) {
                    userEmail = userObj.email;
                  }
                }
                const activeSubs = localStorage.getItem(`mock_user_subscriptions_${userEmail}`);
                let parsed = activeSubs ? JSON.parse(activeSubs) : {};
                if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
                  parsed = {};
                }
                parsed[app.id] = planId;
                localStorage.setItem(`mock_user_subscriptions_${userEmail}`, JSON.stringify(parsed));
              } catch (e) {
                console.error(e);
              }
              setIsPlansModalOpen(false);
            } else {
              const errData = await verifyRes.json().catch(() => ({}));
              alert(`Verification failed: ${errData.detail || "Unknown error"}`);
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            alert("Verification connection failed.");
          } finally {
            setIsPaymentProcessing(false);
          }
        }, 1500);
      } else {
        setIsPaymentProcessing(false);
        const options = {
          key: key_id,
          amount: amount,
          currency: currency,
          name: app.name,
          description: `Subscription to ${app.name}`,
          image: app.logo_url || "https://wytnet.com/logo.png",
          order_id: order_id,
          handler: async function (paymentRes: any) {
            setIsPaymentProcessing(true);
            try {
              const verifyRes = await fetch(`http://localhost:8000/brands/${app.id}/payment/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  razorpay_order_id: paymentRes.razorpay_order_id,
                  razorpay_payment_id: paymentRes.razorpay_payment_id,
                  razorpay_signature: paymentRes.razorpay_signature,
                  plan_id: planId
                })
              });

              if (verifyRes.ok) {
                setActivePlanId(planId);
                try {
                  const userStr = localStorage.getItem('wytsaas_user') || localStorage.getItem('wytpass_user');
                  let userEmail = 'guest';
                  if (userStr) {
                    const userObj = JSON.parse(userStr);
                    if (userObj && userObj.email) {
                      userEmail = userObj.email;
                    }
                  }
                  const activeSubs = localStorage.getItem(`mock_user_subscriptions_${userEmail}`);
                  let parsed = activeSubs ? JSON.parse(activeSubs) : {};
                  if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
                    parsed = {};
                  }
                  parsed[app.id] = planId;
                  localStorage.setItem(`mock_user_subscriptions_${userEmail}`, JSON.stringify(parsed));
                } catch (e) {
                  console.error(e);
                }
                setIsPlansModalOpen(false);
              } else {
                const errData = await verifyRes.json().catch(() => ({}));
                alert(`Signature verification failed: ${errData.detail || "Unknown error"}`);
              }
            } catch (err) {
              console.error("Verification call failed", err);
              alert("Verification process encountered an error.");
            } finally {
              setIsPaymentProcessing(false);
            }
          },
          prefill: {
            name: currentUser?.name || "",
            email: currentUser?.email || ""
          },
          theme: {
            color: "#01875f"
          },
          modal: {
            ondismiss: function () {
              setIsPaymentProcessing(false);
            }
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert(`Payment failed: ${response.error.description}`);
          setIsPaymentProcessing(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during payment checkout initiation.");
      setIsPaymentProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setActivePlanId(null);
    try {
      const userStr = localStorage.getItem('wytsaas_user') || localStorage.getItem('wytpass_user');
      let userEmail = 'guest';
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.email) {
          userEmail = userObj.email;
        }
      }
      const activeSubs = localStorage.getItem(`mock_user_subscriptions_${userEmail}`);
      let parsed = activeSubs ? JSON.parse(activeSubs) : {};
      if (Array.isArray(parsed)) {
        parsed = parsed.filter((id: any) => id !== app.id);
      } else if (parsed && typeof parsed === 'object') {
        delete parsed[app.id];
      }
      localStorage.setItem(`mock_user_subscriptions_${userEmail}`, JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }

    if (authToken) {
      try {
        await fetch(`http://localhost:8000/brands/${app.id}/unsubscribe`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      } catch (err) {
        console.error("Backend unsubscribe API failed", err);
      }
    }
  };

  const getMainButtonText = () => {
    if (!authToken) {
      return 'Login to Subscribe';
    }
    if (activePlanId !== null) {
      const activePlan = plans.find(p => Number(p.id) === Number(activePlanId));
      return activePlan ? `Subscribed: ${activePlan.name}` : 'Subscribed';
    }
    if (isSubscribed()) {
      return 'Subscribed';
    }
    return 'Subscribe';
  };





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
              <button
                onClick={handleSubscribe}
                className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all cursor-pointer min-w-32 bg-[#01875f] hover:bg-[#00704e]"
              >
                {getMainButtonText()}
              </button>

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
                    <>
                      {(() => {
                        const types = Array.isArray(app.brand_type) ? app.brand_type : [app.brand_type];
                        return types.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 rounded-full border border-slate-200 bg-slate-50/30 text-xs font-semibold text-slate-600 cursor-pointer transition-all"
                          >
                            {t}
                          </span>
                        ));
                      })()}
                    </>
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

            {/* Active Subscription Card */}
            {activePlanId !== null && (
              <div className="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Check className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Your Active Plan</h3>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Subscribed</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-100/50">
                  <p className="text-base font-extrabold text-slate-800">
                    {plans.find(p => Number(p.id) === Number(activePlanId))?.name || 'Active Plan'}
                  </p>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    ₹{Number(plans.find(p => Number(p.id) === Number(activePlanId))?.price || 0).toFixed(2)} / {plans.find(p => Number(p.id) === Number(activePlanId))?.billing_cycle || 'monthly'}
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setIsPlansModalOpen(true)}
                    className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all text-center"
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs cursor-pointer transition-all text-center border-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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


      {/* Plans Modal */}
      {isPlansModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xl relative w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Subscription Plans</h2>
                <p className="text-xs text-slate-500 mt-1">Select a billing plan to subscribe to {app.name}</p>
              </div>
              <button
                onClick={() => setIsPlansModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent outline-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-6 flex-grow overflow-y-auto relative min-h-[250px]">
              {isPaymentProcessing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4 rounded-2xl animate-fade-in">
                  <div className="h-10 w-10 border-4 border-slate-100 border-t-[#01875f] rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">Processing secure payment...</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold">Please do not close this window</p>
                  </div>
                </div>
              )}

              {plans.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {plans.map((plan) => {
                    const isActive = Number(activePlanId) === Number(plan.id);
                    return (
                      <div
                        key={plan.id}
                        className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                          isActive
                            ? 'border-[#01875f] bg-[#01875f]/5 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-slate-800 text-base">{plan.name}</h3>
                            {isActive && (
                              <span className="text-[10px] font-bold text-[#01875f] bg-[#01875f]/10 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-normal min-h-8">
                            {plan.description || 'No description provided.'}
                          </p>

                          {/* Price */}
                          <div className="mt-4 flex items-baseline gap-1 select-none">
                            <span className="text-2xl font-black text-slate-800">₹{plan.price.toFixed(2)}</span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">
                              / {plan.billing_cycle}
                            </span>
                          </div>

                          {/* Features */}
                          <ul className="mt-4 space-y-2 text-xs font-medium text-slate-600">
                            {plan.features && plan.features.length > 0 ? (
                              plan.features.map((feat: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Check className="h-3.5 w-3.5 text-[#01875f] shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-slate-400 italic text-[11px]">No custom features specified.</li>
                            )}
                          </ul>
                        </div>

                        {/* Subscribe button for plan */}
                        <button
                          onClick={() => {
                            if (!isActive) {
                              handleSelectPlan(plan.id);
                            }
                          }}
                          disabled={isActive || isPaymentProcessing}
                          className={`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border-none ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 cursor-default font-semibold'
                              : 'bg-[#01875f] hover:bg-[#00704e] text-white cursor-pointer disabled:opacity-50'
                          }`}
                        >
                          {isActive ? 'Subscribed' : activePlanId !== null ? 'Switch Plan' : 'Select Plan'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <p className="font-bold text-sm text-slate-600">No plans available</p>
                  <p className="text-xs text-slate-400 mt-1">This application does not have any active subscription plans configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Login Guard Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xl relative w-full max-w-md max-h-[85vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Sign In to Wytnet</h2>
                <p className="text-xs text-slate-500 mt-1">Please log in to manage your subscription for {app.name}</p>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent outline-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleModalLogin} className="mt-6 space-y-4">
              {modalLoginError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">{modalLoginError}</p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={modalLoginEmail}
                    onChange={(e) => setModalLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#01875f] text-xs font-semibold px-4 py-3.5 rounded-xl outline-none transition-all placeholder-slate-400 text-slate-700 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your account password"
                    value={modalLoginPassword}
                    onChange={(e) => setModalLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#01875f] text-xs font-semibold px-4 py-3.5 rounded-xl outline-none transition-all placeholder-slate-400 text-slate-700 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isModalLoggingIn}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#01875f] hover:bg-[#00704e] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isModalLoggingIn ? 'Signing In...' : 'Sign In & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
