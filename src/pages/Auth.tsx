import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("!ברוך הבא");
      } else {
        await signUp(email, password, displayName);
        toast.success("נרשמת בהצלחה! בדוק את המייל לאימות");
      }
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-5xl text-center mb-2">
          <span className="text-gradient-fire">ONFLICK</span>
        </h1>
        <p className="font-display text-2xl text-center text-foreground mb-8">SHOWCASE</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Player Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required={!isLogin}
              className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl gradient-fire py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50 transition-opacity"
          >
            {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 w-full text-center text-sm text-muted-foreground"
        >
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="text-primary font-semibold">{isLogin ? "Sign Up" : "Sign In"}</span>
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Auth;
