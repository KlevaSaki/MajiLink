import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Copy, Check, MessageCircle, Share2 } from "lucide-react";
import { useVendorStore } from "../../../store/useVendorStore";

const APP_LINK = "https://majilink.app/download";

export default function VendorInvite() {
  const navigate = useNavigate();
  const businessName = useVendorStore((s) => s.profile.businessName);
  const [copied, setCopied] = useState(false);

  const message = `Hi! ${businessName} is now on MajiLink — you can order water and gas refills for delivery straight from your phone. Get the app here: ${APP_LINK}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // user cancelled — no action needed
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#134E4A] flex items-center justify-center">
            <Droplets className="w-8 h-8 text-[#4FD1C5]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#134E4A] text-center mb-2">You're live!</h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Let your existing customers know they can now order from you on MajiLink.
        </p>

        <div className="bg-white border border-[#D6D3D1] rounded-2xl p-5 mb-5">
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1FBD5A] text-white text-sm font-semibold rounded-xl py-3 transition-colors"
          >
            <MessageCircle className="w-4.5 h-4.5" />
            Share on WhatsApp
          </button>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2.5 border border-[#D6D3D1] text-gray-700 text-sm font-medium rounded-xl py-3 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            More sharing options
          </button>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2.5 text-sm font-medium text-[#134E4A] py-2.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied to clipboard" : "Copy message"}
          </button>
        </div>

        <button
          onClick={() => navigate("/vendor")}
          className="w-full text-center text-sm text-gray-400 mt-8 hover:text-gray-600 transition-colors"
        >
          Skip for now — go to dashboard
        </button>
      </div>
    </div>
  );
}
