import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import Index from "./pages/Index";
import DictationPage from "./pages/DictationPage";
import ListeningPage from "./pages/ListeningPage";
import SpeakingPage from "./pages/SpeakingPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage"; // 引入我们刚才新建的登录注册页

const queryClient = new QueryClient();

// 👮‍♂️ 这是一个“保安”组件，专门用来检查用户有没有登录
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 刚打开网页时，查一下有没有登录记录
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. 实时监听登录状态的变化（比如用户刚登录成功，或者点击了退出）
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 正在检查时，显示一个简单的提示，防止页面闪烁
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        身份验证中...
      </div>
    );
  }

  // 如果没登录，直接重定向（踢回）到 /auth 登录页
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // 如果登录了，就放行，让他看里面的内容
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 🚪 开放的登录页面，任何人都可以进，不需要保安 */}
          <Route path="/auth" element={<AuthPage />} />

          {/* 🛡️ 下面这些核心功能页，全都被 <ProtectedRoute> 这个保安包围了 */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/dictation" element={<ProtectedRoute><DictationPage /></ProtectedRoute>} />
          <Route path="/listening" element={<ProtectedRoute><ListeningPage /></ProtectedRoute>} />
          <Route path="/speaking" element={<ProtectedRoute><SpeakingPage /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;