import { Link } from "react-router-dom";
import { Headphones, BookOpen, Mic } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Headphones className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">IELTS 训练平台</h1>
            <p className="text-xs text-muted-foreground">Listening & Speaking Practice</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl w-full space-y-10">
          <div className="text-center space-y-3 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              高效备考，从听说开始
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              场景词听写、精听练习与口语模拟，助你突破雅思瓶颈
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <Link
              to="/dictation"
              className="group relative bg-card border rounded-xl p-8 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">场景词听写</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                自定义单词列表，设置间隔与重复次数，英音朗读逐词听写
              </p>
              <div className="mt-5 text-sm font-semibold text-primary flex items-center gap-1">
                开始练习 →
              </div>
            </Link>

            <Link
              to="/listening"
              className="group relative bg-card border rounded-xl p-8 hover:border-secondary/40 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 flex flex-col"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-5 group-hover:bg-secondary/15 transition-colors">
                <Headphones className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">精听练习</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                逐句精听，填空作答，实时对比原文，红绿标注对错
              </p>
              <div className="mt-5 text-sm font-semibold text-secondary flex items-center gap-1">
                开始练习 →
              </div>
            </Link>

            <Link
              to="/speaking"
              className="group relative bg-card border rounded-xl p-8 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">口语练习</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                模拟考官提问，语音识别答题，AI 四项评分与纠错
              </p>
              <div className="mt-5 text-sm font-semibold text-primary flex items-center gap-1">
                开始练习 →
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        IELTS Practice Platform © 2026
      </footer>
    </div>
  );
};

export default Index;
