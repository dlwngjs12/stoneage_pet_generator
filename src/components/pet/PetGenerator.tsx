import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";

const ELEMENT_ORDER = ["지", "수", "화", "풍"];

const ELEMENT_COLORS = {
  "지": "bg-lime-400",
  "수": "bg-sky-400",
  "화": "bg-red-500",
  "풍": "bg-yellow-400"
};

const OPPOSITE_RULES = {
  "지": "화",
  "화": "지",
  "수": "풍",
  "풍": "수"
};

const PRESETS = {
  "지 10": { 지: 10, 수: 0, 화: 0, 풍: 0 },
  "수 10": { 지: 0, 수: 10, 화: 0, 풍: 0 },
  "화 10": { 지: 0, 수: 0, 화: 10, 풍: 0 },
  "풍 10": { 지: 0, 수: 0, 화: 0, 풍: 10 },
  "화7 수3": { 지: 0, 수: 3, 화: 7, 풍: 0 }
};

function applyElementBias(weights: number[], elementValues: number[]) {
  const [earth, water, fire, wind] = elementValues;
  const total = 10;
  return [
    weights[0] + (water / total) * 0.3,
    weights[1] + (fire / total) * 0.3,
    weights[2] + (earth / total) * 0.3,
    weights[3] + (wind / total) * 0.3
  ];
}

function randomStatSplit(total: number, concept: string, elementValues: number[]) {
  const baseWeights: Record<string, number[]> = {
    "공방형": [1, 1.3, 1.3, 1],
    "공순형": [0.8, 1.5, 0.8, 1.4],
    "탱커형": [1.4, 0.8, 1.4, 1],
    "순방형": [1.2, 0.8, 1.4, 1.2],
    "밸런스형": [1, 1, 1, 1]
  };

  let weights = [...(baseWeights[concept] || baseWeights["밸런스형"])];
  if (concept === "밸런스형") weights = weights.map(w => w + (Math.random() * 0.2 - 0.1));
  weights = applyElementBias(weights, elementValues);

  const sum = weights.reduce((a, b) => a + b, 0);
  let values = weights.map(w => Math.floor((w / sum) * total));
  let diff = total - values.reduce((a, b) => a + b, 0);

  while (diff > 0) {
    values[Math.floor(Math.random() * 4)]++;
    diff--;
  }
  return values;
}

function validateElements(valuesObj: Record<string, number>) {
  const values = ELEMENT_ORDER.map(k => valuesObj[k]);
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum !== 10) throw new Error("속성 총합은 반드시 10이어야 합니다.");
  if ((valuesObj["지"] > 0 && valuesObj["화"] > 0) || (valuesObj["수"] > 0 && valuesObj["풍"] > 0)) {
    throw new Error("반대 속성은 함께 사용할 수 없습니다.");
  }
  return values;
}

function calculateBaseStats(stats: number[], initialValue: number) {
  const [vit, str, tgh, dex] = stats;
  const vitCoef = (vit * initialValue) / 100;
  const strCoef = (str * initialValue) / 100;
  const tghCoef = (tgh * initialValue) / 100;
  const dexCoef = (dex * initialValue) / 100;

  return [
    Math.floor((vitCoef * 4) + strCoef + tghCoef + dexCoef),
    Math.floor((vitCoef * 0.1) + strCoef + (tghCoef * 0.1) + (dexCoef * 0.05)),
    Math.floor((vitCoef * 0.1) + (strCoef * 0.1) + tghCoef + (dexCoef * 0.05)),
    Math.floor(dexCoef)
  ];
}

