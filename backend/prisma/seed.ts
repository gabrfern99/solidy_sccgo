import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Limpando dados existentes...");
  await prisma.auditLog.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.obraCusto.deleteMany();
  await prisma.obraVistoria.deleteMany();
  await prisma.obraStep.deleteMany();
  await prisma.obra.deleteMany();
  await prisma.signatureRequest.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.contractTemplateField.deleteMany();
  await prisma.contractTemplate.deleteMany();
  await prisma.payerCompany.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log("Criando empresa e usuários...");
  const company = await prisma.company.create({
    data: {
      name: "Construtora Solidy LTDA",
      cnpj: "12.345.678/0001-90",
      email: "contato@solidy.com.br",
      phone: "(62) 3333-4444",
    },
  });

  const passwordHash = await bcrypt.hash("123456", 10);
  await prisma.user.createMany({
    data: [
      { companyId: company.id, name: "Administrador", email: "admin@solidy.com.br", password: passwordHash, role: "ADMIN" },
      { companyId: company.id, name: "Gestor de Contratos", email: "gestor@solidy.com.br", password: passwordHash, role: "GESTOR" },
      { companyId: company.id, name: "Operador", email: "operador@solidy.com.br", password: passwordHash, role: "OPERADOR" },
    ],
  });
  const admin = await prisma.user.findFirstOrThrow({ where: { email: "admin@solidy.com.br" } });

  console.log("Criando CNPJs pagadores...");
  const [payer1, payer2] = await Promise.all([
    prisma.payerCompany.create({ data: { companyId: company.id, name: "Construtora Solidy LTDA", cnpj: "12.345.678/0001-90" } }),
    prisma.payerCompany.create({ data: { companyId: company.id, name: "Solidy Incorporações SPE", cnpj: "98.765.432/0001-10" } }),
  ]);

  console.log("Criando templates...");
  const templates = [
    {
      name: "Prestação de Serviço",
      category: "SERVICO" as const,
      description: "Modelo padrão para prestação de serviços.",
      body: "Contrato de prestação de serviços entre {{contratante}} e {{contratado}}, no valor de {{valor}}.",
      fields: [
        { key: "contratante", label: "Contratante", type: "party", required: true, order: 0 },
        { key: "contratado", label: "Contratado", type: "party", required: true, order: 1 },
        { key: "valor", label: "Valor", type: "currency", required: true, order: 2 },
        { key: "endereco", label: "Endereço da prestação", type: "address", required: false, order: 3 },
        { key: "assinatura", label: "Assinatura", type: "signature", required: true, order: 4 },
      ],
    },
    {
      name: "Contrato de Trabalho",
      category: "TRABALHO" as const,
      description: "Modelo CLT padrão.",
      body: "Contrato de trabalho entre {{empregador}} e {{empregado}}, carga horária {{horario}}.",
      fields: [
        { key: "empregador", label: "Empregador", type: "party", required: true, order: 0 },
        { key: "empregado", label: "Empregado", type: "party", required: true, order: 1 },
        { key: "salario", label: "Salário", type: "currency", required: true, order: 2 },
        { key: "horario", label: "Horário de trabalho", type: "time", required: true, order: 3 },
      ],
    },
    {
      name: "Contrato de Obra",
      category: "OBRA" as const,
      description: "Empreitada de obra.",
      body: "Contrato de empreitada de obra no endereço {{endereco}}.",
      fields: [
        { key: "contratante", label: "Contratante", type: "party", required: true, order: 0 },
        { key: "empreiteiro", label: "Empreiteiro", type: "party", required: true, order: 1 },
        { key: "endereco", label: "Endereço da obra", type: "address", required: true, order: 2 },
        { key: "valor", label: "Valor total", type: "currency", required: true, order: 3 },
      ],
    },
    {
      name: "Contrato de Locação",
      category: "LOCACAO" as const,
      description: "Locação de imóvel.",
      body: "Contrato de locação do imóvel {{endereco}} entre locador e locatário.",
      fields: [
        { key: "locador", label: "Locador", type: "party", required: true, order: 0 },
        { key: "locatario", label: "Locatário", type: "party", required: true, order: 1 },
        { key: "endereco", label: "Endereço do imóvel", type: "address", required: true, order: 2 },
        { key: "aluguel", label: "Valor do aluguel", type: "currency", required: true, order: 3 },
      ],
    },
  ];

  const createdTemplates: Record<string, string> = {};
  for (const t of templates) {
    const tpl = await prisma.contractTemplate.create({
      data: {
        companyId: company.id,
        name: t.name,
        category: t.category,
        description: t.description,
        body: t.body,
        fields: { create: t.fields },
      },
    });
    createdTemplates[t.category] = tpl.id;
  }

  console.log("Criando contratos...");
  const locacao = await prisma.contract.create({
    data: {
      companyId: company.id,
      createdById: admin.id,
      templateId: createdTemplates["LOCACAO"],
      title: "Locação Galpão Industrial - Setor Norte",
      category: "LOCACAO",
      status: "ATIVO",
      counterparty: "Imobiliária Horizonte LTDA",
      counterpartyDoc: "11.222.333/0001-44",
      value: new Prisma.Decimal(8500),
      isMonthly: true,
      startDate: daysFromNow(-120),
      endDate: daysFromNow(240),
      signedAt: daysFromNow(-118),
    },
  });

  await prisma.contract.create({
    data: {
      companyId: company.id,
      createdById: admin.id,
      templateId: createdTemplates["SERVICO"],
      title: "Manutenção Predial Mensal",
      category: "SERVICO",
      status: "ATIVO",
      counterparty: "Facilities Pro Serviços",
      counterpartyDoc: "22.333.444/0001-55",
      value: new Prisma.Decimal(3200),
      isMonthly: true,
      startDate: daysFromNow(-60),
      endDate: daysFromNow(20), // vencendo
      signedAt: daysFromNow(-58),
    },
  });

  await prisma.contract.create({
    data: {
      companyId: company.id,
      createdById: admin.id,
      templateId: createdTemplates["TRABALHO"],
      title: "Contrato CLT - Engenheiro Civil",
      category: "TRABALHO",
      status: "RASCUNHO",
      counterparty: "João da Silva",
      counterpartyDoc: "123.456.789-00",
      value: new Prisma.Decimal(12000),
      isMonthly: true,
    },
  });

  const obraContract = await prisma.contract.create({
    data: {
      companyId: company.id,
      createdById: admin.id,
      templateId: createdTemplates["OBRA"],
      title: "Empreitada - Reforma Sede Administrativa",
      category: "OBRA",
      status: "AGUARDANDO_ASSINATURA",
      counterparty: "Construções Alfa ME",
      counterpartyDoc: "33.444.555/0001-66",
      value: new Prisma.Decimal(250000),
      startDate: daysFromNow(-10),
      endDate: daysFromNow(180),
    },
  });

  await prisma.signatureRequest.create({
    data: {
      contractId: obraContract.id,
      channel: "AMBOS",
      status: "AGUARDANDO",
      signerName: "Construções Alfa ME",
      signerEmail: "contato@alfa.com.br",
      signerPhone: "(62) 99999-0000",
      token: "demo-token-obra-001",
      expiresAt: daysFromNow(7),
    },
  });

  console.log("Criando obras...");
  const defaultSteps = [
    { title: "Levantamento e escopo do projeto", phase: "PLANEJAMENTO" as const, status: "CONCLUIDO" as const, order: 0 },
    { title: "Orçamento e cronograma aprovados", phase: "PLANEJAMENTO" as const, status: "CONCLUIDO" as const, order: 1 },
    { title: "Vistoria inicial registrada", phase: "PLANEJAMENTO" as const, status: "CONCLUIDO" as const, order: 2 },
    { title: "Mobilização e canteiro de obras", phase: "EXECUCAO" as const, status: "EM_ANDAMENTO" as const, order: 3 },
    { title: "Execução estrutural / serviços principais", phase: "EXECUCAO" as const, status: "PENDENTE" as const, order: 4 },
    { title: "Acabamentos e instalações", phase: "EXECUCAO" as const, status: "PENDENTE" as const, order: 5 },
    { title: "Vistoria final e checklist de pendências", phase: "ENTREGA" as const, status: "PENDENTE" as const, order: 6 },
    { title: "Entrega e termo de conclusão", phase: "ENTREGA" as const, status: "PENDENTE" as const, order: 7 },
  ];

  const obra = await prisma.obra.create({
    data: {
      companyId: company.id,
      contractId: locacao.id,
      name: "Reforma Galpão Setor Norte",
      description: "Adequação do galpão locado para operação logística.",
      address: "Av. Industrial, 1500 - Setor Norte",
      status: "EM_EXECUCAO",
      budgetPlanned: new Prisma.Decimal(180000),
      startDate: daysFromNow(-30),
      endDate: daysFromNow(90),
      steps: { create: defaultSteps },
      custos: {
        create: [
          { description: "Cimento e agregados", categoria: "MATERIAL", amount: new Prisma.Decimal(22000), date: daysFromNow(-25) },
          { description: "Equipe de pedreiros (quinzena)", categoria: "MAO_DE_OBRA", amount: new Prisma.Decimal(18000), date: daysFromNow(-15) },
          { description: "Locação de betoneira", categoria: "EQUIPAMENTO", amount: new Prisma.Decimal(3500), date: daysFromNow(-10) },
          { description: "Instalação elétrica (terceiro)", categoria: "SERVICO_TERCEIRO", amount: new Prisma.Decimal(12000), date: daysFromNow(-5) },
        ],
      },
      vistorias: {
        create: [
          { tipo: "INICIAL", description: "Galpão com piso danificado e instalação elétrica antiga. Necessária reforma estrutural." },
        ],
      },
    },
  });

  console.log("Criando ordens de compra...");
  await prisma.purchaseOrder.createMany({
    data: [
      { companyId: company.id, obraId: obra.id, payerId: payer1.id, number: "OC-2025-0001", supplier: "Depósito Central de Materiais", description: "Cimento, areia e brita", amount: new Prisma.Decimal(22000), status: "RECEBIDA" },
      { companyId: company.id, obraId: obra.id, payerId: payer2.id, number: "OC-2025-0002", supplier: "ElétricaMax", description: "Cabos e quadros de distribuição", amount: new Prisma.Decimal(12000), status: "APROVADA" },
    ],
  });

  console.log("\nSeed concluído com sucesso!");
  console.log("Login: admin@solidy.com.br | Senha: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
