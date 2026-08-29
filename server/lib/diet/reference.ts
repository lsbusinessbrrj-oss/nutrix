// Dieta de referência transcrita das fotos (reference-diet.md).
// Cada refeição tem opções fixas (como no app de referência), com quantidades
// calibradas para ~2213 kcal (homem 87 kg) e substituições exatas por alimento.
// As quantidades são escaladas pela meta calórica de cada cliente.

export const REF_KCAL = 2213;

export interface RefItem {
  name: string;
  qtd: string;        // quantidade exata (exibida quando a escala ≈ 1)
  baseG: number;      // gramas de referência (para escalar)
  kcal100: number;    // kcal por 100 g (para escalar por calorias)
  p100: number;       // proteína por 100 g (para o controle de proteína)
  medida?: string;    // medida caseira p/ recomputar ao escalar
  gPorMedida?: number;
  unidade?: "g" | "ml";
  fixo?: boolean;     // não escala (café, azeite, requeijão, salada, leite)
  livre?: boolean;    // "À vontade"
}

// Atalho para criar item. (kcal e proteína por 100 g vêm da base da nutri.)
const I = (
  name: string, qtd: string, baseG: number, kcal100: number, p100: number,
  o: Partial<RefItem> = {},
): RefItem => ({ name, qtd, baseG, kcal100, p100, unidade: "g", ...o });

// ── Opções por refeição ──
export interface RefOpcao { itens: RefItem[]; obs?: string }
export interface RefRefeicao { key: string; name: string; time: string; opcoes: RefOpcao[] }

const CAFE_OP1: RefOpcao = {
  itens: [
    I("Ovo de galinha cozido", "2 unidades médias ou 100g", 100, 155, 13, { medida: "unidade média", gPorMedida: 50 }),
    I("Pão francês", "1 unidade ou 50g", 50, 300, 8, { medida: "unidade", gPorMedida: 50 }),
    I("Requeijão Cremoso Light", "15 g", 15, 160, 11, { fixo: true }),
    I("Banana prata", "1 unidade média ou 42,3g", 42.3, 98, 1.3, { medida: "unidade média", gPorMedida: 42.3 }),
    I("Aveia em flocos", "1 colher de sopa cheia ou 15g", 15, 389, 13.9, { medida: "colher de sopa cheia", gPorMedida: 15 }),
    I("Café", "1 xícara de chá ou 200ml", 200, 2, 0.1, { fixo: true, unidade: "ml" }),
  ],
};
const CAFE_OP2: RefOpcao = {
  itens: [
    I("Whey protein concentrado", "1 medidor ou 30g", 30, 400, 80, { medida: "medidor", gPorMedida: 30 }),
    I("Leite semidesnatado", "200 ml", 200, 42, 3.3, { fixo: true, unidade: "ml" }),
    I("Banana prata", "1 unidade média ou 65g", 65, 98, 1.3, { medida: "unidade média", gPorMedida: 65 }),
    I("Aveia em flocos", "2 colheres de sopa cheias ou 30g", 30, 389, 13.9, { medida: "colher de sopa cheia", gPorMedida: 15 }),
  ],
  obs: "Pode ser batida como vitamina ou mousse (tudo no liquidificador).",
};

const LANCHE_OP1: RefOpcao = {
  itens: [
    I("Whey protein concentrado", "1 medidor ou 30g", 30, 400, 80, { medida: "medidor", gPorMedida: 30 }),
    I("Banana prata", "1 unidade média ou 65g", 65, 98, 1.3, { medida: "unidade média", gPorMedida: 65 }),
  ],
  obs: "Lanche leve — pode ser batido com água ou leite (vitamina).",
};
const LANCHE_OP2: RefOpcao = {
  itens: [
    I("Iogurte natural", "1 pote ou 170g", 170, 56, 3.8, { medida: "pote", gPorMedida: 170 }),
    I("Aveia em flocos", "2 colheres de sopa cheias ou 30g", 30, 389, 13.9, { medida: "colher de sopa cheia", gPorMedida: 15 }),
    I("Banana prata", "1 unidade média ou 65g", 65, 98, 1.3, { medida: "unidade média", gPorMedida: 65 }),
  ],
};

const TARDE_OP1: RefOpcao = {
  itens: [
    I("Ovo de galinha cozido", "2 unidades médias ou 100g", 100, 155, 13, { medida: "unidade média", gPorMedida: 50 }),
    I("Pão francês", "1 unidade ou 50g", 50, 300, 8, { medida: "unidade", gPorMedida: 50 }),
    I("Requeijão Cremoso Light", "15 g", 15, 160, 11, { fixo: true }),
    I("Banana prata", "1 unidade média ou 42,3g", 42.3, 98, 1.3, { medida: "unidade média", gPorMedida: 42.3 }),
    I("Café", "1 xícara de chá ou 200ml", 200, 2, 0.1, { fixo: true, unidade: "ml" }),
  ],
};
const TARDE_OP2: RefOpcao = {
  itens: [
    I("Whey protein concentrado", "40 g", 40, 400, 80, { medida: "medidor", gPorMedida: 30 }),
    I("Leite semidesnatado", "200 ml", 200, 42, 3.3, { fixo: true, unidade: "ml" }),
    I("Banana prata", "1 unidade média ou 65g", 65, 98, 1.3, { medida: "unidade média", gPorMedida: 65 }),
    I("Aveia em flocos", "2 colheres de sopa cheias ou 30g", 30, 389, 13.9, { medida: "colher de sopa cheia", gPorMedida: 15 }),
  ],
};

