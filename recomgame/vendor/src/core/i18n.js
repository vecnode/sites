/**
 * The words.
 *
 * One language: European Portuguese. This is a Portuguese product, so Portuguese is
 * the source of its text rather than a translation of it — and there is no second
 * dictionary to drift out of step with the first. `src/core/explain.js`, the audit
 * formatter and every widget string read from here, so there is exactly one place a
 * sentence can be changed.
 *
 * Rules the wording follows:
 *
 *   1. **pt-PT, not pt-BR.** "utilizador", "ecrã", "a fazer" rather than the
 *      Brazilian forms, and the second person is "o utilizador"/impersonal
 *      rather than "você". Where the two variants differ, the European form wins.
 *   2. **No placeholder ever reaches a player.** A missing key returns the key
 *      itself, which is loud in a screenshot and impossible to mistake for copy.
 *   3. **Plurals are data.** A value may be `{ one, other }` and `t()` picks by
 *      `vars.n`, so the singular cannot be wrong by accident.
 *
 * The trace is prose too (its reasons and notes are strings), which is why the
 * language it was written in is recorded in the trace.
 *
 * FROZEN. See src/core/freeze.js.
 */

/** The language everything defaults to — and the only one this engine speaks. */
export const DEFAULT_LANG = 'pt-PT';

/** Every language this engine speaks. One, by design. */
export const SUPPORTED_LANGS = Object.freeze(['pt-PT']);

/**
 * Map any BCP-47 tag onto the language this engine speaks.
 *
 * Kept as a function, and kept name-stable, because it is the seam a second language
 * would be added at: every caller already asks it instead of comparing tags itself,
 * so bringing English back is one function body rather than a hunt through the
 * widget. Anything unrecognised becomes the product language rather than an error,
 * so a host that sets `lang="fr"` or `lang="en"` still gets playable content.
 *
 * @param {string} [tag]
 * @returns {'pt-PT'}
 */
export function resolveLang(tag) {
  void tag;
  return DEFAULT_LANG;
}

/**
 * @typedef {string | { one: string, other: string }} Entry
 * @type {Record<string, Record<string, Entry>>}
 */
