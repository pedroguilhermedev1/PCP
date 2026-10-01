# Atualizações Futuras - PCP Hub (Continuação)

Este documento lista as pendências e próximos passos para concluir integralmente o Plano de Atualização Estrutural (Fases 2, 3 e 4), conforme alinhado nos últimos testes.

## 1. Replicação do Visual para Modais de Leitura (Fim da Fase 2 e 3)
A nova estrutura de Data Início/Fim e o motor visual de Ocorrências (T1.1, T3.1, etc.) foram implementados com sucesso na modal principal de edição (`FaturaSAPModal.tsx`). Para concluir esta etapa:
- [ ] **`FaturaDetailsModal.tsx`**: Atualizar o layout para espelhar a estrutura de blocos e ocorrências, garantindo que usuários com permissão apenas de leitura (ou ao visualizar faturas na tabela) enxerguem as informações no novo formato.
- [ ] **`FaturaModal.tsx`**: (Se ainda em uso para outros fluxos) Garantir que esteja alinhado com o layout de blocos de `FaturaSAPModal`.

## 2. Ajuste de Banco de Dados (Supabase)
Adicionamos o array de `ocorrencias` na interface TypeScript `Fatura` para a rastreabilidade perfeita.
- [ ] **Coluna no Banco**: É necessário garantir que a tabela `faturas` no Supabase possua a coluna `ocorrencias` (tipo `JSONB`) ou estrutura similar para conseguir salvar as idas e vindas de cada T sem erro na API.

## 3. Fase 4: Histórico e Auditoria Completa
Atualmente, as ocorrências são visíveis dentro dos blocos, mas o plano exige um histórico detalhado.
- [ ] **Aba "Histórico"**: Atualizar a aba de histórico para mostrar claramente cada ciclo isoladamente (novo início = novo ciclo).
- [ ] Exibir de forma clara nos logs se o passo foi avaliado pela Janela do Documento ou pelo SLA padrão, evidenciando quando o SLA foi zerado após um retorno (ex: T1.1).

## 4. Testes Finais e Refinamento
- [ ] Bloqueio de Ocorrência em Faturas Pagas: Garantir que a lógica que oculta o botão de ocorrências em faturas finalizadas seja consistente em todos os fluxos.
- [ ] Teste end-to-end gravando uma nova Fatura, enviando uma ocorrência para outro T e finalizando.
