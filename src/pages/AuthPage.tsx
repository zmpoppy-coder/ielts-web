import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("请输入邮箱和密码");
      return;
    }
    if (password.length < 6) {
      toast.error("密码长度至少需要 6 位");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // 登录逻辑
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("登录成功！欢迎回来");
        navigate("/"); // 登录成功后跳转到首页或练习页
      } else {
        // 注册逻辑
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("注册成功！已自动为您登录");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message === "Invalid login credentials" ? "邮箱或密码错误" : "操作失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border rounded-2xl p-8 shadow-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? "欢迎回来" : "注册账号"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? "登录以继续你的雅思备考之旅" : "注册即享无限次听写与每日免费口语模考"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-transparent focus:border-primary/50 focus:bg-background rounded-lg outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="至少 6 位密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-transparent focus:border-primary/50 focus:bg-background rounded-lg outline-none transition-all text-sm"
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-5 mt-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isLogin ? "登录" : "立即注册"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline transition-all"
          >
            {isLogin ? "还没有账号？点此免费注册" : "已有账号？点此直接登录"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;