const PRINCIPAL_OP1: RefOpcao = {
  itens: [
    I("Filé de frango grelhado", "150 g", 150, 165, 31),
    I("Arroz branco cozido", "150 g", 150, 130, 2.5),
    I("Feijão preto cozido", "100 g", 100, 77, 4.5),
    I("Brócolis", "100 g", 100, 34, 2.8, { fixo: true }),
    I("Salada (alface, rúcula, tomate, pepino, cebola)", "À vontade", 0, 15, 1.5, { fixo: true, livre: true }),
    I("Azeite de oliva", "2 colheres de sobremesa ou 10g", 10, 884, 0, { fixo: true, medida: "colher de sobremesa", gPorMedida: 5 }),
  ],
  obs: "Fontes de carboidrato podem ser combinadas/substituídas mantendo a quantidade total. Legumes e verduras podem ser combinados mantendo o volume.",
};
const PRINCIPAL_OP2: RefOpcao = {
  itens: [
    I("Patinho grelhado com molho de tomate", "150 g", 150, 219, 31),
    I("Macarrão cozido", "200 g", 200, 158, 5.8),
    I("Azeite de oliva", "2 colheres de sobremesa ou 10g", 10, 884, 0, { fixo: true, medida: "colher de sobremesa", gPorMedida: 5 }),
  ],
  obs: "Proteína grelhada/assada/refogada com pouca gordura; permitido queijo ralado em pequena quantidade.",
};
const JANTAR_OP3: RefOpcao = {
  itens: [
    I("Patinho grelhado/assado", "150 g", 150, 219, 31),
    I("Pão de hambúrguer", "1 unidade ou 50g", 50, 280, 9, { medida: "unidade", gPorMedida: 50 }),
    I("Queijo muçarela", "1 fatia média ou 20g", 20, 280, 22, { medida: "fatia média", gPorMedida: 20 }),
  ],
  obs: "Variação no cardápio: pode ser hambúrguer fit ou Rap10 com peito de frango desfiado e cream cheese.",
};

export const REF_REFEICOES: RefRefeicao[] = [
  { key: "cafe_manha", name: "Café da manhã", time: "08:30", opcoes: [CAFE_OP1, CAFE_OP2] },
  { key: "lanche_manha", name: "Lanche da manhã", time: "10:30", opcoes: [LANCHE_OP1, LANCHE_OP2] },
  { key: "almoco", name: "Almoço", time: "12:00", opcoes: [PRINCIPAL_OP1, PRINCIPAL_OP2] },
  { key: "lanche_tarde", name: "Café da Tarde", time: "17:00", opcoes: [TARDE_OP1, TARDE_OP2] },
  { key: "janta", name: "Jantar", time: "21:00", opcoes: [PRINCIPAL_OP1, PRINCIPAL_OP2, JANTAR_OP3] },
];