export default function PetGenerator() {
  const [name, setName] = useState("");
  const [tempId, setTempId] = useState("");
  const [imageId, setImageId] = useState("100000");
  const [total, setTotal] = useState(100);
  const [initialValue, setInitialValue] = useState(30);
  const [concept, setConcept] = useState("밸런스형");
  const [elements, setElements] = useState({ 지: 0, 수: 0, 화: 0, 풍: 0 });
  const [captureDifficulty, setCaptureDifficulty] = useState(0);
  const [rarity, setRarity] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [overlay, setOverlay] = useState<string | null>(null);

  const showOverlay = (msg: string) => {
    setOverlay(msg);
    setTimeout(() => setOverlay(null), 1500);
  };

  const clearElements = () => setElements({ 지: 0, 수: 0, 화: 0, 풍: 0 });
  const applyPreset = (preset: Record<string, number>) => {
    try {
      validateElements(preset);
      setElements(preset);
    } catch (e: any) {
      showOverlay(e.message);
    }
  };

  const handleElementChange = (element: string, value: number) => {
    const current = { ...elements };
    const active = ELEMENT_ORDER.filter(k => current[k] > 0);
    if (!current[element] && active.length >= 2) return showOverlay("속성은 최대 2개까지만 선택 가능합니다.");

    const opposite = OPPOSITE_RULES[element];
    if (current[opposite] > 0 && value > 0) return showOverlay("반대 속성은 함께 선택할 수 없습니다.");

    const totalCurrent = ELEMENT_ORDER.reduce((s, k) => s + current[k], 0);
    const diff = value - current[element];
    if (totalCurrent + diff > 10) {
      let excess = totalCurrent + diff - 10;
      for (let k of ELEMENT_ORDER) {
        if (k !== element && current[k] > 0 && excess > 0) {
          const reduce = Math.min(current[k], excess);
          current[k] -= reduce;
          excess -= reduce;
        }
      }
    }
    current[element] = value;
    setElements(current);
  };

  const generate = () => {
    try {
      const elementArray = validateElements(elements);
      const scaledElements = elementArray.map(v => v * 10); // 0~100으로 변환
      const stats = randomStatSplit(Number(total), concept, elementArray);
      const baseStats = calculateBaseStats(stats, Number(initialValue));
      const finalName = name || "이름";
      const finalId = tempId || "9999";
      const enemybaseLine = `${finalName},컁,記,秊,므,制皐,${finalId},${initialValue},5.0,${stats[0]},${stats[1]},${stats[2]},${stats[3]},19,${captureDifficulty},${scaledElements.join(",")},0,0,0,0,0,0,0,0,0,1,,,,,,${rarity},1,1,5,${imageId},1,1,,0,500,,0,500,,0,500,,0,500,,0,500,,0`;
      setResult({ stats, baseStats, elementArray, enemybaseLine });
    } catch (err: any) {
      showOverlay(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 grid place-items-center relative">
      <AnimatePresence>
        {overlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-black/85 text-white px-8 py-4 rounded-2xl shadow-2xl text-lg font-semibold">{overlay}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-[900px] rounded-2xl shadow-xl bg-white">
          <CardContent className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">펫 초기치 + enemybase 생성기</h1>

            {/* 이름, 임시번호, 이미지 */}
            <div className="grid grid-cols-3 gap-4">
              <InputField label="이름" value={name} onChange={setName} />
              <InputField label="임시번호" value={tempId} onChange={setTempId} />
              <InputField label="이미지 번호" value={imageId} onChange={setImageId} />
            </div>

            {/* 총합/초기치/컨셉 */}
            <div className="grid grid-cols-3 gap-4">
              <InputField label="총합 스탯" type="number" value={total} onChange={v => setTotal(Number(v))} />
              <InputField label="초기수치" type="number" value={initialValue} onChange={v => setInitialValue(Number(v))} />
              <SelectField label="컨셉" options={["공방형", "공순형", "탱커형", "순방형", "밸런스형"]} value={concept} onChange={setConcept}  />
            </div>

            {/* 속성 슬라이더 */}
            <div>
              <label className="font-semibold">속성 선택</label>
              <div className="flex gap-2 mt-3 flex-wrap">
                {Object.entries(PRESETS).map(([label, preset]) => {
				  const activeElements = Object.entries(preset)
					.filter(([_, v]) => v > 0)
					.map(([el]) => ELEMENT_COLORS[el]);

				  // 단일 속성 색상
				  const bgClass = activeElements.length === 1
					? activeElements[0]
					: "bg-gray-300"; // 여러 속성은 흰색 배경으로

				  // 글씨 색상 결정
				  const textClass = activeElements.length === 1
					? "text-white"
					: "text-black";

				  return (
					<Button
					  key={label}
					  variant="outline"
					  onClick={() => applyPreset(preset)}
					  className={`font-bold transition-colors duration-200 hover:opacity-60 ${bgClass} ${textClass}`}
					>
					  {label}
					</Button>
				  );
				})}
                <Button variant="destructive" onClick={clearElements} className={`hover:bg-gray-100 font-bold`}>초기화</Button>
              </div>
              <div className="flex gap-4 mt-2">
                {ELEMENT_ORDER.map(el => (
                  <div key={el} className="flex-1">
                    <div className={`mb-1 px-2 py-1 rounded-xl text-white font-bold text-center ${ELEMENT_COLORS[el]}`}>
                      {el} ({elements[el]})
                    </div>
					<Slider
					  value={[elements[el]]}
					  min={0}
					  max={10}
					  step={1}
					  onValueChange={val => handleElementChange(el, val[0])}
					  className="my-2"
					/>
					<div className="text-center font-medium">{elements[el]}</div> {/* 실시간 값 표시 */}
                  </div>
                ))}
              </div>
            </div>

            {/* 포획 난이도/희귀도 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="mt-2">
                <SliderControl label="포획 난이도" value={captureDifficulty} min={0} max={10} onChange={setCaptureDifficulty} color="bg-gray-600" />
			    <div className="text-center font-medium">{captureDifficulty}</div> {/* 실시간 값 표시 */}
			  </div>
              <div className="mt-2">
                <SliderControl label="희귀도" value={rarity} min={0} max={2} onChange={setRarity} color="bg-purple-500" />
			    <div className="text-center font-medium">{rarity}</div> {/* 실시간 값 표시 */}
			  </div>
            </div>

            {/* 생성 버튼 */}
            <Button onClick={generate} className="w-full mt-4">생성</Button>

            {/* 결과 */}
            {result && (
              <div className="space-y-3 pt-4 border-t text-sm">
                <div>기초 분배 → 체:{result.stats[0]} 공:{result.stats[1]} 방:{result.stats[2]} 순:{result.stats[3]}</div>
                <div>1레벨 초기치 → 체:{result.baseStats[0]} 공:{result.baseStats[1]} 방:{result.baseStats[2]} 순:{result.baseStats[3]}</div>
                <div>속성 → 지:{result.elementArray[0]} 수:{result.elementArray[1]} 화:{result.elementArray[2]} 풍:{result.elementArray[3]}</div>
                <div>
                  <label className="font-medium">enemybase 출력</label>
                  <textarea className="w-full h-32 p-2 border rounded-2xl text-xs" value={result.enemybaseLine} readOnly />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ========== 부가 컴포넌트 ==========
const InputField = ({ label, value, onChange, type = "text" }: any) => (
  <div>
    <label className="block mb-1">{label}</label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const SelectField = ({ label, options, value, onChange }: any) => (
  <div>
    <label className="block mb-1">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent className="bg-white text-black shadow-lg rounded-lg">
        {options.map((opt: string) => <SelectItem key={opt} value={opt} className="hover:bg-blue-200 hover:font-bold rounded-lg">{opt}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

const SliderControl = ({ label, value, min, max, onChange, color }: any) => (
  <div>
    <label className="block mb-1 font-semibold">{label}</label>
    <Slider value={[value]} min={min} max={max} step={1} onValueChange={(val) => onChange(val[0])} className="h-4">
      <Slider.Track className={`bg-gray-300 h-4 rounded-full`}>
        <Slider.Range className={`${color} rounded-full`} />
      </Slider.Track>
      <Slider.Thumb className={`${color} border border-white w-5 h-5`} />
    </Slider>
  </div>
);
