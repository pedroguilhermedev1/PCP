const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldMotivos = "const MOTIVOS_OCORRENCIA = ['Falta de Anexo', 'Divergência de Valor', 'Dados Incorretos', 'Falta de Aprovação', 'Erro no Lançamento', 'Outros'];";
const newMotivos = "const MOTIVOS_OCORRENCIA = [\n  'Inserir informações faltantes',\n  'Solicitar correção de informações',\n  'Anexar documentos para pagamento',\n  'Validar informações do processo',\n  'Acompanhar aprovação',\n  'Aguardar retorno de outra área',\n  'Aguardar retorno do fornecedor',\n  'Tratar divergência no processo'\n];";

content = content.replace(oldMotivos, newMotivos);

fs.writeFileSync(path, content, 'utf8');
console.log('Motivos atualizados com sucesso!');
