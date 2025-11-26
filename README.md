# Racha Conta (Split Bill App)

Aplicativo em React Native/Expo para dividir contas entre amigos. Ele oferece um fluxo rápido para divisão igualitária e outro fluxo detalhado, com registro local das contas para você consultar e editar depois.

## Funcionalidades
- Divisão simples: informe valor total, número de pessoas e taxa de serviço para ver o valor por pessoa.
- Divisão detalhada: cadastre pessoas, itens com quem pagou, distribua cada item igualmente ou por quantidade e escolha se a taxa de serviço será dividida de forma igual ou proporcional ao consumo.
- Histórico offline: contas ficam gravadas no AsyncStorage (limite de 20 entradas) para consultar, editar ou excluir.
- Salvamento automático: divisões detalhadas são salvas conforme você calcula o resultado; títulos e notas também ficam persistidos.
- Resumo claro: cards com totais, detalhamento por pessoa e indicação de gorjeta.

## Como usar
1) Divisão simples  
   - Preencha valor total, número de pessoas e taxa de serviço.  
   - Toque em **Calcular** para ver o valor por pessoa e salvar no histórico.

2) Divisão detalhada  
   - Adicione pessoas.  
   - Inclua itens informando preço (total ou unitário), quantidade e quem pagou.  
   - Distribua cada item entre as pessoas (igual ou por quantidade) e escolha o modo de divisão da taxa.  
   - Veja o resultado em tempo real e abra o detalhamento completo quando quiser salvar a conta.

3) Histórico  
   - A aba Início lista contas salvas; dá para consultar, editar ou excluir.  
   - Ao editar, os dados são carregados no fluxo correspondente (simples ou detalhado).

## Rodando localmente
- Requisitos: Node 18+, npm e um emulador ou dispositivo com o app Expo Go.  
- Instale dependências: `npm install`  
- Inicie o projeto: `npm start` (ou `npm run android` / `npm run ios` / `npm run web`)  
- No Metro, escolha a plataforma ou escaneie o QR code com o Expo Go.

## Stack principal
- Expo 54 + React Native 0.81
- React Navigation (tabs e stacks)
- AsyncStorage para persistência local
- TypeScript

## Estrutura (resumo)
- `src/screens`: telas de divisão simples, detalhada, resultados e histórico.
- `src/context`: `BillContext` com estado da conta e cálculos.
- `src/services`: serviços de cálculo e armazenamento.
- `src/components`: botões, cards, inputs e demais UI compartilhada.
