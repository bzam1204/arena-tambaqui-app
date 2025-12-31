task
<task>

convidados de jogador
</task>

<techspec>


# Inscrição de Convidados em Partidas

## 1. Problema / Oportunidade
Atualmente, um jogador da plataforma não pode inscrever amigos ou familiares que não possuem conta no aplicativo para participar de uma partida. O processo para levar um convidado é manual e informal (via WhatsApp com o dono do campo), o que gera desorganização no controle de presença, no pagamento e no aluguel de equipamentos.

Esta funcionalidade cria a oportunidade de formalizar e simplificar a inclusão de jogadores casuais, centralizando a gestão e o pagamento, e aumentando a previsibilidade para os donos de campo.

## 2. Objetivo (resultado mensurável)
Facilitar a inclusão de jogadores casuais nas partidas, permitindo que um jogador existente se torne responsável pela inscrição e pagamento de um ou mais convidados.

O sucesso será medido por:
- **Adoção:** Número de convidados inscritos através da nova funcionalidade nas primeiras 4 semanas.
- **Eficiência Operacional:** Feedback positivo de pelo menos 2 donos de campo sobre a redução do trabalho manual para gerenciar participantes externos.
- **Aumento de Participação:** Aumento de 5% no número médio de participantes por partida em 90 dias.

## 3. Usuários e Permissões
- **Jogador de Airsoft / Jogador VIP:**
  - Pode adicionar um ou mais convidados ao se inscrever ou após a inscrição.
  - Pode remover convidados que adicionou.
  - É responsável pelo pagamento dos seus convidados.
  - É o "fiador" da reputação de seus convidados.
  - Pode usar o botão para compartilhar os detalhes da partida.

- **Dono de Campo / Arena (Admin):**
  - Pode visualizar os convidados na lista de participantes da partida, identificados com o nome de quem os convidou.
  - Pode clicar em um convidado para ver seus detalhes (nome, idade, aluguel) em um modal.
  - Realiza o check-in do convidado através da lista de chamada existente.

## 4. Jornada / Fluxo do Usuário (MVP)
Descreve o fluxo para um jogador que deseja adicionar um convidado.

**Fluxo Principal:**
1. O jogador acessa a tela de uma partida e inicia o processo de inscrição (ou clica em "Adicionar Convidado" se já estiver inscrito).
2. O sistema apresenta a opção "Adicionar Convidado".
3. Ao clicar, um formulário simples solicita: **Nome Completo**, **Idade** e um seletor **"Vai alugar equipamento?"**.
4. Se a idade informada for menor que 18, um checkbox obrigatório é exibido: **"Confirmo ser o responsável legal e estarei presente"**.
5. O jogador confirma os dados e o convidado é adicionado a um resumo do pedido. O jogador pode repetir o processo para adicionar mais convidados.
6. Na tela de checkout, os custos de cada convidado são discriminados e somados ao valor total do jogador.
7. O jogador realiza um único pagamento via Pix para si e todos os seus convidados.

**Fluxos Alternativos/Exceções:**
- **Remover Convidado:** O jogador pode, a qualquer momento antes da partida, remover um convidado de sua inscrição. O sistema o informa que qualquer reembolso deve ser tratado diretamente com o admin do campo.
- **Adicionar Convidado Posteriormente:** Se o jogador já está inscrito, ele pode voltar à tela da partida e usar o botão "Adicionar Convidado" para iniciar um novo fluxo de adição e pagamento apenas para o novo convidado.
- **Cancelar Inscrição Própria:** O sistema impede que um jogador cancele sua própria inscrição se ele tiver convidados ativos. Uma mensagem o instruirá a remover os convidados primeiro.
- **Compartilhar Detalhes:** O jogador pode clicar no botão "Compartilhar Detalhes da Partida" para gerar um texto formatado para compartilhar via WhatsApp com seu convidado.

## 5. Regras de Negócio
As regras que governam o comportamento da funcionalidade.

- **RN01: A Regra do "Fiador":** O jogador que convida é totalmente responsável pelo comportamento do convidado. Qualquer elogio ou denúncia feita a um convidado durante a avaliação pós-partida será aplicado diretamente ao perfil e à reputação do jogador que o inscreveu.
- **RN02: Lógica de Pagamento:** A regra de negócio existente é aplicada aos convidados: o aluguel de equipamento (R$ 50) isenta a taxa de inscrição (R$ 20). Um convidado paga R$ 20 (inscrição) ou R$ 50 (inscrição + aluguel).
- **RN03: Benefícios VIP:** Benefícios de Jogador VIP (isenção de taxa, descontos) não se estendem aos seus convidados. Convidados sempre pagam o valor cheio.
- **RN04: Regra de Cancelamento:** Um jogador não pode cancelar sua própria inscrição em uma partida enquanto tiver convidados ativos vinculados a ele. Ele deve remover todos os convidados primeiro.
- **RN05: Dados Efêmeros:** Os dados do convidado (nome, idade) são temporários, usados apenas para a partida em questão, e não criam uma conta ou perfil permanente na plataforma.
- **RN06: Responsabilidade de Menores:** Se um convidado for menor de 18 anos, o jogador que o inscreve deve obrigatoriamente marcar um checkbox confirmando ser o responsável legal e que estará presente.
- **RN07: Visibilidade:** Todos os jogadores inscritos na partida podem ver o nome dos convidados na lista de participantes, mas apenas o Admin pode visualizar os detalhes (idade, aluguel) no modal.
- **RN08: Sem Limites:** Não há um limite técnico imposto pela plataforma para o número de convidados que um jogador pode levar.

