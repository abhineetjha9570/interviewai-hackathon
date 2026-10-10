'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Crown,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadSub() {
      try {
        const res = await fetch('/api/subscription');
        const json = await res.json();
        if (json.subscription) {
          setSubscription(json.subscription);
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSub();
  }, []);

  const activePlanKey = (subscription?.plan || 'PRO').toUpperCase();

  const plans = [
    {
      key: 'FREE',
      name: 'Free',
      tagline: 'Basic foundations',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        '50 Practice questions',
        '1 Mock interview per month',
        '1 AI Avatar quick trial',
        'Basic ATS score check',
        'Community discussion access',
      ],
      limits: { practice: 50, mock: 1, ai: 1 },
    },
    {
      key: 'STARTER',
      name: 'Starter',
      tagline: 'Focused preparation',
      priceMonthly: 499,
      priceYearly: 399,
      features: [
        '500 Practice questions',
        '5 Mock interviews per month',
        '3 AI Avatar interviews',
        'Full ATS report & suggestions',
        'Priority execution queue',
      ],
      limits: { practice: 500, mock: 5, ai: 3 },
    },
    {
      key: 'PRO',
      name: 'Pro',
      tagline: 'Most Popular for Placements',
      priceMonthly: 999,
      priceYearly: 799,
      popular: true,
      features: [
        'Unlimited practice questions & Monaco runner',
        '15 Full mock interviews',
        '10 Full 100-Minute AI Avatar interviews',
        'Full AI resume rewrite & optimizer',
        'Proctoring integrity verification certificate',
        'Company-specific interview tracks (Google, Amazon)',
      ],
      limits: { practice: 'Unlimited', mock: 15, ai: 10 },
    },
    {
      key: 'PREMIUM',
      name: 'Premium Enterprise',
      tagline: 'Ultimate hiring guarantee',
      priceMonthly: 1999,
      priceYearly: 1499,
      features: [
        'Everything in Pro with unlimited AI Avatar sessions',
        'Human expert code review & resume critique',
        'Direct referral connections to partner companies',
        '1-on-1 mentorship consultation call',
        '24/7 Priority support',
      ],
      limits: { practice: 'Unlimited', mock: 'Unlimited', ai: 'Unlimited' },
    },
  ];

  const handleSelectPlan = async (planKey: string) => {
    setIsProcessing(true);
    setUpgradeNotice(null);

    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Upgrade failed');
      }

      setSubscription(data.subscription);
      setUpgradeNotice(`Successfully switched plan to ${planKey}! Your entitlement quotas have been updated on the server.`);
      setTimeout(() => setUpgradeNotice(null), 5000);
    } catch (err: any) {
      setUpgradeNotice(err.message || 'Error updating plan');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5" />
          Subscription & Entitlements
        </span>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Invest in Your Career & Placement
        </h2>
        <p className="text-slate-500 text-sm">
          Unlock unlimited practice problems, realistic 100-minute AI avatar interviews, and automated ATS resume optimization.
        </p>
      </div>

      {upgradeNotice && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{upgradeNotice}</span>
        </div>
      )}

      {/* Current Active Plan Status Banner */}
      {subscription && (
        <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Active Plan</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700">
                {subscription.plan}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Remaining Quotas: Practice ({subscription.practiceRemaining >= 900 ? 'Unlimited' : subscription.practiceRemaining}) · Mock Interviews ({subscription.mockRemaining}) · AI Avatar Sessions ({subscription.aiInterviewRemaining})
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Status: {subscription.status}
          </span>
        </div>
      )}

      {/* Billing Switch */}
      <div className="flex justify-center">
        <div className="p-1 rounded-2xl bg-slate-100 flex items-center text-xs font-bold border border-slate-200/80">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`py-2 px-5 rounded-xl transition-all ${
              billingCycle === 'MONTHLY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('YEARLY')}
            className={`py-2 px-5 rounded-xl transition-all flex items-center gap-1.5 ${
              billingCycle === 'YEARLY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            <span>Yearly</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px]">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = activePlanKey === plan.key;
          const price = billingCycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.name}
              className={`p-7 rounded-3xl flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'bg-slate-900 text-white shadow-xl shadow-indigo-600/10 ring-2 ring-indigo-500 relative'
                  : 'bg-white border border-slate-200/80 text-slate-800 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                {plan.popular && (
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="font-extrabold text-lg">{plan.name}</h3>
                  <p className={`text-xs ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.tagline}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-extrabold">₹{price}</span>
                  <span className={`text-xs ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                    / month
                  </span>
                </div>

                <div className={`pt-4 border-t ${plan.popular ? 'border-slate-800' : 'border-slate-100'} space-y-2.5 text-xs`}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-indigo-400' : 'text-emerald-500'}`} />
                      <span className={plan.popular ? 'text-slate-300' : 'text-slate-600'}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  disabled={isCurrent || isProcessing}
                  onClick={() => handleSelectPlan(plan.key)}
                  className={`w-full py-3 rounded-2xl font-bold text-xs transition-all ${
                    isCurrent
                      ? 'bg-slate-200 text-slate-500 cursor-default'
                      : plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : isProcessing ? 'Updating...' : `Choose ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