// ── Substituições exatas por alimento (das fotos) ──
export const REF_SUBS: Record<string, { name: string; quantity: string }[]> = {
  "Ovo de galinha cozido": [
    { name: "Queijo minas", quantity: "2 fatias médias ou 60g" },
    { name: "Frango desfiado", quantity: "80 g" },
    { name: "Ovo mexido", quantity: "2 unidades médias ou 100g" },
    { name: "Atum em conserva", quantity: "80 g" },
    { name: "Queijo cottage 1%", quantity: "2 fatias ou 74g" },
  ],
  "Pão francês": [
    { name: "Pão de forma integral", quantity: "1 fatia ou 25g" },
    { name: "Pão de forma", quantity: "1 fatia ou 25g" },
    { name: "Pão sírio", quantity: "1 unidade ou 60g" },
    { name: "Pão de forma de milho", quantity: "1 fatia ou 25g" },
    { name: "Goma de tapioca", quantity: "30 g" },
    { name: "Rap10 original", quantity: "1 unidade ou 40g" },
    { name: "Torrada Magic Toast", quantity: "6 unidades ou 24g" },
  ],
  "Requeijão Cremoso Light": [
    { name: "Cream cheese light", quantity: "15 g" },
    { name: "Creme de ricota", quantity: "15 g" },
    { name: "Maionese light", quantity: "15 g" },
  ],
  "Banana prata": [
    { name: "Morango", quantity: "200 g" },
    { name: "Melancia", quantity: "200 g" },
    { name: "Pera", quantity: "1 unidade média ou 116g" },
    { name: "Kiwi", quantity: "1 unidade ou 79g" },
    { name: "Abacaxi", quantity: "100 g" },
    { name: "Uva", quantity: "100 g" },
    { name: "Manga", quantity: "100 g" },
    { name: "Mamão papaia", quantity: "100 g" },
    { name: "Maçã", quantity: "1 unidade média ou 120g" },
    { name: "Tangerina", quantity: "1 unidade média ou 143g" },
  ],
  "Aveia em flocos": [
    { name: "Semente de chia", quantity: "15 g" },
    { name: "Farelo de aveia", quantity: "15 g" },
    { name: "Psyllium", quantity: "15 g" },
    { name: "Granola", quantity: "15 g" },
    { name: "Farinha láctea", quantity: "1 colher de sopa rasa ou 10g" },
  ],
  "Whey protein concentrado": [
    { name: "Whey protein isolado", quantity: "1 medidor ou 30g" },
    { name: "Whey protein hidrolisado", quantity: "1 medidor ou 30g" },
  ],
  "Leite semidesnatado": [
    { name: "Iogurte grego tradicional", quantity: "1 unidade ou 90ml" },
  ],
  "Iogurte natural": [
    { name: "Iogurte grego tradicional", quantity: "1 unidade ou 90g" },
    { name: "Leite semidesnatado", quantity: "200 ml" },
    { name: "Queijo cottage 1%", quantity: "2 fatias ou 74g" },
  ],
  "Arroz branco cozido": [
    { name: "Batata inglesa cozida", quantity: "350 g" },
    { name: "Batata inglesa assada", quantity: "200 g" },
    { name: "Mandioca cozida/assada", quantity: "100 g" },
  ],
  "Feijão preto cozido": [
    { name: "Feijão fradinho cozido", quantity: "100 g" },
    { name: "Feijão vermelho cozido", quantity: "100 g" },
    { name: "Feijão carioca cozido", quantity: "100 g" },
    { name: "Lentilha cozida", quantity: "100 g" },
    { name: "Grão de bico cozido", quantity: "100 g" },
  ],
  "Filé de frango grelhado": [
    { name: "Filé de peixe grelhado/assado", quantity: "150 g" },
    { name: "Maminha grelhada/assada", quantity: "150 g" },
    { name: "Filé mignon grelhado/assado", quantity: "150 g" },
    { name: "Patinho grelhado/assado", quantity: "150 g" },
    { name: "Camarão sem casca cozido", quantity: "150 g" },
    { name: "Filé de salmão assado/grelhado", quantity: "150 g" },
    { name: "Coxão mole sem gordura", quantity: "150 g" },
    { name: "Lagarto", quantity: "150 g" },
    { name: "Músculo", quantity: "150 g" },
    { name: "Alcatra sem gordura", quantity: "150 g" },
    { name: "Sobrecoxa de frango assada", quantity: "150 g" },
    { name: "Tilápia cozida", quantity: "150 g" },
  ],
  "Brócolis": [
    { name: "Couve-flor cozida", quantity: "100 g" },
    { name: "Espinafre cozido", quantity: "100 g" },
    { name: "Couve", quantity: "100 g" },
    { name: "Abobrinha italiana", quantity: "100 g" },
    { name: "Cenoura cozida", quantity: "100 g" },
    { name: "Quiabo cozido", quantity: "100 g" },
    { name: "Beterraba cozida", quantity: "100 g" },
    { name: "Berinjela cozida", quantity: "À vontade" },
    { name: "Vagem cozida", quantity: "100 g" },
    { name: "Repolho branco cozido", quantity: "100 g" },
  ],
  "Macarrão cozido": [
    { name: "Nhoque cozido", quantity: "150 g" },
    { name: "Batata inglesa cozida", quantity: "400 g" },
    { name: "Batata doce cozida", quantity: "200 g" },
  ],
  "Pão de hambúrguer": [
    { name: "Pão francês", quantity: "1 unidade ou 50g" },
    { name: "Pão de forma", quantity: "2 fatias ou 50g" },
    { name: "Rap10 original", quantity: "1 unidade ou 40g" },
    { name: "Pão integral", quantity: "2 fatias ou 50g" },
  ],
  "Patinho grelhado/assado": [
    { name: "Coxão mole sem gordura", quantity: "150 g" },
    { name: "Peito de frango", quantity: "150 g" },
    { name: "Maminha grelhada", quantity: "150 g" },
  ],
  "Patinho grelhado com molho de tomate": [
    { name: "Coxão mole sem gordura", quantity: "150 g" },
    { name: "Peito de frango", quantity: "150 g" },
    { name: "Maminha grelhada", quantity: "150 g" },
  ],
  "Queijo muçarela": [
    { name: "Cream cheese light", quantity: "30 g" },
    { name: "Requeijão light", quantity: "30 g" },
  ],
};
