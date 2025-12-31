task
<task>

Centro de Notificações (MVP In-App)

</task>

<techspec>

# Definição de Ideia — Centro de Notificações (MVP In-App)

## 1) Título

Centro de Notificações (sininho + contador + popup com abas) para elogios/denúncias

## 2) Contexto e problema

No Arena Tambaqui, a reputação do jogador é impactada por transmissões anônimas (elogios/denúncias) vinculadas a partidas reais. Atualmente, o jogador pode não perceber rapidamente esses eventos, pois precisa navegar ativamente pelo app (feed/ranking/perfil). Isso reduz engajamento e enfraquece o feedback imediato sobre comportamento e compromisso.

## 3) Objetivo

Disponibilizar um canal in-app de comunicação de eventos de reputação (elogio/denúncia) que:

* Informe o jogador de forma rápida e consistente
* Permita gerenciar “não lidas” com fluidez (optimistic update)
* Melhore percepção e uso das transmissões pós-partida

### Métricas sugeridas (MVP)

* % de usuários que abrem o sininho ao menos 1x por sessão/semana
* % de notificações marcadas como lidas
* tempo médio entre criação da transmissão e leitura

## 4) Escopo do MVP

### Inclui

* Notificações **in-app** (sem Web Push)
* Eventos: **apenas elogio e denúncia**
* UI: sininho no header + badge + popup scrollável com abas “Não lidas” (default) e “Lidas”
* Clique no item = marca como lida (sem botão)
* “Limpar tudo” (marca todas como lidas; nada é apagado do banco)

### Não inclui (fora de escopo)

* Notificações de navegador (Web Push) / push mobile
* Preferências de notificação (silenciar/categorias/horários)
* Notificações para outros eventos (partida, pagamento, chamada, VIP etc.)
* Regras avançadas de retenção/paginação/histórico detalhado

## 5) Regras de negócio

1. **Transmissões só após partida fechada:** usuário só pode criar elogio/denúncia quando a partida estiver finalizada/fechada.
2. **Gatilho de notificação:** ao criar uma transmissão (elogio/denúncia), cria-se uma notificação para o **jogador alvo**.
3. **Mensagem:**

   * “Você recebeu um elogio na Partida {NOME_DA_PARTIDA}”
   * “Você recebeu uma denúncia na Partida {NOME_DA_PARTIDA}”
4. **Anonimato preservado:** não expor autor e não expor foto real.
5. **Ordenação:** mais recente primeiro em ambas as abas.
6. **Leitura:** clicar no item marca como lida.
7. **Limpar tudo:** marca todas como lidas (persistente); **não deleta** nada.

## 6) UX / UI (comportamento)

* Header exibe sininho com badge numérico de **não lidas**.
* Ao clicar no sininho, abre popup/drawer:

  * Abas: **Não lidas (padrão)** e **Lidas**
  * Lista scrollável
  * Estado vazio por aba (popup permanece aberto)
* **Optimistic update** ao clicar numa notificação não lida:

  * remove imediatamente da aba “Não lidas”
  * decrementa badge imediatamente
  * persiste “lida” no banco
  * em caso de falha, re-sync e feedback (ex.: toast) para consistência

## 7) Requisitos funcionais

* [ ] Sininho no header global
* [ ] Badge = contagem de notificações não lidas
* [ ] Listagem de notificações do usuário com filtro por lidas/não lidas
* [ ] Popup/drawer com abas (“Não lidas” default / “Lidas”)
* [ ] Clique em item não lido marca como lido (persistente) + optimistic update
* [ ] Clique em item já lido não altera estado
* [ ] “Limpar tudo” marca todas as não lidas como lidas
* [ ] Backend cria notificação ao registrar transmissão (elogio/denúncia) para o jogador alvo
* [ ] Segurança: usuário só acessa/atualiza notificações próprias

## 8) Requisitos não funcionais (MVP)

* Consistência do badge garantida por re-fetch ao abrir popup (re-sync) e/ou estratégia equivalente
* Performance aceitável para listas usuais (paginação avançada fora do MVP)
* Logs mínimos para criação e leitura (readAt) para suporte/métricas

## 9) Critérios de aceite (Given/When/Then)

1. **Badge inicial**

* Given que o usuário tem N notificações não lidas
* When o header renderiza
* Then o badge mostra N

2. **Abertura do popup**

* Given que o usuário está logado
* When clica no sininho
* Then abre o popup/drawer com abas e lista scrollável

3. **Aba padrão**

* Given que o popup abriu
* When renderiza pela primeira vez
* Then a aba “Não lidas” está selecionada

4. **Ordenação**

* Given notificações em uma aba
* When a lista é exibida
* Then a ordem é do mais recente para o mais antigo

5. **Clique marca como lida (optimistic)**

* Given uma notificação não lida e badge = N
* When o usuário clica no item
* Then o item sai imediatamente da aba “Não lidas”, o badge vira N-1, e o banco registra como lida

6. **Persistência após reload**

* Given que o usuário marcou uma notificação como lida
* When recarrega a página
* Then ela não retorna como não lida e aparece na aba “Lidas”

7. **Limpar tudo**

* Given N>0 notificações não lidas
* When clica em “Limpar tudo”
* Then o badge vai a 0, “Não lidas” mostra estado vazio, e as notificações ficam em “Lidas”

8. **Clique em notificação já lida**

* Given uma notificação na aba “Lidas”
* When o usuário clica no item
* Then nenhuma alteração de estado ocorre e o badge não muda

9. **Estado vazio não fecha**

* Given que uma aba não tem itens
* When o usuário abre/alternar para essa aba
* Then o popup permanece aberto e mostra mensagem de vazio

10. **Bloqueio de transmissão antes do fechamento**

* Given uma partida não fechada
* When o usuário tenta criar elogio/denúncia
* Then o sistema bloqueia e nenhuma notificação é criada

## 10) Dependências e riscos

* Garantir enforcement da regra “transmissões só após fechamento” no backend (não apenas na UI).
* Falhas na persistência após optimistic update exigem re-sync para evitar inconsistência visual.


</techspec>

<critical>

- follow strictly your task
- follow the @.rules/project.md
- follow the @.rules/react.md

</critical>

