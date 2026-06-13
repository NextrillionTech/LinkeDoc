import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Lock, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  ArrowRight,
  HelpCircle,
  ChevronDown,
  UserPlus,
  Award,
  Sparkles
} from 'lucide-react';
import { useSEO } from '../utils/seo';

interface FaqItem {
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    question: 'Who is eligible to join LinkeDoc?',
    answer: 'LinkeDoc is strictly reserved for verified healthcare professionals. This includes Doctors/Physicians, Residents, Nurses, Pharmacists, and Medical Researchers. Healthcare Recruiters can join to post job listings, while administrators audit the credentials. General public access is restricted to ensure professional integrity.'
  },
  {
    question: 'How does automated credential verification work?',
    answer: 'During registration, clinical professionals submit their Medical Registration Number (MRN) or National Provider Identifier (NPI). The LinkeDoc backend queries official databases (such as the CMS NPPES registry or State Medical Councils) to validate credentials. Accounts matching official entries are approved instantly; others enter the manual administrator audit queue.'
  },
  {
    question: 'Are case discussions and direct messages secure?',
    answer: 'Yes. Direct messages use client-side End-to-End Encryption (E2EE), meaning keys are generated and stored locally in your browser. No plaintext message data is stored on our servers. Specialty discussion boards are restricted to verified clinical roles, enforcing a professional, distraction-free atmosphere.'
  },
  {
    question: 'How does the Job Board get its clinical vacancies?',
    answer: 'LinkeDoc features a background scraping engine that automatically ingests clinical openings from vetted health RSS feeds (like HigherEdJobs Medical). Vetted Recruiters can also publish custom job openings. In addition, candidates can use our built-in Indian Medical Salary Calculator and verified PDF Resume Builder.'
  },
  {
    question: 'How do specialty forums and post flagging work?',
    answer: 'Discussion categories (e.g., Cardiology, Pediatrics, Neurology) are curated for clinical peer review. Users can compose posts, upload research paper abstracts, and reply inline. To maintain HIPAA principles, any post or comment can be flagged. Flagging content immediately hides it from peer view and sends it to the Administrator review queue.'
  }
];

