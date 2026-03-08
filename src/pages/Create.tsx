import { Camera, Video, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Create = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <button onClick={() => navigate(-1)}>
          <X className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="font-display text-2xl text-foreground">Create</h1>
        <div className="w-6" />
      </div>

      {/* Camera area placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full aspect-[9/16] max-h-[60vh] rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-4">
          <div className="gradient-fire rounded-full p-5 shadow-glow">
            <Camera className="h-10 w-10 text-primary-foreground" />
          </div>
          <p className="text-foreground font-display text-xl">Record Your Highlights</p>
          <p className="text-muted-foreground text-sm text-center">
            Show off your skills, dunks, and ankle breakers
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 mt-8">
          <button className="flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground">
            <Video className="h-5 w-5" />
            Record
          </button>
          <button className="flex items-center gap-2 rounded-xl gradient-fire px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            <Upload className="h-5 w-5" />
            Upload
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Create;
