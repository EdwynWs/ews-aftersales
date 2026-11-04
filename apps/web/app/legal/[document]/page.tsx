import { notFound } from "next/navigation";
import { Nav, Footer } from "@/components/marketing";
const docs: Record<string, { title: string; sections: [string, string][] }> = {
  termos: {
    title: "Termos de uso",
    sections: [
      [
        "Sobre este ambiente",
        "Esta versão de desenvolvimento apresenta a fundação do EWS AfterSales. Não constitui oferta comercial definitiva. Os módulos operacionais da fase P1 ainda não estão implementados. Somente dados de teste devem ser utilizados no sandbox.",
      ],
      [
        "Uso da plataforma",
        "O fabricante gerencia sua equipe, conteúdo autorizado, políticas de atendimento, preços e condições de peças. A EWS fornece a plataforma e não realiza a venda física de equipamentos ou peças em nome do fabricante.",
      ],
      [
        "Credenciais e acesso",
        "Cada usuário deve proteger seu acesso. O cadastro de uma empresa não autoriza acesso aos dados de outras organizações. O QR, previsto para a fase operacional, não comprova propriedade.",
      ],
      [
        "Responsabilidades e limites",
        "A plataforma não substitui instruções técnicas, análise de garantia, profissionais habilitados ou sistemas industriais de controle. Disponibilidade, suporte, SLA, propriedade intelectual e condições contratuais precisam ser definidos antes do lançamento.",
      ],
    ],
  },
  privacidade: {
    title: "Política de privacidade",
    sections: [
      [
        "Dados previstos",
        "Cadastro do responsável, e-mail, nome empresarial, CNPJ, telefone, sessões, registros de acesso, contratação e histórico de pagamentos. O sistema não armazena dados completos de cartão. Utilize apenas dados fictícios neste ambiente de testes.",
      ],
      [
        "Finalidades e prestadores",
        "Os dados sustentam autenticação, acesso por organização, cobrança da assinatura, suporte e auditoria. Os prestadores de infraestrutura, e-mail e pagamentos devem ser identificados na versão contratual final. A integração financeira desta versão usa exclusivamente o sandbox Asaas.",
      ],
      [
        "Responsabilidades",
        "A EWS deverá definir seu papel para cada finalidade. O fabricante deverá definir suas responsabilidades sobre dados de clientes, documentos e atendimento. Não existe uma classificação única de controlador ou operador que substitua a análise de cada operação.",
      ],
      [
        "Retenção e direitos",
        "Os dados não são apagados automaticamente por inadimplência. Prazos de retenção, exclusão, canal de atendimento aos titulares, identidade do responsável e processo de incidentes precisam de revisão antes do lançamento. Usuários autenticados podem registrar uma solicitação de privacidade em Configurações.",
      ],
    ],
  },
  contratacao: {
    title: "Contratação e cancelamento",
    sections: [
      [
        "Dois valores, apresentados antes do pagamento",
        "O plano possui mensalidade e implantação única. A tela de contratação discrimina os dois valores e o total inicial. Os preços apresentados no fluxo são persistidos com o contrato; alterações posteriores na tabela pública não mudam silenciosamente o que foi acordado.",
      ],
      [
        "Ativação e recorrência",
        "A liberação inicial exige confirmação de implantação e primeira mensalidade pelo provedor. Pix e boleto nesta integração exigem pagamento manual em cada período. O redirecionamento para uma página de sucesso não comprova pagamento. Cartão e Pix Automático ainda não fazem parte da integração entregue.",
      ],
      [
        "Pagamento parcial e regularização",
        "Quando apenas uma obrigação inicial é paga, a conta permanece parcial. A plataforma preserva os dados em caso de atraso. O prazo de regularização é configurável e aparece na área da assinatura. Solicitações de reembolso precisam ser analisadas segundo as condições contratuais e normas aplicáveis; este texto não impõe renúncia a direitos.",
      ],
      [
        "Cancelamento e mudança de plano",
        "O administrador solicita cancelamento no painel. A recorrência é encerrada pelo worker no provedor e o acesso segue até o fim do período pago, quando aplicável. A solicitação e a confirmação são registradas. Alterações de plano após o checkout exigem análise comercial, sem cobrança adicional automática. Enterprise depende de proposta aprovada.",
      ],
      [
        "Condições pendentes",
        "Antes de aceitar contratos reais, preencher identidade e contato da EWS, escopo de implantação, suporte, SLA, políticas de reembolso, retenção e emissão fiscal. Obter revisão jurídica e autorização expressa para lançamento.",
      ],
    ],
  },
};
export default async function Legal({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  const doc = docs[document];
  if (!doc) notFound();
  return (
    <>
      <Nav />
      <main id="main" className="container section legal">
        <span className="eyebrow">TRANSPARÊNCIA · VERSÃO 2026-10-DRAFT</span>
        <h1>{doc.title}</h1>
        <div className="warning-label">
          Minuta técnica pendente de revisão jurídica. Não liberada para
          contratação em produção.
        </div>
        {doc.sections.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