export const STRINGS = {
  'pt-PT': {
    /* ------------------------------------------------------------- widget */
    'shell.back': 'Voltar',
    'shell.skip': 'Sem preferência',
    'shell.retry': 'Recomeçar',
    'shell.claim': 'Abrir',
    'shell.audit': 'Ver as contas',
    'shell.close': 'Fechar',
    'shell.language.switchTo': 'Mudar para inglês',
    /* O comutador de disposição: o rótulo VISÍVEL é o pedido, e a dica nomeia o
       que está no ecrã. São a mesma coisa em `auto` e diferem num passo depois
       de um toque, por isso os dois precisam de existir. */
    'shell.layout.auto': 'Auto',
    'shell.layout.portrait': 'Vertical',
    'shell.layout.landscape': 'Horizontal',
    'shell.layout.switch': 'Formato: agora {current}. Carregue para mudar.',
    'shell.layout.current.auto': 'automático (escolhido pelo espaço disponível)',
    'shell.layout.current.portrait': 'vertical (uma coluna)',
    'shell.layout.current.landscape': 'horizontal (duas colunas)',
    'shell.counter': '{n} de {total}',
    'shell.result': 'Resultado',
    /* A correspondência fala-se em palavras, não em percentagem. A pontuação é
       um modelo sobre cinco respostas, e um número convidava quem lê a levá-lo
       por uma medida da realidade. Ver docs/MODELO.md. */
    'shell.badge.match': 'Boa correspondência',
    'shell.badge.strong': 'Correspondência forte',
    'shell.badge.best': 'Melhor correspondência',
    'shell.badge.tiebreak': 'Decidido por desempate',
    'shell.unavailable': 'Indisponível',
    'shell.startError': 'Este jogo de recomendação não conseguiu arrancar.',
    'shell.noOptionsAlready': 'Esta pergunta não tem respostas disponíveis.',

    /* -------------------------------------------------- screen readers */
    'a11y.question': {
      one: 'Pergunta {number} de {total}. {text} {n} resposta disponível. Carregue em {n} para responder.',
      other: 'Pergunta {number} de {total}. {text} {n} respostas disponíveis. Carregue em {n} para responder.'
    },
    'a11y.result': 'A sua recomendação é {label}. {others} outras opções ficaram abaixo. O resultado e a justificação estão a seguir.',
    'a11y.back': 'De volta à pergunta {n} de {total}. {text}',

    /* --------------------------------------------------------- result */
    'result.why': 'Porquê esta escolha',
    /* As duas referências que acompanham a escolha: a segunda e a terceira da
       mesma ordenação, para quem quer comparar antes de decidir. */
    'result.references': 'Também pode interessar',
    'result.references.lead': 'As duas opções seguintes, pela mesma ordem de pontuação.',
    'result.reference.why': 'Ficou logo a seguir a esta escolha.',
    'result.category': 'Categoria',
    'result.table.caption': 'Pontos atribuídos, do melhor para o pior',
    'result.table.item': 'Brinde',
    'result.table.points': 'Pontos',
    'result.table.available': 'Disponíveis',
    'result.table.share': 'Percentagem',
    'result.verify': 'Verificar este resultado',
    'result.verify.none': 'Não há registo para verificar.',
    'result.verify.ok':
      'Verificado: repetir estas respostas no mesmo cálculo deu o mesmo vencedor e a mesma tabela de pontuação.',
    'result.verify.bad': 'NÃO VERIFICADO ({code}): {message}',
    'result.raw': 'O registo original',
    'result.decision':
      'Decidido por {rung}. O primeiro lugar ficou {margin}% à frente do segundo na escala normalizada.',
    'result.noPoints': 'sem pontos para nenhum brinde',

    /* --------------------------------------------------------- reasons */
    'explain.zero':
      '{label} não recebeu pontos de preferência nenhuma — nenhuma resposta lhe deu nada — por isso só foi escolhido porque a regra de desempate tem de escolher alguma coisa.',
    'explain.best':
      '{label} foi a melhor correspondência, com {raw} dos {maximum} pontos que podia ter recebido ({percent}%) nas perguntas que respondeu.',
    'explain.chose': {
      one: 'Escolheu «{option}» em «{question}», o que lhe deu 1 ponto.',
      other: 'Escolheu «{option}» em «{question}», o que lhe deu {n} pontos.'
    },
    'explain.more': {
      one: 'Mais 1 resposta também lhe deu pontos.',
      other: 'Mais {n} respostas também lhe deram pontos.'
    },
    'explain.skipped': {
      one: '1 pergunta foi saltada, por isso não influenciou este resultado.',
      other: '{n} perguntas foram saltadas, por isso não influenciaram este resultado.'
    },
    'explain.runnerLevel':
      '{runner} ficou empatado em pontos com {winner}; o primeiro lugar foi decidido por {rung}, que é aplicada sempre pela mesma ordem.',
    'explain.runnerBehind': {
      one: '{runner} ficou em segundo com 1 ponto, {gap}% atrás na escala normalizada.',
      other: '{runner} ficou em segundo com {n} pontos, {gap}% atrás na escala normalizada.'
    },
    'explain.skippedOption': 'sem preferência',
    'explain.summary': {
      one: '{label} ({percent}% de correspondência em 1 resposta)',
      other: '{label} ({percent}% de correspondência em {n} respostas)'
    },
    'explain.noResult': 'Sem resultado.',

    /* ------------------------------------------------------ tie-break */
    'rung.normalized-score': 'a pontuação normalizada mais alta',
    'rung.raw-score': 'a pontuação total mais alta (estavam igualmente bem correspondidos)',
    'rung.last-question-score': 'a pontuação mais alta na última pergunta',
    'rung.content-order': 'o brinde que aparece primeiro no conteúdo do jogo',
    'rung.lexicographic-id': 'o identificador por ordem alfabética (a regra final, totalmente arbitrária)',
    'rung.none': 'só havia um brinde para escolher',
    'rung.unknown': 'a regra chamada «{rung}»',

    /* ---------------------------------------------------------- notes */
    'note.noAnswers': 'Não foi respondida nenhuma pergunta, por isso nenhuma resposta indicou uma preferência.',
    'note.allSkipped': 'Todas as perguntas foram saltadas, por isso nenhuma resposta indicou uma preferência.',
    'note.zeroPoints':
      'O vencedor ficou com zero pontos normalizados: nenhuma opção escolhida lhe deu nada. O resultado foi decidido pela escada de desempate.',
    'note.stoppedEarly': 'O jogo parou antes da última pergunta: {reason}.',
    'note.arbitrary':
      'O primeiro lugar ficou separado apenas por «{rung}», que é estável mas arbitrário — vale a pena uma pergunta mais discriminante.',
    'note.singleItem': 'Só há um brinde para recomendar, por isso não houve nada a decidir.',

    /* -------------------------------------------------- early stopping */
    'stop.oneItem': 'só há um brinde, por isso nada pode mudar',
    'stop.tooFew': 'foram dadas menos de {minimum} respostas',
    'stop.ahead': 'o primeiro lugar está {lead}% à frente, acima do limiar de {threshold}%',
    'stop.notAhead': 'a vantagem é de {lead}%, igual ou abaixo do limiar',

    /* ---------------------------------------------------- trace text */
    'trace.empty': 'Sem registo: ainda não foi respondida nenhuma pergunta.',
    'trace.title': 'Registo de auditoria RecomGame {traceVersion} (motor {engineVersion})',
    'trace.gameLine': 'jogo      {gameId} v{gameVersion}  conteúdo {contentHash}',
    'trace.seedLine': 'semente   {seed}',
    'trace.seedNone': '(nenhuma — ordem determinística)',
    'trace.createdLine': 'criado    {createdAt}',
    'trace.asked': 'Perguntas feitas: {asked} de {available}',
    'trace.cols': '  bruto   máx    norm  +',
    'trace.winner': 'Vencedor',
    'trace.margin': 'Margem',
    'trace.threshold': '(limiar {percent}%)',
    'trace.decidedBy': 'Decidido por',
    'trace.why': 'Porquê:',
    'trace.notes': 'Notas:',
    'trace.stepByStep': 'Passo a passo:',
    'trace.skipped': '(saltada)',
    'trace.noPoints': '(sem pontos para nenhum brinde)',
    'trace.none': '(nenhum)',
    'trace.noReason': '(nenhuma razão registada)'
  }
};

/**
 * One sentence, in one language.
 *
 * A missing key returns the key, so an untranslated string is glaring rather
 * than invisible. A `{ one, other }` entry is chosen by `vars.n`.
 *
 * @param {string} [lang]
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 * @returns {string}
 */
export function t(lang, key, vars = {}) {
  const table = STRINGS[resolveLang(lang)] ?? STRINGS[DEFAULT_LANG];
  const fallback = STRINGS[DEFAULT_LANG];
  /** @type {Entry|undefined} */
  let entry = table[key] ?? fallback[key];
  if (entry === undefined) return key;
  if (typeof entry === 'object') {
    entry = Number(vars.n) === 1 ? entry.one : entry.other;
  }
  return entry.replace(/\{(\w+)\}/g, (_match, name) => (vars[name] === undefined ? '' : String(vars[name])));
}
