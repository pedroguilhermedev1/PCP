import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Faltam credenciais do Supabase.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const mockData = [
    { cd: 'JDI', codigo: '300001310000', item: 'CAIXA EMB PAPELAO CV 340X430X70MM - AMPLIADOS', unidade: 'UN', lead_time: '', estoque_minimo: 1000, estoque_real: 0, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: '300001010000', item: 'CAIXA EMB PAPELAO TF 285X215X280 - DEMAIS PROFESSOR', unidade: 'UN', lead_time: '', estoque_minimo: 1000, estoque_real: 0, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: '300001070000', item: 'CAIXA EMB PAPELAO TF 290X250X150 - CAPAS', unidade: 'UN', lead_time: '', estoque_minimo: 1000, estoque_real: 0, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: '300001020000', item: 'CAIXA EMB PAPELAO TF 290X250X280 - DEMAIS ALUNO', unidade: 'UN', lead_time: '', estoque_minimo: 1000, estoque_real: 0, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: '300001030000', item: 'CAIXA EMB PAPELAO TF 290X280X280 - ESPIRAL MAIOR', unidade: 'UN', lead_time: '', estoque_minimo: 1000, estoque_real: 0, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: '300001040000', item: 'CAIXA EMB PAPELAO TF 345X290X280 - MALETAS', unidade: 'UN', lead_time: '', estoque_minimo: 1000, estoque_real: 0, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC049UC0020', item: 'BOBINA FILME STRETCH 50CM C/3,5KG', unidade: 'UN', lead_time: '', estoque_minimo: 50, estoque_real: -49, status: 'CRÍTICO', categoria: 'STRETCH' },
    { cd: 'JDI', codigo: 'MCC045UC0203', item: 'BOBINA SHRINK 400X11X1800 METROS', unidade: 'UN', lead_time: '', estoque_minimo: 5, estoque_real: 35, status: 'OK', categoria: 'SHIRINK' },
    { cd: 'JDI', codigo: 'MCC015UC0007', item: 'SAE - CAIXA DE PAPELAO SAE EXT/EM - 295X265X280 - PRETA', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 0, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UCDB0B', item: 'CAIXA LIVROS PADRAO 295X255X70', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 10506, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UCDB0C', item: 'CAIXA SUPLEMENTOS 375X285X70', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 28460, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC046C00003', item: 'ETIQUETA 70MM AVALIAÇÃO', unidade: 'ROLO', lead_time: '', estoque_minimo: 5, estoque_real: 4, status: 'CRÍTICO', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0138', item: 'ETIQUETA 70MM COORDENACAO', unidade: 'ROLO', lead_time: '', estoque_minimo: 5, estoque_real: 12, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC015UCDB04', item: 'SAE - CAIXA DE PAPELAO DB ED INF - 375X290X100 - AZUL', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 1065, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UCDB03', item: 'SAE - CAIXA DE PAPELAO DB ED INF 375X290X170 PRETA', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 2766, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UCDB07', item: 'SAE - CAIXA DE PAPELAO DB EXT/EM - 295X265X280 - PRETA', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 9785, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UCDB06', item: 'SAE - CAIXA DE PAPELAO DB GERAL 295X265X120 AZUL', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 1602, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UC0004', item: 'SAE - CAIXA DE PAPELAO SAE ED INF - 375X290X100 - AZUL', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 20766, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UC0003', item: 'SAE - CAIXA DE PAPELAO SAE ED INF 375X290X170 PRETA', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 8303, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UC0002', item: 'SAE - CAIXA DE PAPELAO SAE ED INF 430X330X100 AZUL', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 926, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UC0001', item: 'SAE - CAIXA DE PAPELAO SAE ED INF 430X330X170 PRETA', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 720, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC015UC0006', item: 'SAE - CAIXA DE PAPELAO SAE GERAL 295X265X120 AZUL', unidade: 'UN', lead_time: '', estoque_minimo: 0, estoque_real: 6030, status: 'CRÍTICO', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC042UC0137', item: 'ETIQUETA 70MM PROFESSOR', unidade: 'ROLO', lead_time: '', estoque_minimo: 5, estoque_real: 0, status: 'CRÍTICO', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0051', item: 'ETIQUETA ADESIVA COUCHE 100X50 LPN SAE', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 22, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0130', item: 'ETIQUETA ADESIVA COUCHE AZUL - 105X150MM', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 33, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0128', item: 'ETIQUETA ADESIVA COUCHE BRANCA - 105X150MM', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 65, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC046C00004', item: 'ETIQUETA ADESIVA COUCHE BRANCA - 50X20MM KIT', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 20, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0141', item: 'ETIQUETA ADESIVA COUCHE BRANCA 100X100', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 11, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC045000024', item: 'ETIQUETA ADESIVA COUCHE BRANCA SEQUENCIAL LPN 100X', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 110, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0135', item: 'ETIQUETA ADESIVA COUCHE CINZA 100X150X1', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 4, status: 'CRÍTICO', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0132', item: 'ETIQUETA ADESIVA COUCHE LARANJA 105X150MM', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 51, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC046UC0597', item: 'ETIQUETA ADESIVA COUCHE ROSA - 105X150MM', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 21, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0134', item: 'ETIQUETA ADESIVA COUCHE ROXO - 105X150MM', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 0, status: 'CRÍTICO', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0136', item: 'ETIQUETA ADESIVA COUCHE VERDE - 105X150MM', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 12, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0133', item: 'ETIQUETA ADESIVA COUCHE VERMELHA - 105X150MM', unidade: 'ROLO', lead_time: '', estoque_minimo: 10, estoque_real: 60, status: 'OK', categoria: 'ETIQUETA' },
    { cd: 'JDI', codigo: 'MCC042UC0127', item: 'FITA ADESIVA TRANSPARENTE 70MMX100M', unidade: 'ROLO', lead_time: '', estoque_minimo: 50, estoque_real: 234, status: 'OK', categoria: 'FITA ADESIVA' },
    { cd: 'JDI', codigo: 'MCC042UC0089', item: 'PAPEL SULFITE A4 75G 210X295 - 500 FLS - AMARELO', unidade: 'RESMA', lead_time: '', estoque_minimo: 30, estoque_real: 150, status: 'OK', categoria: 'PAPEL OFFICE' },
    { cd: 'JDI', codigo: 'MCC042UC0148', item: 'PAPEL SULFITE A4 75G 210X295 - 500 FLS - AZUL', unidade: 'RESMA', lead_time: '', estoque_minimo: 30, estoque_real: 61, status: 'OK', categoria: 'PAPEL OFFICE' },
    { cd: 'JDI', codigo: 'MCC042UC0142', item: 'PAPEL SULFITE A4 75G 210X295 - 500 FLS - BRANCO', unidade: 'RESMA', lead_time: '', estoque_minimo: 50, estoque_real: 56, status: 'OK', categoria: 'PAPEL OFFICE' },
    { cd: 'JDI', codigo: 'MCC042UC0143', item: 'PAPEL SULFITE A4 75G 210X295 - 500 FLS - ROSA', unidade: 'RESMA', lead_time: '', estoque_minimo: 30, estoque_real: 78, status: 'OK', categoria: 'PAPEL OFFICE' },
    { cd: 'JDI', codigo: 'MCC042UC0144', item: 'PAPEL SULFITE A4 75G 210X295 - 500 FLS - VERDE', unidade: 'RESMA', lead_time: '', estoque_minimo: 30, estoque_real: 54, status: 'OK', categoria: 'PAPEL OFFICE' },
    { cd: 'JDI', codigo: 'MCC045UC0193', item: 'RIBBON CERA PRETO 110MMX300M', unidade: 'UN', lead_time: '', estoque_minimo: 30, estoque_real: 115, status: 'OK', categoria: 'CAIXA' },
    { cd: 'JDI', codigo: 'MCC045UC0208', item: 'SAE - FITA ADESIVA TRANSPARENTE 48MMX100M HT LOGO SAE', unidade: 'ROLO', lead_time: '', estoque_minimo: 100, estoque_real: 261, status: 'OK', categoria: 'FITA ADESIVA' },
    { cd: 'JDI', codigo: 'MCC015UC0045', item: 'SAS - FITA ADESIVA TRANSPARENTE 70MMX100M HT LOGO SAS', unidade: 'ROLO', lead_time: '', estoque_minimo: 100, estoque_real: 1078, status: 'OK', categoria: 'FITA ADESIVA' }
  ];

  try {
    const { data, error } = await supabase.from('estoque_insumos').insert(mockData);

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({ error: 'A tabela "estoque_insumos" ainda não foi criada no Supabase.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: mockData.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