## 6. Requisitos Funcionais (checklist)
Lista de funcionalidades que devem ser implementadas.

- [ ] **RF01:** Permitir que um jogador adicione um ou mais convidados durante sua inscrição.
- [ ] **RF02:** Permitir que um jogador já inscrito adicione novos convidados a qualquer momento.
- [ ] **RF03:** Implementar o formulário de dados do convidado (Nome Completo, Idade, Aluguel de equipamento).
- [ ] **RF04:** Implementar a lógica de exibição do checkbox obrigatório para convidados menores de idade.
- [ ] **RF05:** Atualizar o sistema de checkout para calcular e discriminar os custos dos convidados, aplicando a regra de isenção de inscrição por aluguel.
- [ ] **RF06:** Permitir que o jogador remova um convidado de sua inscrição.
- [ ] **RF07:** Implementar a regra de bloqueio que impede um jogador de cancelar sua própria inscrição se tiver convidados ativos.
- [ ] **RF08:** Exibir os convidados na lista de participantes (visão do jogador e do admin) com a identificação "(Convidado de [Nome do Jogador])".
- [ ] **RF09:** Criar um modal (visível apenas para o Admin) que exibe os detalhes de um convidado ao ser clicado.
- [ ] **RF10:** Incluir os convidados na lista de avaliação pós-partida, garantindo que denúncias/elogios a eles sejam atribuídos ao jogador responsável.
- [ ] **RF11:** Implementar um botão "Compartilhar Detalhes da Partida" que gere um texto formatado com informações do evento.

## 7. Requisitos Não Funcionais (MVP)
Requisitos de qualidade e restrições técnicas.

- **RNF01: Privacidade (LGPD):** Os dados dos convidados devem ser tratados como informações sensíveis, armazenados de forma segura e utilizados exclusivamente para os fins da partida, sendo descartados ou anonimizados após o evento.
- **RNF02: Usabilidade:** O fluxo de adicionar e gerenciar convidados deve ser intuitivo e integrado de forma fluida à jornada de inscrição existente, seguindo o padrão mobile-first.
- **RNF03: Performance:** A adição de convidados e o recálculo do checkout devem ocorrer de forma rápida, sem impactar a performance da aplicação.

## 8. Fora de Escopo (por agora)
O que NÃO será feito nesta versão para manter o foco.

- Reembolsos automáticos via plataforma em caso de remoção de convidado.
- Integração com sistema de inventário para controle de equipamentos de aluguel.
- Criação de qualquer tipo de perfil, conta ou histórico para o convidado.
- Possibilidade de um convidado se converter em um usuário da plataforma a partir do convite.

## 9. Perguntas em Aberto
Nenhuma

## 10. Critérios de Aceite (Given/When/Then)
Cenários para validação da funcionalidade.

**Cenário 1:** Jogador VIP adiciona dois convidados, um com aluguel e outro sem
- **Dado que** eu sou um Jogador VIP logado e inscrito em uma partida.
- **Quando** eu clico em "Adicionar Convidado", preencho os dados para "Convidado A" sem aluguel, e em seguida adiciono "Convidado B" com aluguel.
- **Então** a tela de checkout deve exibir um total de R$ 70,00, discriminado como: "Inscrição (VIP): R$ 0,00", "Convidado A: R$ 20,00" e "Convidado B (com aluguel): R$ 50,00".

**Cenário 2:** Jogador tenta cancelar sua própria inscrição tendo um convidado ativo
- **Dado que** eu sou um jogador inscrito em uma partida e adicionei pelo menos um convidado.
- **Quando** eu tento cancelar minha própria inscrição na partida.
- **Então** o sistema deve exibir uma mensagem de erro informando que eu preciso remover meus convidados primeiro antes de poder cancelar minha participação.

**Cenário 3:** Um jogador denuncia o convidado de outro jogador após a partida
- **Dado que** o "Jogador A" e o "Convidado de Jogador B" participaram da mesma partida.
- **Quando** o "Jogador A", na tela de avaliação pós-partida, seleciona "Convidado de Jogador B" e registra uma denúncia.
- **Então** a penalidade de reputação (+5 denúncias) deve ser aplicada ao perfil do "Jogador B".

**Cenário 4:** Admin visualiza os detalhes de um convidado menor de idade
- **Dado que** um jogador inscreveu um convidado de 17 anos que irá alugar equipamento.
- **Quando** o Admin acessa a lista de chamada da partida e clica no nome do convidado.
- **Então** um modal deve ser exibido com as informações: "Nome: [Nome do Convidado]", "Idade: 17", "Aluguel: Sim", "Responsável: [Nome do Jogador que convidou]".

## 11. Riscos e Dependências
Fatores que podem impactar a entrega ou o sucesso da funcionalidade.

**Riscos:**
- **Atrito por Reembolso Manual:** O processo manual de reembolso pode gerar insatisfação e sobrecarga operacional para o admin do campo.
- **Abuso da Regra do "Fiador":** Jogadores podem não se importar em receber penalidades de reputação por convidados com mau comportamento, enfraquecendo o sistema.

**Dependências:**
- **Módulo de Partidas:** A funcionalidade depende da estrutura existente de criação e gestão de partidas.
- **Módulo de Pagamentos (Pix):** O fluxo depende da integração com o checkout de Pix atual.
- **Módulo de Reputação:** A regra do "fiador" depende do sistema de denúncias e elogios pós-partida.

</techspec>

<critical>

- follow strictly your task
- follow the @.rules/project.md
- follow the @.rules/react.md

</critical>

