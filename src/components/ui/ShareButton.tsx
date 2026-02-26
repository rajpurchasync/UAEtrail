import { useState } from 'react';
import { Share2, Facebook, Twitter, Link as LinkIcon, Mail, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export const ShareButton = ({ title, url = window.location.href }: ShareButtonProps) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check this out: ${url}`)}`
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
      >
        <Share2 className="w-5 h-5 mr-2" />
        Share
      </button>

      {showShareMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 py-2">
            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-3 text-emerald-600" />
                  <span className="text-emerald-600">Link copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5 mr-3" />
                  <span>Copy link</span>
                </>
              )}
            </button>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700 block"
              onClick={() => setShowShareMenu(false)}
            >
              <Facebook className="w-5 h-5 mr-3" />
              <span>Share on Facebook</span>
            </a>
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700 block"
              onClick={() => setShowShareMenu(false)}
            >
              <Twitter className="w-5 h-5 mr-3" />
              <span>Share on Twitter</span>
            </a>
            <a
              href={shareLinks.email}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700 block"
              onClick={() => setShowShareMenu(false)}
            >
              <Mail className="w-5 h-5 mr-3" />
              <span>Share via Email</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
};
