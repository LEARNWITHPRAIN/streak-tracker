import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, Lock, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { NewMealInput } from '@/hooks/useMealLogs';
import { toast } from 'sonner';

interface MealUploaderProps {
  onMealDetected: (meal: NewMealInput) => Promise<boolean>;
}

interface ScanResult {
  meal_name: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  notes: string;
}

const NVIDIA_KEY = import.meta.env.VITE_NVIDIA_API_KEY;

export const MealUploader: React.FC<MealUploaderProps> = ({ onMealDetected }) => {
  const { isPremium } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerUpload = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let { width, height } = img;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setScanResult(null);
      const base64Data = await compressImage(file);
      setPreviewImage(base64Data);

      // Call NVIDIA Vision API
      const result = await analyzeMealWithNvidia(base64Data);
      setScanResult(result);
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      toast.error('Could not analyze photo. Please enter manually or try another angle.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const analyzeMealWithNvidia = async (base64Image: string): Promise<ScanResult> => {
    if (!NVIDIA_KEY) {
      throw new Error('NVIDIA API Key is missing');
    }

    const prompt = `You are a certified sports nutritionist and food recognition AI for Yodha Mode.
Analyze the provided meal photo carefully. Estimate the dish name, approximate portion size, calories (kcal), and macronutrients (protein in grams, carbs in grams, fat in grams, fiber in grams).

Respond STRICTLY with valid JSON in this exact structure without markdown or backticks:
{
  "meal_name": "Name of dish and estimated portion",
  "calories_kcal": 550,
  "protein_g": 35,
  "carbs_g": 45,
  "fat_g": 18,
  "fiber_g": 6,
  "notes": "Short 1-sentence breakdown of identified items"
}`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: base64Image } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('NVIDIA API error response:', errText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    // Extract JSON block
    const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr);
      return {
        meal_name: String(parsed.meal_name || 'Scanned Meal'),
        calories_kcal: Number(parsed.calories_kcal) || 300,
        protein_g: Number(parsed.protein_g) || 20,
        carbs_g: Number(parsed.carbs_g) || 30,
        fat_g: Number(parsed.fat_g) || 10,
        fiber_g: Number(parsed.fiber_g) || 3,
        notes: String(parsed.notes || 'AI Vision Estimate'),
      };
    }

    throw new Error('Could not parse meal macros from AI response');
  };

  const handleConfirmAdd = async () => {
    if (!scanResult) return;
    const ok = await onMealDetected({
      meal_name: scanResult.meal_name,
      calories_kcal: scanResult.calories_kcal,
      protein_g: scanResult.protein_g,
      carbs_g: scanResult.carbs_g,
      fat_g: scanResult.fat_g,
      fiber_g: scanResult.fiber_g,
      notes: scanResult.notes,
      source: 'ai_scan',
    });

    if (ok) {
      setScanResult(null);
      setPreviewImage(null);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-card/70 to-background/90 p-5 shadow-xl">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  AI Meal Vision Scanner
                  {!isPremium && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm">
                      <Lock className="w-2.5 h-2.5" /> PRO
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Snap a photo of your plate — our AI calculates calories, protein, carbs & fats automatically
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              onClick={handleTriggerUpload}
              disabled={isScanning}
              className={`w-full sm:w-auto font-bold shadow-lg transition-all duration-300 ${
                isPremium
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Plate...
                </>
              ) : isPremium ? (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Plate with Camera
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock AI Scanner (₹149/mo)
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Scanning Preview / Result Display */}
        {previewImage && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="relative rounded-xl overflow-hidden border border-border/80 aspect-video md:aspect-square bg-muted/30">
                <img
                  src={previewImage}
                  alt="Scanned meal"
                  className="w-full h-full object-cover"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                    <p className="text-xs font-semibold text-foreground">Analyzing macros with Llama-3.2 Vision...</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Identifying ingredients and portion sizes</p>
                  </div>
                )}
              </div>

              {scanResult && (
                <div className="md:col-span-2 space-y-3">
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground">{scanResult.meal_name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        AI Detected
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{scanResult.notes}</p>

                    <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                      <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="text-[10px] text-orange-400 font-semibold">Calories</div>
                        <div className="text-sm font-extrabold text-foreground font-mono">{scanResult.calories_kcal}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="text-[10px] text-purple-400 font-semibold">Protein</div>
                        <div className="text-sm font-extrabold text-foreground font-mono">{scanResult.protein_g}g</div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-[10px] text-blue-400 font-semibold">Carbs</div>
                        <div className="text-sm font-extrabold text-foreground font-mono">{scanResult.carbs_g}g</div>
                      </div>
                      <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                        <div className="text-[10px] text-pink-400 font-semibold">Fat</div>
                        <div className="text-sm font-extrabold text-foreground font-mono">{scanResult.fat_g}g</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreviewImage(null);
                        setScanResult(null);
                      }}
                      className="text-xs"
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmAdd}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Add to Today's Log
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Paywall modal if clicked while on free plan */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="meal_scan"
      />
    </>
  );
};