export const Landing: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useSEO(
    'Verified Medical Professional Network',
    'Join LinkeDoc, the professional network exclusively for verified medical practitioners. Secure E2EE chats, specialty forums, scraped clinical jobs, and CV tools.'
  );

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };



  return (
    <div className="landing-root">
      <style>{`
        /* Global & Reset variables for Landing Page */
        .landing-root {
          font-family: var(--font-body);
          width: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          background-color: #fcfdfe;
          color: #1e293b;
          overflow-x: hidden;
        }

        /* Helper to ensure box-sizing across landing elements */
        .landing-root * {
          box-sizing: border-box;
        }

        /* Core Text Styling overrides */
        .landing-root h1, .landing-root h2, .landing-root h3, .landing-root h4 {
          font-family: var(--font-display);
          color: #0f172a;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        /* 1. Custom Full-Width Header */
        .landing-nav {
          position: sticky;
          top: 0;
          left: 0;
          width: 100%;
          height: 72px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all var(--transition-fast);
        }

        .nav-container {
          max-width: 1200px;
          width: 100%;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-logo-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: transform var(--transition-fast);
        }

        .nav-logo-link:hover {
          transform: scale(1.02);
        }

        .nav-logo-img {
          height: 38px;
          object-fit: contain;
        }

        .nav-logo-text {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 20px;
          color: #05685e;
          letter-spacing: -0.03em;
        }

        .nav-links-list {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        @media (max-width: 768px) {
          .nav-links-list {
            display: none; /* Hide on mobile/tablet */
          }
        }

        .nav-link-item {
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: color var(--transition-fast);
          padding: 8px 4px;
        }

        .nav-link-item:hover {
          color: #05685e;
        }

        .nav-actions-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-btn-signin {
          font-size: 14px;
          font-weight: 600;
          color: #05685e;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .nav-btn-signin:hover {
          background-color: rgba(5, 104, 94, 0.06);
        }

        .nav-btn-join {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          background: #05685e;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: var(--radius-sm);
          box-shadow: 0 4px 10px rgba(5, 104, 94, 0.15);
          transition: transform var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .nav-btn-join:hover {
          transform: translateY(-1px);
          background-color: #034b44;
          box-shadow: 0 6px 14px rgba(5, 104, 94, 0.25);
        }

        /* 2. Hero Section */
        .hero-outer-section {
          background: radial-gradient(circle at top right, rgba(8, 145, 178, 0.07) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          width: 100%;
          display: flex;
          justify-content: center;
          border-bottom: 1px solid rgba(15, 23, 42, 0.05);
        }

        .hero-inner-content {
          max-width: 1200px;
          width: 100%;
          padding: 96px 24px 80px 24px;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 64px;
          align-items: center;
        }

        @media (max-width: 968px) {
          .hero-inner-content {
            grid-template-columns: 1fr;
            padding: 60px 20px;
            gap: 48px;
            text-align: center;
          }
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #05685e;
          background-color: rgba(5, 104, 94, 0.08);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          margin-bottom: 24px;
          letter-spacing: 0.05em;
        }

        @media (max-width: 968px) {
          .hero-tag {
            justify-content: center;
          }
        }

        .hero-h1 {
          font-size: 48px;
          line-height: 1.12;
          color: #0f172a;
          margin-bottom: 24px;
          font-weight: 850;
        }

        @media (max-width: 640px) {
          .hero-h1 {
            font-size: 34px;
          }
        }

        .hero-p {
          font-size: 17px;
          line-height: 1.65;
          color: #475569;
          margin-bottom: 36px;
          max-width: 640px;
        }

        @media (max-width: 968px) {
          .hero-p {
            margin-left: auto;
            margin-right: auto;
          }
        }

        .hero-buttons-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        @media (max-width: 968px) {
          .hero-buttons-row {
            justify-content: center;
          }
        }

        .hero-btn-primary {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          background: #05685e;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 20px rgba(5, 104, 94, 0.15);
          transition: all var(--transition-smooth);
        }

        .hero-btn-primary:hover {
          transform: translateY(-2px);
          background-color: #034b44;
          box-shadow: 0 12px 24px rgba(5, 104, 94, 0.25);
        }

        .hero-btn-secondary {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all var(--transition-fast);
        }

        .hero-btn-secondary:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
        }

        .hero-meta-checks {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 36px;
          font-size: 13px;
          color: #64748b;
          flex-wrap: wrap;
        }

        @media (max-width: 968px) {
          .hero-meta-checks {
            justify-content: center;
          }
        }

        .hero-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        .hero-image-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-img {
          width: 100%;
          max-width: 440px;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: var(--radius-lg);
          border: 6px solid #ffffff;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
          z-index: 10;
        }

        .hero-floating-badge {
          position: absolute;
          bottom: 24px;
          left: -10px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: var(--radius-md);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
          z-index: 20;
          animation: badgeFloat 4s ease-in-out infinite alternate;
        }

        @media (max-width: 640px) {
          .hero-floating-badge {
            left: 5%;
            bottom: 10px;
          }
        }

        @keyframes badgeFloat {
          0% { transform: translateY(0); }
          100% { transform: translateY(-12px); }
        }

        .badge-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #10b981;
          position: relative;
        }

        .badge-dot::after {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: rgba(16, 185, 129, 0.4);
          left: -4px;
          top: -4px;
          animation: dotPulse 1.8s infinite;
        }

        @keyframes dotPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        /* 3. Infinite Scrolling Marquee */
        .marquee-container {
          background-color: #05685e;
          width: 100%;
          overflow: hidden;
          padding: 16px 0;
          color: #ffffff;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .marquee-track {
          display: flex;
          white-space: nowrap;
          animation: marqueeScroll 25s linear infinite;
        }

        .marquee-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-right: 64px;
          color: rgba(255, 255, 255, 0.95);
        }

        @keyframes marqueeScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }

        /* 4. About Section */
        .about-outer-section {
          background-color: #ffffff;
          width: 100%;
          display: flex;
          justify-content: center;
          border-bottom: 1px solid rgba(15, 23, 42, 0.05);
        }

        .about-inner-content {
          max-width: 1200px;
          width: 100%;
          padding: 100px 24px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 80px;
          align-items: center;
        }

        @media (max-width: 968px) {
          .about-inner-content {
            grid-template-columns: 1fr;
            padding: 64px 20px;
            gap: 48px;
          }
        }

        .section-category {
          font-size: 12px;
          font-weight: 800;
          color: #05685e;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          display: block;
          margin-bottom: 12px;
        }

        .section-h2 {
          font-size: 38px;
          line-height: 1.2;
          color: #0f172a;
          margin-bottom: 24px;
          font-weight: 800;
        }

        .about-desc {
          font-size: 16px;
          line-height: 1.7;
          color: #475569;
          margin-bottom: 32px;
        }

        .about-checklist {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .checklist-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .checklist-icon {
          color: #05685e;
          flex-shrink: 0;
          margin-top: 3px;
        }

        .checklist-title {
          font-weight: 700;
          font-size: 15px;
          color: #0f172a;
          display: block;
          margin-bottom: 2px;
        }

        .checklist-text {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.5;
        }

        /* Mock Interactive Verification UI */
        .verification-mockup-wrapper {
          background: #f8fafc;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: 0 10px 35px rgba(15, 23, 42, 0.03);
          position: relative;
        }

        .mockup-header {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          padding-bottom: 16px;
          margin-bottom: 24px;
        }

        .mockup-header-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin: 0;
        }

        .mockup-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .mockup-input-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mockup-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }

        .mockup-val {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .mockup-status-box {
          background-color: rgba(16, 185, 129, 0.08);
          border: 1px dashed rgba(16, 185, 129, 0.4);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
        }

        .mockup-status-title {
          font-size: 13px;
          font-weight: 700;
          color: #065f46;
          margin: 0 0 2px 0;
        }

        .mockup-status-desc {
          font-size: 11px;
          color: #047857;
          margin: 0;
        }

        /* 5. Features Section */
        .features-outer-section {
          background-color: #f8fafc;
          width: 100%;
          display: flex;
          justify-content: center;
          border-bottom: 1px solid rgba(15, 23, 42, 0.05);
        }

        .features-inner-content {
          max-width: 1200px;
          width: 100%;
          padding: 100px 24px;
        }

        .features-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 60px auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        @media (max-width: 968px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }

        .feature-item-card {
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: var(--radius-md);
          padding: 36px 30px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: transform var(--transition-smooth), border-color var(--transition-smooth), box-shadow var(--transition-smooth);
        }

        .feature-item-card:hover {
          transform: translateY(-4px);
          border-color: rgba(5, 104, 94, 0.3);
          box-shadow: 0 20px 25px -5px rgba(5, 104, 94, 0.05), 0 10px 10px -5px rgba(5, 104, 94, 0.02);
        }

        .feature-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: rgba(5, 104, 94, 0.08);
          color: #05685e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .feature-item-card:hover .feature-icon-box {
          background-color: #05685e;
          color: #ffffff;
        }

        .feature-h3 {
          font-size: 19px;
          font-weight: 750;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .feature-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }

        /* 6. FAQ Accordion Section */
        .faq-outer-section {
          background-color: #ffffff;
          width: 100%;
          display: flex;
          justify-content: center;
          border-bottom: 1px solid rgba(15, 23, 42, 0.05);
        }

        .faq-inner-content {
          max-width: 800px;
          width: 100%;
          padding: 100px 24px;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 54px;
        }

        .faq-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-row-card {
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-sm);
          background: #ffffff;
          overflow: hidden;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .faq-row-card.active {
          border-color: #05685e;
          box-shadow: 0 4px 12px rgba(5, 104, 94, 0.04);
        }

        .faq-trigger-btn {
          width: 100%;
          background: none;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          cursor: pointer;
          text-align: left;
          gap: 16px;
        }

        .faq-question-box {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-display);
          font-size: 15.5px;
          font-weight: 700;
          color: #0f172a;
          transition: color var(--transition-fast);
        }

        .faq-row-card.active .faq-question-box {
          color: #05685e;
        }

        .faq-row-card:hover:not(.active) .faq-question-box {
          color: #05685e;
        }

        .faq-chevron {
          color: #94a3b8;
          transition: transform var(--transition-smooth), color var(--transition-fast);
          flex-shrink: 0;
        }

        .faq-row-card.active .faq-chevron {
          transform: rotate(180deg);
          color: #05685e;
        }

        .faq-pane {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-row-card.active .faq-pane {
          max-height: 200px;
          opacity: 1;
        }

        .faq-answer-p {
          padding: 0 24px 20px 52px;
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          border-top: 1px solid transparent;
        }

        .faq-row-card.active .faq-answer-p {
          border-top-color: #f1f5f9;
        }

        /* 7. Call To Action (CTA) Section */
        .cta-outer-section {
          background-color: #f8fafc;
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 80px 24px;
        }

        .cta-inner-card {
          max-width: 1200px;
          width: 100%;
          background: linear-gradient(135deg, #05685e 0%, #0c4a43 100%);
          border-radius: var(--radius-lg);
          padding: 72px 40px;
          text-align: center;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(5, 104, 94, 0.15);
        }

        /* Ambient light overlay for premium CTA look */
        .cta-inner-card::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(8, 145, 178, 0.25) 0%, rgba(255, 255, 255, 0) 70%);
          top: -100px;
          right: -50px;
          pointer-events: none;
        }

        .cta-inner-card::before {
          content: '';
          position: absolute;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(255, 255, 255, 0) 70%);
          bottom: -80px;
          left: -50px;
          pointer-events: none;
        }

        .cta-h2 {
          font-size: 38px;
          color: #ffffff !important;
          margin-bottom: 20px;
          font-weight: 850;
        }

        .cta-p {
          font-size: 16.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          max-width: 600px;
          margin: 0 auto 36px auto;
        }

        .cta-btn-white-pill {
          background: #ffffff;
          color: #05685e;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), opacity var(--transition-fast);
        }

        .cta-btn-white-pill:hover {
          transform: translateY(-2px);
          opacity: 0.98;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        /* 8. Footer Section */
        .footer-outer-section {
          background-color: #03201d;
          color: rgba(255, 255, 255, 0.6);
          width: 100%;
          display: flex;
          justify-content: center;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-inner-content {
          max-width: 1200px;
          width: 100%;
          padding: 80px 24px 40px 24px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 48px;
          margin-bottom: 64px;
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 36px;
          }
        }

        .footer-brand-logo-row {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .footer-brand-logo-row {
            justify-content: center;
          }
        }

        .footer-brand-text {
          font-family: var(--font-display);
          font-weight: 850;
          font-size: 20px;
          color: #ffffff;
          letter-spacing: -0.03em;
        }

        .footer-tagline {
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
          color: rgba(255, 255, 255, 0.5);
          max-width: 260px;
        }

        @media (max-width: 768px) {
          .footer-tagline {
            margin: 0 auto;
          }
        }

        .footer-column-title {
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
        }

        .footer-links-ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-link-a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 13.5px;
          transition: color var(--transition-fast);
        }

        .footer-link-a:hover {
          color: #ffffff;
        }

        .footer-bottom-row {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 640px) {
          .footer-bottom-row {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }

        .footer-credits {
          font-weight: 500;
        }

        .footer-sublinks {
          display: flex;
          gap: 24px;
        }
      `}</style>



      {/* 2. Hero Section */}
      <section className="hero-outer-section" id="hero">
        <div className="hero-inner-content">
          <div className="hero-content-left">
            <div className="hero-tag">
              <Sparkles size={13} style={{ color: '#05685e' }} /> Sovereign Medical Network
            </div>
            <h1 className="hero-h1">
              Where Verified Medical Professionals Connect
            </h1>
            <p className="hero-p">
              LinkeDoc is an exclusive ecosystem where verified healthcare providers, residents, nurses, pharmacists, and researchers share clinical insights. Exchange E2EE discussions, post peer studies, and navigate dedicated medical career boards.
            </p>
            <div className="hero-buttons-row">
              <Link to="/signup" className="hero-btn-primary">
                Join the Community <UserPlus size={16} />
              </Link>
              <Link to="/login" className="hero-btn-secondary">
                Member Sign In <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-meta-checks">
              <span className="hero-meta-item">
                <CheckCircle size={14} style={{ color: '#05685e' }} /> NPI / NMC Audited
              </span>
              <span className="hero-meta-item">
                <CheckCircle size={14} style={{ color: '#05685e' }} /> HIPAA Aligned
              </span>
              <span className="hero-meta-item">
                <CheckCircle size={14} style={{ color: '#05685e' }} /> Zero Ad Tracking
              </span>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <img 
              src="/smiling_doctor_hero.png" 
              alt="Healthcare professional verified by LinkeDoc credentialing system" 
              className="hero-img" 
            />
            <div className="hero-floating-badge" role="status">
              <div className="badge-dot"></div>
              <div>
                <strong style={{ fontSize: '12.5px', display: 'block', color: '#0f172a' }}>Dr. Naresh Trehan</strong>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>License Verified: NMC Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Ticker Bar */}
      <div className="marquee-container" aria-hidden="true">
        <div className="marquee-track">
          <span className="marquee-item"><Shield size={14} /> Automated License Audits</span>
          <span className="marquee-item"><Lock size={14} /> End-to-End Encrypted DMs</span>
          <span className="marquee-item"><Users size={14} /> Specialty-Specific Forums</span>
          <span className="marquee-item"><Award size={14} /> NPI / NMC Verification</span>
          <span className="marquee-item"><Briefcase size={14} /> Scraped Medical Vacancies</span>
          <span className="marquee-item"><FileText size={14} /> Verified CV Generator</span>
          {/* Repeat items for smooth infinite loop scroll */}
          <span className="marquee-item"><Shield size={14} /> Automated License Audits</span>
          <span className="marquee-item"><Lock size={14} /> End-to-End Encrypted DMs</span>
          <span className="marquee-item"><Users size={14} /> Specialty-Specific Forums</span>
          <span className="marquee-item"><Award size={14} /> NPI / NMC Verification</span>
          <span className="marquee-item"><Briefcase size={14} /> Scraped Medical Vacancies</span>
          <span className="marquee-item"><FileText size={14} /> Verified CV Generator</span>
        </div>
      </div>

      {/* 4. About Section */}
      <section className="about-outer-section" id="about">
        <div className="about-inner-content">
          <div className="about-content-left">
            <span className="section-category">About LinkeDoc</span>
            <h2 className="section-h2">A Verified Workspace to Elevate Your Practice</h2>
            <p className="about-desc">
              Healthcare discussions demand professional accuracy and confidentiality. General social platforms fail to verify licenses, leading to clinical noise, commercial targeting, and privacy risks. LinkeDoc solves this by creating a peer-only sanctuary.
            </p>

            <div className="about-checklist">
              <div className="checklist-item">
                <CheckCircle size={18} className="checklist-icon" />
                <div>
                  <strong className="checklist-title">Real-Time License Checks</strong>
                  <span className="checklist-text">We query CMS NPPES (NPI) and State Medical Councils (NMC) to validate every doctor, resident, and researcher.</span>
                </div>
              </div>
              <div className="checklist-item">
                <CheckCircle size={18} className="checklist-icon" />
                <div>
                  <strong className="checklist-title">Academic Publications First</strong>
                  <span className="checklist-text">Share clinical findings and research paper abstracts directly with verified colleagues and receive clinical peer feedback.</span>
                </div>
              </div>
              <div className="checklist-item">
                <CheckCircle size={18} className="checklist-icon" />
                <div>
                  <strong className="checklist-title">Dedicated HIPAA Flags</strong>
                  <span className="checklist-text">Our peer reporting shield immediately hides any posts flagged for patient confidentiality violations from view.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="verification-mockup-wrapper">
            <div className="mockup-header">
              <Award size={16} style={{ color: '#05685e' }} />
              <h3 className="mockup-header-title">LinkeDoc Verification Check</h3>
            </div>
            <div className="mockup-form">
              <div>
                <span className="mockup-label">Professional Role</span>
                <div className="mockup-input-container">
                  <span className="mockup-val">Clinical Consultant (Oncology)</span>
                </div>
              </div>
              <div>
                <span className="mockup-label">Medical Registration ID / NPI</span>
                <div className="mockup-input-container">
                  <span className="mockup-val">NMC-2026-98745-A</span>
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                </div>
              </div>
              <div className="mockup-status-box">
                <Shield size={22} style={{ color: '#059669', flexShrink: 0 }} />
                <div>
                  <h4 className="mockup-status-title">Database Match Confirmed</h4>
                  <p className="mockup-status-desc">License is active. Profile credential badge issued.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Section */}
      <section className="features-outer-section" id="features">
        <div className="features-inner-content">
          <div className="features-header">
            <span className="section-category">Platform Features</span>
            <h2 className="section-h2">Engineered Specially for Healthcare Professionals</h2>
          </div>

          <div className="features-grid">
            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Award size={22} />
              </div>
              <h3 className="feature-h3">License Auditing</h3>
              <p className="feature-desc">
                Instant license checks query official NPI and NMC databases at signup to block non-clinicians and public accounts.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Lock size={22} />
              </div>
              <h3 className="feature-h3">Encrypted DMs</h3>
              <p className="feature-desc">
                Examine clinical cases securely. Messages use client-side end-to-end encryption so keys stay locally in your browser.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Users size={22} />
              </div>
              <h3 className="feature-h3">Specialty Forums</h3>
              <p className="feature-desc">
                Discuss complex patient charts on boards filtered by specialty (Cardiology, Pediatrics, Oncology, Neurology).
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Briefcase size={22} />
              </div>
              <h3 className="feature-h3">Clinical Jobs</h3>
              <p className="feature-desc">
                Discover clinical jobs scraped daily from major medical portals, or post openings directly as an approved recruiter.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <TrendingUp size={22} />
              </div>
              <h3 className="feature-h3">Salary Estimator</h3>
              <p className="feature-desc">
                Evaluate regional clinical salary indexes and calculate typical medical CTC packages in India based on specialization.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <FileText size={22} />
              </div>
              <h3 className="feature-h3">CV Builder</h3>
              <p className="feature-desc">
                Generate and download formatted, print-ready medical CVs displaying your verified license and clinical experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="faq-outer-section" id="faqs">
        <div className="faq-inner-content">
          <div className="faq-header">
            <span className="section-category">Common Inquiries</span>
            <h2 className="section-h2">Frequently Asked Questions</h2>
          </div>

          <div className="faq-accordion-list">
            {faqData.map((item, index) => {
              const isActive = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className={`faq-row-card ${isActive ? 'active' : ''}`}
                >
                  <button 
                    type="button"
                    className="faq-trigger-btn"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isActive}
                  >
                    <span className="faq-question-box">
                      <HelpCircle size={18} style={{ color: isActive ? '#05685e' : '#64748b', flexShrink: 0 }} />
                      {item.question}
                    </span>
                    <ChevronDown size={18} className="faq-chevron" />
                  </button>
                  <div className="faq-pane" aria-hidden={!isActive}>
                    <p className="faq-answer-p">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CTA Section */}
      <section className="cta-outer-section">
        <div className="cta-inner-card">
          <h2 className="cta-h2">Connect with Your Verified Peers Today</h2>
          <p className="cta-p">
            License vetting takes less than 2 minutes. Secure a verified professional network profile to unlock encrypted chats, specialty case review boards, and tailored medical vacancies.
          </p>
          <Link to="/signup" className="cta-btn-white-pill">
            Register Verified Profile <UserPlus size={16} />
          </Link>
        </div>
      </section>

      {/* 8. Footer Section */}
      <footer className="footer-outer-section" role="contentinfo">
        <div className="footer-inner-content">
          <div className="footer-grid">
            <div className="footer-brand-column">
              <Link to="/" className="footer-brand-logo-row">
                <img src="/logo.svg" alt="LinkeDoc Logo" style={{ height: '36px' }} />
              </Link>
              <p className="footer-tagline">
                The secure professional network for doctors, residents, nurses, pharmacists, and medical researchers.
              </p>
            </div>

            <div>
              <h4 className="footer-column-title">Community</h4>
              <ul className="footer-links-ul">
                <li><Link to="/forums" className="footer-link-a">Specialty Forums</Link></li>
                <li><Link to="/jobs" className="footer-link-a">Clinical Jobs</Link></li>
                <li><Link to="/groups" className="footer-link-a">Medical Groups</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-column-title">Information</h4>
              <ul className="footer-links-ul">
                <li><Link to="/about" className="footer-link-a">About Us</Link></li>
                <li><Link to="/accessibility" className="footer-link-a">Accessibility</Link></li>
                <li><Link to="/privacy" className="footer-link-a">Privacy & Terms</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-column-title">Support</h4>
              <ul className="footer-links-ul">
                <li><Link to="/help" className="footer-link-a">Help Center</Link></li>
                <li><a href="mailto:support@linkedoc.com" className="footer-link-a">Support Desk</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-row">
            <span className="footer-credits">LinkeDoc @ 2026. All rights reserved.</span>
            <div className="footer-sublinks">
              <Link to="/privacy" className="footer-link-a" style={{ fontSize: '11.5px' }}>Privacy Policy</Link>
              <Link to="/privacy" className="footer-link-a" style={{ fontSize: '11.5px' }}>Terms of Service</Link>
              <Link to="/accessibility" className="footer-link-a" style={{ fontSize: '11.5px' }}>ADA Compliance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
