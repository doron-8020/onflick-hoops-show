import FloatingNav from "@/components/website/FloatingNav";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import Index from "@/pages/Index";

const WebsiteFeed = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <FloatingNav />
      <div className="pt-16">
        <div className="mx-auto max-w-[480px]">
          <Index />
        </div>
      </div>
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteFeed;
