import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trackViewContent, trackAddToCart } from "@/lib/tracking";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Lock, ChevronDown, Instagram } from "lucide-react";

// ─── Alimentos por CATEGORIA (Carboidrato / Proteína / Complemento) ─────────────
type Item = { id: string; label: string; emoji: string };

// Leves — café da manhã e café da tarde
const CARB_LEVE: Item[] = [
  { id: "carb_pao", label: "Pão de forma", emoji: "🍞" },
  { id: "carb_pao_frances", label: "Pão francês", emoji: "🥖" },
  { id: "carb_tapioca", label: "Tapioca", emoji: "🫓" },
  { id: "carb_cuscuz", label: "Cuscuz", emoji: "🌽" },
  { id: "carb_pao_queijo", label: "Pão de queijo", emoji: "🧀" },
  { id: "carb_aveia", label: "Aveia", emoji: "🥣" },
  { id: "carb_biscoito", label: "Biscoito água e sal", emoji: "🍪" },
];
const PROT_LEVE: Item[] = [
  { id: "prot_ovo", label: "Ovo", emoji: "🍳" },
  { id: "prot_queijo", label: "Queijo", emoji: "🧀" },
  { id: "prot_minas", label: "Queijo minas", emoji: "🧀" },
  { id: "prot_presunto", label: "Presunto magro", emoji: "🥪" },
  { id: "prot_frango_desf", label: "Frango desfiado", emoji: "🍗" },
  { id: "prot_iogurte", label: "Iogurte", emoji: "🥛" },
  { id: "prot_whey", label: "Whey", emoji: "🥛" },
  { id: "prot_ricota", label: "Ricota", emoji: "🧀" },
];
const FRUTAS: Item[] = [
  { id: "fruta_banana", label: "Banana", emoji: "🍌" },
  { id: "fruta_maca", label: "Maçã", emoji: "🍎" },
  { id: "fruta_mamao", label: "Mamão", emoji: "🍈" },
  { id: "fruta_laranja", label: "Laranja", emoji: "🍊" },
  { id: "fruta_abacaxi", label: "Abacaxi", emoji: "🍍" },
  { id: "fruta_morango", label: "Morango", emoji: "🍓" },
  { id: "fruta_melancia", label: "Melancia", emoji: "🍉" },
  { id: "fruta_melao", label: "Melão", emoji: "🍈" },
  { id: "fruta_pera", label: "Pera", emoji: "🍐" },
  { id: "fruta_uva", label: "Uva", emoji: "🍇" },
];
// Principais — almoço e jantar
const CARB_PRINCIPAL: Item[] = [
  { id: "carb_arroz", label: "Arroz", emoji: "🍚" },
  { id: "carb_arroz_int", label: "Arroz integral", emoji: "🍚" },
  { id: "carb_macarrao", label: "Macarrão", emoji: "🍝" },
  { id: "carb_batata_doce", label: "Batata doce", emoji: "🍠" },
  { id: "carb_mandioca", label: "Mandioca", emoji: "🥔" },
  { id: "carb_inhame", label: "Inhame", emoji: "🥔" },
  { id: "carb_batata", label: "Batata inglesa", emoji: "🥔" },
  { id: "carb_abobora", label: "Abóbora", emoji: "🎃" },
  { id: "carb_cuscuz", label: "Cuscuz", emoji: "🌽" },
];
const PROT_PRINCIPAL: Item[] = [
  { id: "prot_frango", label: "Frango grelhado", emoji: "🍗" },
  { id: "prot_frango_desf", label: "Frango desfiado", emoji: "🍗" },
  { id: "prot_carne", label: "Carne", emoji: "🥩" },
  { id: "prot_patinho", label: "Patinho", emoji: "🥩" },
  { id: "prot_patinho_moido", label: "Patinho moído", emoji: "🥩" },
  { id: "prot_porco", label: "Carne de porco", emoji: "🥩" },
  { id: "prot_peixe", label: "Peixe", emoji: "🐟" },
  { id: "prot_ovo", label: "Ovo", emoji: "🍳" },
];
const COMPLEMENTO: Item[] = [
  { id: "leg_feijao_preto", label: "Feijão preto", emoji: "🫘" },
  { id: "leg_feijao_carioca", label: "Feijão carioca", emoji: "🫘" },
  { id: "leg_lentilha", label: "Lentilha", emoji: "🫘" },
  { id: "leg_grao_bico", label: "Grão-de-bico", emoji: "🫛" },
  { id: "leg_ervilha", label: "Ervilha", emoji: "🫛" },
  { id: "fruta_banana", label: "Banana", emoji: "🍌" },
  { id: "fruta_maca", label: "Maçã", emoji: "🍎" },
];

