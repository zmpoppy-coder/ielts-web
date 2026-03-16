import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Upload, ImagePlus, Loader2, Trash2, Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Tesseract from "tesseract.js";

interface Sentence {
  text: string;
}

const ListeningPage = () => {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [wordInputs, setWordInputs] = useState<string[]>([]);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [sentenceHidden, setSentenceHidden] = useState(true);
  const [ocrProgress, setOcrProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wordInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const ocrPasteAreaRef = useRef<HTMLDivElement>(null);

  const currentSentence = sentences[currentSentenceIndex];
  const originalWords = currentSentence
    ? currentSentence.text.toLowerCase().replace(/[^\w\s']/g, "").split(/\s+/).filter(Boolean)
    : [];

  useEffect(() => {
    if (originalWords.length > 0) {
      setWordInputs(new Array(originalWords.length).fill(""));
      wordInputRefs.current = new Array(originalWords.length).fill(null);
    }
  }, [currentSentenceIndex, sentences]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setAudioFileName(file.name);

    // Simulate upload progress with FileReader
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    reader.onload = () => {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      setUploadProgress(100);
      setTimeout(() => setIsUploading(false), 500);
      toast.success("音频上传成功");
    };
    reader.readAsArrayBuffer(file);
  };

  const deleteAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    speechSynthesis.cancel();
    if (audioSrc) URL.revokeObjectURL(audioSrc);
    setAudioSrc(null);
    setAudioFileName("");
    setIsPlaying(false);
    setUploadProgress(0);
    toast.success("音频已删除");
  };

  const processOcrImage = async (source: File | Blob) => {
    setIsOcrLoading(true);
    setOcrProgress(0);
    try {
      const { data } = await Tesseract.recognize(source, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });
      const text = data.text.trim();
      if (!text) {
        toast.error("未识别到文字，请尝试更清晰的图片");
        return;
      }
      setTranscriptText(text);
      parseTranscript(text);
    } catch {
      toast.error("图片识别失败，请重试");
    } finally {
      setIsOcrLoading(false);
      setOcrProgress(0);
    }
  };

  const handleImageOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processOcrImage(file);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          toast.info("正在识别粘贴的图片...");
          await processOcrImage(blob);
        }
        return;
      }
    }
  };

  const extractRelevantContent = (text: string): string => {
    // Try to extract content between "now listen carefully" and "before you hear"
    const lower = text.toLowerCase();
    const startMarkers = ["now listen carefully", "listen carefully and answer"];
    const endMarkers = ["before you hear", "before listening"];
    
    let startIdx = 0;
    for (const marker of startMarkers) {
      const idx = lower.indexOf(marker);
      if (idx !== -1) {
        // Find end of the marker sentence (next period or newline)
        const afterMarker = text.indexOf(".", idx + marker.length);
        startIdx = afterMarker !== -1 ? afterMarker + 1 : idx + marker.length;
        break;
      }
    }

    let endIdx = text.length;
    for (const marker of endMarkers) {
      const idx = lower.indexOf(marker, startIdx);
      if (idx !== -1) {
        endIdx = idx;
        break;
      }
    }

    return text.slice(startIdx, endIdx).trim();
  };

  const parseTranscript = (rawText?: string) => {
    const text = rawText || transcriptText;
    if (!text.trim()) return;
    const extracted = extractRelevantContent(text);
    const lines = extracted.split("\n").filter(l => l.trim());
    const parsed: Sentence[] = lines.map((line) => ({ text: line.trim() }));
    if (parsed.length === 0) {
      toast.error("未能提取有效句子");
      return;
    }
    setSentences(parsed);
    setCurrentSentenceIndex(0);
    setShowTranscriptInput(false);
    toast.success(`已加载 ${parsed.length} 个句子，可以开始听写`);
  };

  const playCurrentSentence = useCallback(() => {
    if (!currentSentence) return;
    if (!audioSrc) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentSentence.text);
      utterance.lang = "en-GB";
      utterance.rate = 0.85;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioSrc, currentSentence]);

  const pauseAudio = () => {
    if (audioRef.current) audioRef.current.pause();
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const goToSentence = (index: number) => {
    if (index >= 0 && index < sentences.length) {
      setCurrentSentenceIndex(index);
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleWordChange = (index: number, value: string) => {
    const trimmed = value.replace(/\s/g, "");
    const updated = [...wordInputs];
    updated[index] = trimmed;
    setWordInputs(updated);

    if (value.endsWith(" ") && trimmed && index < originalWords.length - 1) {
      wordInputRefs.current[index + 1]?.focus();
    }
  };

  const handleWordKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      if (index < originalWords.length - 1) {
        wordInputRefs.current[index + 1]?.focus();
      }
    }
    if (e.key === "Backspace" && !wordInputs[index] && index > 0) {
      wordInputRefs.current[index - 1]?.focus();
    }
  };

  const getWordStatus = (index: number): "correct" | "incorrect" | "empty" => {
    const input = wordInputs[index]?.toLowerCase().replace(/[^\w']/g, "");
    if (!input) return "empty";
    return input === originalWords[index] ? "correct" : "incorrect";
  };

  const filledCount = wordInputs.filter((w) => w.trim()).length;
  const correctCount = wordInputs.filter((w, i) => {
    const input = w?.toLowerCase().replace(/[^\w']/g, "");
    return input && input === originalWords[i];
  }).length;
  const accuracy = filledCount > 0 ? Math.round((correctCount / filledCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">精听练习</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl space-y-6">
        {/* Audio upload & transcript */}
        <section className="bg-card border rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-foreground">音频与原文</h2>
            <div className="flex gap-2 flex-wrap">
              <label>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-3 h-3 mr-1.5" /> 上传音频</span>
                </Button>
              </label>
              <label>
                <input type="file" accept="image/*" onChange={handleImageOcr} className="hidden" />
                <Button variant="outline" size="sm" asChild disabled={isOcrLoading}>
                  <span>
                    {isOcrLoading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <ImagePlus className="w-3 h-3 mr-1.5" />}
                    原文图片识别
                  </span>
                </Button>
              </label>
              <Button variant="outline" size="sm" onClick={() => setShowTranscriptInput(!showTranscriptInput)}>
                编辑原文
              </Button>
            </div>
          </div>

          {/* Audio status */}
          {isUploading && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">正在上传: {audioFileName}</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          {audioSrc && !isUploading && (
            <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-2">
              <span className="text-sm text-foreground truncate">{audioFileName}</span>
              <Button variant="ghost" size="sm" onClick={deleteAudio} className="text-destructive hover:text-destructive shrink-0">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> 删除
              </Button>
            </div>
          )}
          {audioSrc && <audio ref={audioRef} src={audioSrc} className="hidden" onEnded={() => setIsPlaying(false)} />}

          {/* OCR paste area */}
          <div
            ref={ocrPasteAreaRef}
            onPaste={handlePaste}
            tabIndex={0}
            className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground cursor-pointer focus:border-primary focus:outline-none transition-colors"
          >
            {isOcrLoading ? (
              <div className="space-y-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                <p>正在识别中... {ocrProgress}%</p>
                <Progress value={ocrProgress} className="h-1.5 max-w-xs mx-auto" />
              </div>
            ) : (
              <p>点击此处后，按 Ctrl+V 粘贴图片进行原文识别</p>
            )}
          </div>

          {showTranscriptInput && (
            <div className="space-y-2">
              <Textarea
                placeholder="每行输入一个句子作为原文..."
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                rows={6}
              />
              <Button onClick={() => parseTranscript()} size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                应用原文
              </Button>
            </div>
          )}

          {!audioSrc && sentences.length > 0 && (
            <p className="text-xs text-muted-foreground">未上传音频，将使用英音语音合成朗读当前句子。</p>
          )}
          {sentences.length === 0 && !isOcrLoading && (
            <p className="text-xs text-muted-foreground">请先通过"编辑原文"、"原文图片识别"或粘贴图片加载句子。</p>
          )}
        </section>

        {sentences.length > 0 && (
          <>
            {/* Player controls */}
            <section className="bg-card border rounded-xl p-6 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  句子 {currentSentenceIndex + 1} / {sentences.length}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => goToSentence(currentSentenceIndex - 1)} disabled={currentSentenceIndex === 0}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => goToSentence(currentSentenceIndex + 1)} disabled={currentSentenceIndex === sentences.length - 1}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {/* Show/Hide sentence toggle */}
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
                <span className="text-sm text-foreground">
                  {sentenceHidden ? "••••••••••" : currentSentence?.text}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSentenceHidden(!sentenceHidden)} className="shrink-0 ml-2">
                  {sentenceHidden ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
                  {sentenceHidden ? "显示" : "隐藏"}
                </Button>
              </div>
              <div className="flex justify-center gap-3">
                {!isPlaying ? (
                  <Button onClick={playCurrentSentence} size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8">
                    <Play className="w-4 h-4 mr-2" /> 播放
                  </Button>
                ) : (
                  <Button onClick={pauseAudio} size="lg" variant="outline" className="px-8">
                    <Pause className="w-4 h-4 mr-2" /> 暂停
                  </Button>
                )}
                <Button onClick={playCurrentSentence} size="lg" variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" /> 重听
                </Button>
              </div>
            </section>

            {/* Word-by-word answer area — underline style */}
            <section className="bg-card border rounded-xl p-6 space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">听写区域</h2>
                {filledCount > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    正确率：<span className={accuracy >= 80 ? "text-success" : accuracy >= 50 ? "text-foreground" : "text-error"}>{accuracy}%</span>
                    <span className="ml-1.5">({correctCount}/{filledCount})</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-2 gap-y-5 items-end leading-loose">
                {originalWords.map((_, i) => {
                  const status = getWordStatus(i);
                  const colorClass =
                    status === "correct"
                      ? "text-success"
                      : status === "incorrect"
                      ? "text-error"
                      : "text-foreground";
                  const borderColor =
                    status === "correct"
                      ? "border-success"
                      : status === "incorrect"
                      ? "border-error"
                      : "border-muted-foreground/40";

                  return (
                    <div key={`${currentSentenceIndex}-${i}`} className="flex flex-col items-center gap-0.5">
                      <input
                        ref={(el) => { wordInputRefs.current[i] = el; }}
                        value={wordInputs[i] || ""}
                        onChange={(e) => handleWordChange(i, e.target.value)}
                        onKeyDown={(e) => handleWordKeyDown(i, e)}
                        className={`bg-transparent border-0 border-b-2 ${borderColor} ${colorClass} outline-none text-sm font-medium text-center transition-colors px-1 py-0.5`}
                        style={{ width: `${Math.max(originalWords[i]?.length * 10, 40)}px` }}
                        placeholder="___"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {status === "correct" && (
                        <Check className="w-3.5 h-3.5 text-success" />
                      )}
                      {status === "incorrect" && (
                        <X className="w-3.5 h-3.5 text-error" />
                      )}
                      {status === "empty" && (
                        <span className="h-3.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ListeningPage;
