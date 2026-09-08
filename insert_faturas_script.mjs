import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

const faturas = [
  {
    fornecedor: "Cartosul Fabricação de Artefatos de Papelão LTDA",
    cnpj: "04.568.551/0001-07",
    valor: 22000.00,
    rc_sap: "33409",
    nexa_chamado: "216855",
    cd: "PSD",
    marca: "",
  },
  {
    fornecedor: "Contabilista Suprimentos para Escritório S.A.",
    cnpj: "77.765.840/0001-70",
    valor: 3664.00,
    rc_sap: "33411",
    nexa_chamado: "216841",
    cd: "PSD",
    marca: "",
  },
  {
    fornecedor: "Master Filme Embalag",
    cnpj: "09.590.768/0001-37",
    valor: 13200.00,
    rc_sap: "33407",
    pedido_sap: "52249",
    nexa_chamado: "214817",
    cd: "PSD",
    marca: "",
  }
];

async function run() {
  for (const fatura of faturas) {
    // Verifica fornecedor
    const { data: fornData } = await supabase.from('fornecedores').select('*').eq('cnpj', fatura.cnpj).single();
    if (!fornData) {
      await supabase.from('fornecedores').insert({
        tipo: 'Material',
        cnpj: fatura.cnpj,
        razao_social: fatura.fornecedor,
        nome_fantasia: fatura.fornecedor
      });
      console.log(`Fornecedor ${fatura.fornecedor} inserido.`);
    }

    // Insere fatura
    const id = crypto.randomUUID() + '__CAT__Material';
    const { error } = await supabase.from('faturas').insert({
      id,
      ...fatura,
      insumos: [{ _meta: true, cd: fatura.cd }]
    });

    if (error) {
      console.error("Erro ao inserir fatura:", error);
    } else {
      console.log(`Fatura ${fatura.fornecedor} inserida com sucesso.`);
    }
  }
}

run();