const HEALTH_CONDITIONS = [
  { id: "diabetes",           label: "Diabetes",                emoji: "🩸" },
  { id: "hipertensao",        label: "Hipertensão",             emoji: "💊" },
  { id: "intolerancia_lactose", label: "Intolerância à Lactose", emoji: "🥛" },
  { id: "bariatrico",         label: "Bariátrico(a)",           emoji: "⚕️" },
  { id: "gestante",           label: "Gestante",                emoji: "🤰" },
  { id: "intolerancia_gluten", label: "Intolerante ao Glúten",  emoji: "🌾" },
  { id: "vegetariano",        label: "Vegetariano(a)",          emoji: "🥦" },
  { id: "vegano",             label: "Vegano(a)",               emoji: "🌱" },
  { id: "crianca",            label: "Criança",                 emoji: "👶" },
];

// ─── Sub-componentes ──────────────────────────────────────────────────────────
type Grupo = { nome: string; emoji: string; itens: Item[]; opcional?: boolean };

function MealSection({
  title, emoji: titleEmoji, grupos, selected, onToggle,
}: {
  title: string; emoji: string;
  grupos: Grupo[];
  selected: string[]; onToggle: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
      <h3 className="text-base font-bold text-gray-900 mb-1">{title} {titleEmoji}</h3>
      <p className="text-xs text-gray-400 mb-4">Escolha pelo menos 1 de cada — quanto mais marcar, mais variadas ficam as 3 opções.</p>
      {grupos.map((g) => {
        const n = selected.filter((id) => g.itens.some((i) => i.id === id)).length;
        return (
          <div key={g.nome} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-600">{g.emoji} {g.nome}{g.opcional ? " (opcional)" : ""}</p>
              <span className={`text-xs font-semibold ${n > 0 ? "text-[#43A047]" : "text-gray-300"}`}>{n} escolhido{n === 1 ? "" : "s"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {g.itens.map((item) => {
                const sel = selected.includes(item.id);
                return (
                  <button key={item.id} onClick={() => onToggle(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl border text-xs font-medium transition-all text-left leading-tight
                      ${sel
                        ? "border-[#43A047] bg-[#43A047]/10 text-[#1B5E20]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#43A047]/40 hover:bg-green-50/50"
                      }`}>
                    <span className="text-sm flex-shrink-0">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SelectField({ placeholder, value, onChange, options }: {
  placeholder: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#43A047]/20 focus:border-[#43A047] transition-all text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Medidas
  const [weight, setWeight]   = useState("");
  const [height, setHeight]   = useState("");
  const [age, setAge]         = useState("");
  const [sex, setSex]         = useState<"male" | "female" | "">("");
  const [goal, setGoal]       = useState("");
  const [mealTimes, setMealTimes]         = useState("");

  // Saúde
  const [healthConditions, setHealthConditions] = useState<string[]>([]);

  // Alimentos
  const [cafeManha,   setCafeManha]   = useState<string[]>([]);
  const [lancheManha, setLancheManha] = useState<string[]>([]);
  const [almoco,      setAlmoco]      = useState<string[]>([]);
  const [lancheTarde, setLancheTarde] = useState<string[]>([]);
  const [janta,       setJanta]       = useState<string[]>([]);
  const [skipLanche,  setSkipLanche]  = useState(false);

  // Rotina
  const [activityLevel,  setActivityLevel]  = useState("");
  const [wantsWorkout,   setWantsWorkout]   = useState("");
  const [wantsChocolate, setWantsChocolate] = useState("");

  const saveFormMutation     = trpc.diet.saveFormData.useMutation();
  const saveFoodsMutation    = trpc.diet.saveFoodSelections.useMutation();
  const createCheckoutMutation = trpc.payment.createCheckout.useMutation();
  const { data: paymentStatus } = trpc.payment.checkStatus.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  // Viu a oferta/quiz (rastreamento de tráfego pago).
  useEffect(() => { trackViewContent(); }, []);

  const toggleFood = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const toggleHealth = (id: string) =>
    setHealthConditions((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleMontarDieta = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!weight || !height || !age) {
      toast.error("Preencha seu peso, altura e idade antes de continuar.");
      return;
    }
    if (!sex) {
      toast.error("Selecione o sexo (Masculino/Feminino) para o cálculo da dieta.");
      return;
    }
    // Cada refeição precisa de ao menos 1 alimento de cada categoria obrigatória.
    const tem = (list: string[], itens: Item[]) => itens.some((i) => list.includes(i.id));
    const faltando: string[] = [];
    if (!tem(cafeManha, CARB_LEVE) || !tem(cafeManha, PROT_LEVE) || !tem(cafeManha, FRUTAS)) faltando.push("Café da manhã");
    if (!skipLanche && (!tem(lancheManha, PROT_LEVE) || !tem(lancheManha, FRUTAS))) faltando.push("Lanche da manhã");
    if (!tem(almoco, CARB_PRINCIPAL) || !tem(almoco, PROT_PRINCIPAL) || !tem(almoco, COMPLEMENTO)) faltando.push("Almoço");
    if (!tem(lancheTarde, CARB_LEVE) || !tem(lancheTarde, PROT_LEVE) || !tem(lancheTarde, FRUTAS)) faltando.push("Café da tarde");
    if (!tem(janta, CARB_PRINCIPAL) || !tem(janta, PROT_PRINCIPAL) || !tem(janta, COMPLEMENTO)) faltando.push("Jantar");
    if (faltando.length) {
      toast.error(`Escolha ao menos 1 de cada categoria em: ${faltando.join(", ")}.`);
      return;
    }
    try {
      await saveFormMutation.mutateAsync({
        weight: parseFloat(weight), height: parseFloat(height), age: parseInt(age),
        sex: sex || undefined, goal: goal || undefined,
        mealTimes: mealTimes || undefined,
        activityLevel: activityLevel || undefined,
        wantsWorkout: wantsWorkout === "sim",
        wantsChocolate: wantsChocolate === "sim",
        healthConditions: healthConditions.join(","),
      });
      await saveFoodsMutation.mutateAsync({
        selections: [
          { mealType: "cafe_manha",    foods: cafeManha },
          { mealType: "almoco",        foods: almoco },
          { mealType: "lanche_tarde",  foods: lancheTarde },
          { mealType: "janta",         foods: janta },
          { mealType: "lanche_manha",  foods: skipLanche ? [] : lancheManha },
        ],
      });
      trackAddToCart(); // montou a dieta → seguindo pro pagamento
      navigate("/pagamento");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao processar. Tente novamente.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
      <div className="w-8 h-8 border-4 border-[#43A047] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  const busy = createCheckoutMutation.isPending || saveFormMutation.isPending || saveFoodsMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* ── 0. HERO NUTRIX ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/nutrix-logo.jpeg"
              alt="NutriX"
              className="w-28 h-28 rounded-full object-cover shadow-md border-4 border-white ring-2 ring-[#43A047]/30"
            />
          </div>
          {/* Nome */}
          <h1 className="text-3xl font-extrabold mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <span style={{ color: "#1B5E20" }}>Nutri</span><span style={{ color: "#E53935" }}>X</span>
          </h1>
          {/* Tagline */}
          <p className="text-sm font-bold tracking-wide mb-5">
            <span style={{ color: "#1B5E20" }}>SAÚDE</span>
            <span className="text-gray-700"> QUE ALIMENTA. </span>
            <span style={{ color: "#E53935" }}>TREINO</span>
            <span className="text-gray-700"> QUE TRANSFORMA.</span>
          </p>
          {/* Ícones de funcionalidades */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: "📋", label: "Plano\nPersonalizado" },
              { icon: "🥗", label: "Receitas\nSaudáveis" },
              { icon: "🏋️", label: "Treinos" },
              { icon: "📈", label: "Evolua\nSempre" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-[#43A047]/10 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight whitespace-pre-line">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 1. MEDIDAS CORPORAIS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Medidas Corporais</h2>
              <p className="text-xs text-gray-400">Preencha para calcular sua dieta personalizada</p>
            </div>
          </div>

          <div className="space-y-3">
            <input type="number" placeholder="Peso (kg)" value={weight} onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#43A047]/20 focus:border-[#43A047] transition-all" />
            <input type="number" placeholder="Altura (cm)" value={height} onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#43A047]/20 focus:border-[#43A047] transition-all" />
            <input type="number" placeholder="Idade" value={age} onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#43A047]/20 focus:border-[#43A047] transition-all" />

            <SelectField placeholder="Objetivo" value={goal} onChange={setGoal}
              options={[
                { value: "weight_loss",    label: "Emagrecimento" },
                { value: "definition",     label: "Definição Muscular" },
                { value: "muscle_gain",    label: "Ganho de Massa" },
                { value: "health",         label: "Saúde e Bem-estar" },
                { value: "maintenance",    label: "Manutenção do Peso" },
              ]}
            />
            <SelectField placeholder="Horários aproximados das Refeições" value={mealTimes} onChange={setMealTimes}
              options={[
                { value: "manha_cedo", label: "Café 6h · Almoço 11h · Janta 18h" },
                { value: "cafe7",      label: "Café 7h · Almoço 12h · Janta 19h" },
                { value: "cafe8",      label: "Café 8h · Almoço 13h · Janta 20h" },
                { value: "cafe9",      label: "Café 9h · Almoço 14h · Janta 21h" },
                { value: "mais_tarde", label: "Café 10h · Almoço 14h · Janta 22h" },
              ]}
            />

            {/* Sexo */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => setSex("male")}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all ${sex === "male" ? "border-[#43A047] bg-[#43A047] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                Masculino
              </button>
              <button onClick={() => setSex("female")}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all ${sex === "female" ? "border-[#E53935] bg-[#E53935] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                Feminino
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. CONDIÇÕES DE SAÚDE ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🏥</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Condições de Saúde</h2>
              <p className="text-xs text-gray-400">Selecione se aplicável (opcional)</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {HEALTH_CONDITIONS.map((c) => {
              const sel = healthConditions.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggleHealth(c.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${sel ? "border-[#43A047] bg-[#43A047]/10 text-[#1B5E20]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-center leading-tight">{c.label}</span>
                </button>
              );
            })}
          </div>
          {healthConditions.includes("crianca") && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
              ⚠️ Para crianças, recomendamos consulta com nutricionista pediátrico.
            </div>
          )}
        </div>

        {/* ── 3. REFEIÇÕES — escolha por categoria (Carboidrato / Proteína / Complemento) ── */}
        <MealSection title="Café da Manhã" emoji="☕" selected={cafeManha}
          onToggle={(id) => toggleFood(cafeManha, setCafeManha, id)}
          grupos={[
            { nome: "Carboidrato", emoji: "🍞", itens: CARB_LEVE },
            { nome: "Proteína", emoji: "🍗", itens: PROT_LEVE },
            { nome: "Fruta", emoji: "🍓", itens: FRUTAS },
          ]} />

        {/* Lanche da Manhã (com opção de pular) */}
        {skipLanche ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Lanche da Manhã 🍎</h3>
            <button onClick={() => setSkipLanche(false)}
              className="text-sm font-semibold text-[#43A047] underline underline-offset-2">Incluir</button>
          </div>
        ) : (
          <div>
            <MealSection title="Lanche da Manhã" emoji="🍎" selected={lancheManha}
              onToggle={(id) => toggleFood(lancheManha, setLancheManha, id)}
              grupos={[
                { nome: "Proteína", emoji: "🍗", itens: PROT_LEVE },
                { nome: "Fruta", emoji: "🍓", itens: FRUTAS },
                { nome: "Carboidrato", emoji: "🍞", itens: CARB_LEVE, opcional: true },
              ]} />
            <button onClick={() => setSkipLanche(true)}
              className="w-full -mt-2 mb-4 text-center text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors">
              Não quero lanche da manhã
            </button>
          </div>
        )}

        <MealSection title="Almoço" emoji="🍽️" selected={almoco}
          onToggle={(id) => toggleFood(almoco, setAlmoco, id)}
          grupos={[
            { nome: "Carboidrato", emoji: "🍚", itens: CARB_PRINCIPAL },
            { nome: "Proteína", emoji: "🥩", itens: PROT_PRINCIPAL },
            { nome: "Complemento (feijão/fruta)", emoji: "🫘", itens: COMPLEMENTO },
          ]} />

        <MealSection title="Café da Tarde" emoji="🍪" selected={lancheTarde}
          onToggle={(id) => toggleFood(lancheTarde, setLancheTarde, id)}
          grupos={[
            { nome: "Carboidrato", emoji: "🍞", itens: CARB_LEVE },
            { nome: "Proteína", emoji: "🍗", itens: PROT_LEVE },
            { nome: "Fruta", emoji: "🍓", itens: FRUTAS },
          ]} />

        <MealSection title="Janta" emoji="🌙" selected={janta}
          onToggle={(id) => toggleFood(janta, setJanta, id)}
          grupos={[
            { nome: "Carboidrato", emoji: "🍚", itens: CARB_PRINCIPAL },
            { nome: "Proteína", emoji: "🥩", itens: PROT_PRINCIPAL },
            { nome: "Complemento (feijão/fruta)", emoji: "🫘", itens: COMPLEMENTO },
          ]} />

        {/* A salada entra como observação "à vontade" na dieta gerada (almoço e jantar). */}

        {/* ── 4. INFORMAÇÕES DE ROTINA ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🏃</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Informações de Rotina</h2>
              <p className="text-xs text-gray-400">Detalhes sobre sua rotina de exercícios</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Como é sua rotina?</label>
              <SelectField placeholder="Quantidade de atividade realizada atualmente" value={activityLevel} onChange={setActivityLevel}
                options={[
                  { value: "sedentario",         label: "Sedentário (pouco ou nenhum exercício)" },
                  { value: "leve",               label: "Levemente ativo (1-3 dias/semana)" },
                  { value: "moderado",           label: "Moderadamente ativo (3-5 dias/semana)" },
                  { value: "muito_ativo",        label: "Muito ativo (6-7 dias/semana)" },
                  { value: "extremamente_ativo", label: "Extremamente ativo (atleta)" },
                ]}
              />
            </div>
            <SelectField placeholder="Deseja treino?" value={wantsWorkout} onChange={setWantsWorkout}
              options={[
                { value: "sim", label: "Sim, quero um plano de treino" },
                { value: "nao", label: "Não, apenas a dieta" },
              ]}
            />
            <SelectField placeholder="Quer chocolate?" value={wantsChocolate} onChange={setWantsChocolate}
              options={[
                { value: "sim", label: "Sim, pode incluir" },
                { value: "nao", label: "Não, prefiro sem" },
              ]}
            />
          </div>
        </div>

        {/* ── 5. PROVA SOCIAL + CTA ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Sua dieta, do seu jeito!</h2>

          {/* Avatares + contador */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {["👩","👨","👩‍🦱","👨‍🦰","👩‍🦳"].map((av, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#43A047] to-[#1B5E20] border-2 border-white flex items-center justify-center text-sm">
                  {av}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">+100 mil pessoas já usaram</span>
          </div>

          {/* Fotos de resultados */}
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">RESULTADOS REAIS</p>
          <div className="grid grid-cols-4 gap-1.5 mb-5 rounded-xl overflow-hidden">
            {[
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=260&fit=crop&crop=center",
              "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=260&fit=crop&crop=center",
              "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=260&fit=crop&crop=center",
              "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&h=260&fit=crop&crop=center",
            ].map((src, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                <img src={src} alt={`Resultado ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>

          {/* Preço + benefícios */}
          <div className="flex gap-6 items-start mb-5">
            <div className="flex-shrink-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">A PARTIR DE</p>
              <p className="text-3xl font-extrabold text-gray-900 leading-none">R$ 9,99</p>
            </div>
            <div className="flex-1 space-y-2 pt-0.5">
              {["Plano alimentar completo", "Baseado nas suas preferências", "Modifique quando quiser"].map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-[#43A047] flex-shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botão principal */}
          <button onClick={handleMontarDieta} disabled={busy}
            className="w-full py-4 rounded-2xl bg-[#43A047] hover:bg-[#388E3C] active:scale-[0.98] text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200/60 disabled:opacity-70 disabled:cursor-not-allowed">
            {busy
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <>Montar minha dieta →</>
            }
          </button>

          {/* Botão secundário */}
          <button onClick={() => {
            if (!paymentStatus?.hasPaidPlan) {
              toast.error("Realize o pagamento primeiro para ver sua dieta.");
              return;
            }
            navigate("/dietas");
          }}
            className="w-full mt-3 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm transition-all hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2">
            <span>📄</span> Ver dieta gerada
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400">Pagamento seguro</span>
          </div>
        </div>

        {/* ── 6. RODAPÉ INSTAGRAM ── */}
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
          <Instagram className="w-4 h-4" />
          <span>Já somos mais de <strong>300 mil</strong> seguidores no Instagram</span>
        </div>

      </div>
    </div>
  );
}
