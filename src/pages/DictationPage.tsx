import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Play, Square, Settings2, Eye, EyeOff, XCircle, Check, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs`;

const DictationPage = () => {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [interval, setInterval_] = useState(3);
  const [repeatCount, setRepeatCount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [wordsHidden, setWordsHidden] = useState(false);
  // Active dictation settings (applied snapshot)
  const [activeInterval, setActiveInterval] = useState(3);
  const [activeRepeat, setActiveRepeat] = useState(1);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const stopRef = useRef(false);

  const addWord = () => {
    const trimmed = newWord.trim();
    if (trimmed) {
      const newWords = trimmed.split(/[,，\s]+/).filter(Boolean);
      setWords((prev) => [...prev, ...newWords]);
      setNewWord("");
    }
  };

  const removeWord = (index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllWords = () => {
    if (isPlaying) return;
    setWords([]);
    toast.success("已清除所有单词");
  };

  const applySettings = () => {
    setActiveInterval(interval);
    setActiveRepeat(repeatCount);
    toast.success("设置已应用到当前听写");
  };

  const extractEnglishWords = (text: string): string[] => {
    const matches = text.match(/[a-zA-Z'-]+/g) || [];
    return matches.filter((w) => w.length >= 2 && /[a-zA-Z]/.test(w));
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("请上传 PDF 文件");
      return;
    }
    setIsPdfLoading(true);
    setPdfProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      let allText = "";

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");

        if (pageText.trim()) {
          allText += " " + pageText;
        } else {
          // Fallback: render page to canvas and OCR
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const { data } = await Tesseract.recognize(canvas, "eng");
          allText += " " + data.text;
        }
        setPdfProgress(Math.round((i / totalPages) * 100));
      }

      const englishWords = extractEnglishWords(allText);
      const uniqueWords = [...new Set(englishWords.map((w) => w.toLowerCase()))];

      if (uniqueWords.length === 0) {
        toast.error("未在文档中识别到英文单词");
      } else {
        setWords((prev) => [...prev, ...uniqueWords]);
        toast.success(`成功识别 ${uniqueWords.length} 个英文单词`);
      }
    } catch {
      toast.error("PDF 解析失败，请重试");
    } finally {
      setIsPdfLoading(false);
      setPdfProgress(0);
      e.target.value = "";
    }
  };

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      utterance.rate = 0.9;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });
  }, []);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const startDictation = async () => {
    if (words.length === 0) return;
    setIsPlaying(true);
    stopRef.current = false;
    // Use active (applied) settings
    const usedInterval = activeInterval;
    const usedRepeat = activeRepeat;

    for (let i = 0; i < words.length; i++) {
      if (stopRef.current) break;
      setCurrentIndex(i);
      for (let r = 0; r < usedRepeat; r++) {
        if (stopRef.current) break;
        await speak(words[i]);
        if (stopRef.current) break;
        if (r < usedRepeat - 1) await wait(1000);
      }
      if (stopRef.current) break;
      await wait(usedInterval * 1000);
    }

    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  const stopDictation = () => {
    stopRef.current = true;
    speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">场景词听写</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl space-y-8">
        {/* Add words */}
        <section className="bg-card border rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4" /> 添加单词
            </h2>
            <div className="flex gap-2">
              {words.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWordsHidden(!wordsHidden)}
                    className="text-muted-foreground"
                  >
                    {wordsHidden ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
                    {wordsHidden ? "显示单词" : "隐藏单词"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllWords}
                    disabled={isPlaying}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> 清除全部
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="输入单词，用逗号或空格分隔批量添加"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWord()}
              className="flex-1"
            />
            <Button onClick={addWord} className="bg-primary text-primary-foreground hover:bg-primary/90">
              添加
            </Button>
            <label>
              <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" disabled={isPdfLoading} />
              <Button variant="outline" size="default" asChild disabled={isPdfLoading}>
                <span>
                  {isPdfLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
                  上传PDF
                </span>
              </Button>
            </label>
          </div>

          {isPdfLoading && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">正在解析 PDF... {pdfProgress}%</p>
              <Progress value={pdfProgress} className="h-2" />
            </div>
          )}

          {words.length > 0 && !wordsHidden && (
            <div className="flex flex-wrap gap-2 pt-2">
              {words.map((word, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    currentIndex === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground border-transparent"
                  }`}
                >
                  {word}
                  {!isPlaying && (
                    <button onClick={() => removeWord(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {words.length > 0 && wordsHidden && (
            <p className="text-xs text-muted-foreground pt-2">已隐藏 {words.length} 个单词</p>
          )}
        </section>

        {/* Settings */}
        <section className="bg-card border rounded-xl p-6 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> 听写设置
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">单词间隔</Label>
              <Select value={String(interval)} onValueChange={(v) => setInterval_(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 秒</SelectItem>
                  <SelectItem value="3">3 秒</SelectItem>
                  <SelectItem value="5">5 秒</SelectItem>
                  <SelectItem value="8">8 秒</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">重复次数</Label>
              <Select value={String(repeatCount)} onValueChange={(v) => setRepeatCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 次</SelectItem>
                  <SelectItem value="2">2 次</SelectItem>
                  <SelectItem value="3">3 次</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={applySettings} variant="outline" size="sm" className="w-full">
            <Check className="w-3.5 h-3.5 mr-1.5" /> 应用到当前听写
          </Button>
        </section>

        {/* Controls */}
        <div className="flex justify-center gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {!isPlaying ? (
            <Button
              onClick={startDictation}
              disabled={words.length === 0}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-10"
            >
              <Play className="w-4 h-4 mr-2" /> 开始听写
            </Button>
          ) : (
            <Button onClick={stopDictation} size="lg" variant="outline" className="px-10">
              <Square className="w-4 h-4 mr-2" /> 停止
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default DictationPage;
