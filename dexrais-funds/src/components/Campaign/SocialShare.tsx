import { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Send, Mail, Check, Copy } from 'lucide-react';

interface SocialShareProps {
  title: string;
  description?: string;
  url: string;
}

export default function SocialShare({ title, description, url }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareText = description
    ? `${title} - ${description}`
    : title;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium"
      >
        <Share2 size={18} />
        Share Campaign
      </button>

      {/* Share Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 z-50 glassmorphic-card p-4 min-w-[280px]">
            <div className="space-y-2">
              {/* Twitter */}
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Twitter size={20} className="text-[#1DA1F2]" />
                <span className="text-gray-900 font-medium">Share on Twitter</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Facebook size={20} className="text-[#1877F2]" />
                <span className="text-gray-900 font-medium">Share on Facebook</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Linkedin size={20} className="text-[#0A66C2]" />
                <span className="text-gray-900 font-medium">Share on LinkedIn</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => handleShare('telegram')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Send size={20} className="text-[#0088cc]" />
                <span className="text-gray-900 font-medium">Share on Telegram</span>
              </button>

              {/* Email */}
              <button
                onClick={() => handleShare('email')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Mail size={20} className="text-gray-600" />
                <span className="text-gray-900 font-medium">Share via Email</span>
              </button>

              {/* Divider */}
              <div className="border-t border-gray-300 my-2" />

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={20} className="text-green-600" />
                    <span className="text-green-600 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={20} className="text-gray-600" />
                    <span className="text-gray-900 font-medium">Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
