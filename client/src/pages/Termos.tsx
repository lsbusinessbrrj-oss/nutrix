import { Link } from "wouter";

const ATUALIZACAO = "29/08/2026";

function Secao({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-bold text-gray-900 mb-2">{n}. {titulo}</h2>
      <div className="text-sm text-gray-600 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

export default function Termos() {
  return (
    <div className="min-h-screen" style={{ background: "#F7F8F7" }}>
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-lg" style={{ color: "#166534" }}>Nutri<span style={{ color: "#E53935" }}>X</span></Link>
          <Link href="/signup" className="text-sm font-semibold" style={{ color: "#43A047" }}>Voltar</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-black text-gray-900">Termos de Uso e Política de Privacidade</h1>
        <p className="text-xs text-gray-400 mb-6">Última atualização: {ATUALIZACAO}</p>

        <Secao n="1" titulo="Aceitação">
          <p>Ao criar uma conta, marcar a caixa de aceite e usar o NutriX, você declara que leu, entendeu e concorda com estes Termos e com a Política de Privacidade. Se não concordar, não utilize o aplicativo.</p>
        </Secao>

        <Secao n="2" titulo="O que é o NutriX">
          <p>O NutriX é uma ferramenta digital que gera <strong>planos alimentares e de treino de caráter educativo</strong>, calculados automaticamente a partir das informações que você fornece (peso, altura, idade, sexo, objetivo, preferências e restrições).</p>
          <p><strong>O NutriX não é uma consulta médica ou nutricional</strong> e não substitui o acompanhamento de um profissional de saúde habilitado.</p>
        </Secao>

        <Secao n="3" titulo="Cadastro e conta">
          <p>Você é responsável por fornecer informações verdadeiras e por manter a confidencialidade da sua senha. O uso da conta é pessoal e intransferível. Informações incorretas podem gerar um plano inadequado.</p>
        </Secao>

        <Secao n="4" titulo="Assinatura, preço e cobrança">
          <p>O acesso é oferecido por <strong>assinatura mensal recorrente</strong> no valor vigente informado no checkout (atualmente R$ 9,99/mês). Ao cadastrar um cartão, você autoriza a <strong>cobrança automática mensal</strong> até que a assinatura seja cancelada.</p>
          <p>Os pagamentos são processados pela <strong>Mercado Pago</strong>. O NutriX não armazena os dados completos do seu cartão.</p>
        </Secao>

        <Secao n="5" titulo="Cancelamento e reembolso">
          <p>Você pode <strong>cancelar a assinatura a qualquer momento</strong> pela própria conta (Perfil → final da página) ou pelo suporte. Após o cancelamento, não haverá novas cobranças; o acesso permanece até o fim do período já pago.</p>
          <p>Nos termos do art. 49 do Código de Defesa do Consumidor, você tem <strong>7 dias</strong> a partir da contratação para desistir e solicitar reembolso do valor da primeira cobrança.</p>
          <p>Você também pode <strong>excluir sua conta</strong> a qualquer momento — isso cancela a assinatura e apaga seus dados (ver item 8).</p>
        </Secao>

        <Secao n="6" titulo="Comunicações por e-mail e WhatsApp">
          <p>Ao se cadastrar, você <strong>autoriza expressamente</strong> o NutriX a lhe enviar, pelo e-mail e pelo número de WhatsApp informados: o seu plano alimentar, confirmações de assinatura e pagamento, avisos importantes sobre o serviço e comunicações relacionadas.</p>
          <p>Essas mensagens fazem parte da prestação do serviço. Você pode solicitar a interrupção de comunicações promocionais a qualquer momento pelo suporte.</p>
        </Secao>

        <Secao n="7" titulo="Privacidade e proteção de dados (LGPD)">
          <p>Tratamos seus dados conforme a Lei nº 13.709/2018 (LGPD). Coletamos: nome, e-mail, WhatsApp e dados corporais (peso, altura, idade, objetivo, preferências), com a finalidade de gerar e entregar o seu plano e gerenciar a assinatura.</p>
          <p>Não vendemos seus dados. Compartilhamos apenas o necessário com provedores que operam o serviço (ex.: processador de pagamento e provedores de e-mail/mensagens).</p>
          <p>Você pode, a qualquer tempo, solicitar acesso, correção ou <strong>exclusão dos seus dados</strong> (direito ao esquecimento), pela conta ou pelo suporte.</p>
        </Secao>

        <Secao n="8" titulo="Exclusão da conta">
          <p>No Perfil, ao final da página, há a opção de <strong>excluir a conta</strong>. Essa ação <strong>cancela a assinatura e apaga permanentemente</strong> seus dados e planos, e não pode ser desfeita.</p>
        </Secao>

        <Secao n="9" titulo="Aviso de saúde">
          <p>O conteúdo é educativo e genérico. <strong>Consulte um médico ou nutricionista</strong> antes de iniciar qualquer dieta, especialmente em caso de gestação, amamentação, doenças, uso de medicamentos, transtornos alimentares, ou para crianças e adolescentes. O NutriX não se responsabiliza por decisões tomadas sem orientação profissional.</p>
        </Secao>

        <Secao n="10" titulo="Propriedade intelectual">
          <p>A marca, o conteúdo e os planos gerados pertencem ao NutriX. É proibida a reprodução, revenda ou redistribuição sem autorização.</p>
        </Secao>

        <Secao n="11" titulo="Limitação de responsabilidade">
          <p>O NutriX se esforça para manter o serviço disponível e correto, mas não garante resultados específicos de emagrecimento ou saúde, que dependem de fatores individuais. A responsabilidade limita-se, no máximo, ao valor pago pelo cliente no período.</p>
        </Secao>

        <Secao n="12" titulo="Alterações destes termos">
          <p>Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas pelo app ou por e-mail. O uso continuado após a atualização significa concordância.</p>
        </Secao>

        <Secao n="13" titulo="Legislação e foro">
          <p>Aplica-se a legislação brasileira. Fica eleito o foro do domicílio do consumidor para dirimir eventuais controvérsias.</p>
        </Secao>

        <Secao n="14" titulo="Contato">
          <p>Dúvidas ou solicitações (incluindo dados e cancelamento): pelo suporte dentro do app.</p>
        </Secao>

        <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-4 mt-6">
          Este documento é um modelo base para o funcionamento do app. Recomenda-se revisão por um advogado antes do lançamento comercial.
        </p>
      </main>
    </div>
  );
}
