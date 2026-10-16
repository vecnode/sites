/**
 * The controller: session state in, views and events out.
 *
 * This is the seam between the pure engine and the DOM. Everything that
 * decides WHAT happens is in src/core and is tested without a browser;
 * everything that decides HOW it looks lives in the view modules and the
 * stylesheet. The controller owns the one thing that is genuinely stateful and
 * DOM-shaped: which view is on screen, and what the player's last action meant.
 *
 * It also owns two rules that would otherwise be easy to get subtly wrong:
 *
 *   1. An answered question is never counted twice. The controller always asks
 *      the CORE to make the transition (`answer()` replaces an existing answer
 *      for that index); it never accumulates anything itself.
 *   2. The result is a function of the answers alone. Re-computing from scratch
 *      every time means "back, change one answer, finish" produces exactly what
 *      a fresh run with those answers would.
 */

import {
  createSession,
  currentQuestion,
  answer as coreAnswer,
  back as coreBack,
  play,
  reset as coreReset,
  cancel as coreCancel,
  SKIP
} from '../core/session.js';
import { buildTrace } from '../core/audit.js';
import { summariseResult, rungLabel } from '../core/explain.js';
import { prepareGame } from '../core/model.js';
import { validateGame, formatReport } from '../core/validate.js';
import { createProgressRing } from './canvas.js';
import { createQuestionView } from './question-view.js';
import { createResultView } from './result-view.js';
import {
  createAnnouncer,
  questionAnnouncement,
  resultAnnouncement,
  backAnnouncement,
  digitShortcuts,
  focusQuietly
} from './a11y.js';
import { el, append, empty } from '../util/dom.js';
import { EVENTS, CLOSE_REASONS } from '../util/events.js';
import { t, DEFAULT_LANG } from '../core/i18n.js';

/** Visible copy for one language. A host may still override any of it. */
function defaultLabels(lang) {
  return {
    back: t(lang, 'shell.back'),
    skip: t(lang, 'shell.skip'),
    retry: t(lang, 'shell.retry'),
    claim: t(lang, 'shell.claim'),
    audit: t(lang, 'shell.audit'),
    close: t(lang, 'shell.close')
  };
}

/**
 * @typedef {object} ControllerOptions
 * @property {unknown} game            A game document, or an already-prepared game.
 * @property {string} [seed]
 * @property {number} [maxQuestions]
 * @property {boolean} [shuffleQuestions]
 * @property {boolean} [audit]         Whether the audit panel is available.
 * @property {string} [lang]           The language of every sentence. Defaults to the game's own.
 * @property {Record<string, string>} [labels]
 * @property {(message: string) => void} [onAnnounce] The host's own live region.
 * @property {(name: string, detail: Record<string, unknown>) => void} [onEvent]
 */

/**
 * @typedef {ReturnType<typeof buildController>} Controller
 *
 * @typedef {{ ok: true, controller: Controller }} ControllerSuccess
 * @typedef {{ ok: false, code: string, message: string, report: import('../core/validate.js').ValidationReport, text: string }} ControllerFailure
 * @typedef {ControllerSuccess|ControllerFailure} ControllerResult
 */

/**
 * Create a controller around a game document.
 *
 * Returns `{ ok: false, report }` rather than throwing when the content is
 * unusable: a host page should be able to show a readable message, and a 404 or
 * a typo in a content file is a normal event rather than an exception.
 *
 * @param {ControllerOptions} options
 * @returns {ControllerResult}
 */
export function createController(options) {
  const prepared = isPrepared(options.game)
    ? {
        ok: /** @type {const} */ (true),
        game: /** @type {import('../core/model.js').Game} */ (options.game)
      }
    : prepareGame(options.game, {
        seed: options.seed,
        maxQuestions: options.maxQuestions
      });

  if (!prepared.ok) {
    const report = 'report' in prepared ? prepared.report : validateGame(options.game);
    return {
      ok: false,
      code: report.issues[0]?.code ?? 'CONTENT_UNUSABLE',
      message: report.issues[0]?.message ?? 'The game content could not be used.',
      report,
      text: formatReport(report, 'game')
    };
  }

  const session = createSession(prepared.game, {
    seed: options.seed,
    maxQuestions: options.maxQuestions,
    shuffleQuestions: options.shuffleQuestions
  });

  if (!session.ok) {
    return {
      ok: false,
      code: session.report.issues[0]?.code ?? 'CONTENT_UNUSABLE',
      message: session.report.issues[0]?.message ?? 'The game content could not be started.',
      report: session.report,
      text: formatReport(session.report, 'game')
    };
  }

  return { ok: true, controller: buildController(prepared.game, session.state, options) };
}

/**
 * @param {import('../core/model.js').Game} game
 * @param {import('../core/session.js').SessionState} initialState
 * @param {ControllerOptions} options
 */
function buildController(game, initialState, options) {
  /** The language of every sentence this controller writes: the product's own. */
  let lang = DEFAULT_LANG;
  let labels = { ...defaultLabels(lang), ...(options.labels ?? {}) };
  const showShortcuts = options.audit !== false;

  const fallbackAnnouncer = createAnnouncer();
  const ambient = createProgressRing();

  /**
   * Announce to the host's live region when one is supplied.
   *
   * A live region only works when it is IN the tree, and the controller renders
   * into a viewport the host provides — so the host owns the region, and this
   * is only the stand-alone fallback.
   *
   * @param {string} message
   */
  const announce = (message) => {
    if (typeof options.onAnnounce === 'function') options.onAnnounce(message);
    else fallbackAnnouncer.say(message);
  };

  /** @type {import('../core/session.js').SessionState} */
  let state = initialState;

  /**
   * The staged flow, when the document carries one.
   *
   * A document may define more questions than one play asks — a category router
   * whose narrowing questions exist once per category. The engine does not know
   * that: `prepareGame` caps a session at ten questions and asks the first ones.
   * So the widget reads the `flow` block, asks the first stage, and once the
   * player has chosen a category rebuilds the session over exactly the five
   * questions in play, replaying every answer through the core. The trace is
   * built from the rebuilt state, so nothing about the audit changes: the same
   * answers, through the same state machine, over the same document.
   */
  const flow = readFlow(options.game);
  const categoryOption = new Map();
  for (const entry of flow?.categories ?? []) {
    if (entry.optionId) categoryOption.set(entry.optionId, entry);
  }
  /** The first stage, in the flow's own order — never the document's order. */
  const [leadStage] = flow?.stages ?? [];
  const broadIds = (leadStage?.questions ?? []).filter((id) => typeof id === 'string');
  /** The narrowing questions, in the order the flow asks them. */
  const narrowIds = (flow?.stages ?? [])
    .slice(1)
    .flatMap((stage) => stage.questions ?? [])
    .filter((id) => typeof id === 'string');
  let staged = broadIds.length > 0 && narrowIds.length > 0;

  /** The category the player chose, or null while the first stage is open. */
  let categoryChoice = null;

  /**
   * The options a question should offer, given the category in play.
   *
   * A narrowing question carries one option per value across EVERY category, so
   * without this the player would read options that cannot reach any product
   * their earlier answers left in play. Falls back to the document's own list
   * whenever the flow has nothing to say about this question.
   *
   * @param {import('../core/model.js').Question} question
   * @returns {readonly import('../core/model.js').Option[]}
   */
  const optionsFor = (question) => {
    if (!staged || !categoryChoice) return question.options;
    const allowed = categoryChoice.specific?.[question.id];
    if (!Array.isArray(allowed) || allowed.length === 0) return question.options;
    const wanted = new Set(allowed);
    const kept = question.options.filter((option) => wanted.has(option.id));
    /* One option is a legitimate sheet, not a failure: a category with a single
     * kind asks "which kind" and answers itself. Only an EMPTY intersection
     * means the flow and the question disagree, and then the document wins. */
    return kept.length > 0 ? kept : question.options;
  };

  /**
   * The item id -> category label map, for the result header.
   *
   * A document only says which products are in a category through the answer
   * that selects them, so this reads the option's weights: whatever that option
   * favours belongs to that category, for the products it actually favours.
   */
  const categoryByItem = new Map();
  for (const entry of flow?.categories ?? []) {
    if (!entry.optionId || !entry.label) continue;
    for (const question of game.questions) {
      const option = question.options.find((candidate) => candidate.id === entry.optionId);
      if (!option) continue;
      for (const [itemId, value] of Object.entries(option.weights)) {
        if (value > 0) categoryByItem.set(itemId, entry.label);
      }
    }
  }

  /**
   * Which question ids a session should ask: the first stage, in the flow's own
   * order, then every narrowing question that this category can reach.
   *
   * The narrowing questions come out in the order they have IN THE DOCUMENT,
   * not in the order the flow happens to list them, and that is deliberate: the
   * session's own option order and the trace's step order follow the document,
   * and a broadcast order that disagreed with it would be a second ordering to
   * keep in step. `questionIdsFor` is therefore only ever about WHICH questions,
   * and `createSession` decides the order.
   *
   * `null` means "no category yet", and it answers with the session that would
   * have been created without a flow at all, so going back can restore it.
   *
   * @param {string|null} categoryId
   * @returns {string[]}
   */
  const questionIdsFor = (categoryId) => {
    const chosen = categoryId ? flow?.categories?.find((entry) => entry.id === categoryId) : null;
    if (chosen) {
      const wanted = new Set(broadIds);
      for (const [questionId, options] of Object.entries(chosen.specific ?? {})) {
        if (Array.isArray(options) && options.length > 0) wanted.add(questionId);
      }
      const ordered = game.questions.map((question) => question.id).filter((id) => wanted.has(id));
      const missing = [...wanted].filter((id) => !ordered.includes(id));
      return [...ordered, ...missing];
    }
    return [...broadIds, ...narrowIds];
  };

  /**
   * Rebuild the session around a new question order, replaying every answer.
   *
   * `play()` is the right tool rather than hand-assembled state: it resets,
   * answers in order, and stops cleanly. Each replayed option id is one the
   * player already chose, so the state that comes out is the state clicking
   * through those answers would have produced — including the `index`, which is
   * what makes the next question the right one.
   *
   * @param {string|null} categoryId
   * @returns {boolean} whether the order actually changed
   */
  /**
   * Rebuild the session around a category, replaying every answer.
   *
   * There is deliberately no "nothing changed" short-circuit. There was one,
   * comparing the old question set with the new, and it was a defect: on a
   * document whose narrowing questions already follow the lead stage the sets
   * are equal, so the rebuild was skipped — and the answer the player had just
   * given to the LAST lead-stage question had already been taken by the session,
   * which then advanced past the end and mounted the result. Rebuilding whenever
   * a category is chosen is cheap, idempotent, and cannot drift.
   *
   * THE ONE THING A REPLAY CANNOT RECOVER. `play()` answers the recorded
   * questions in order and stops; with the broad stage answered and the narrow
   * ones not, the status comes back `asking` while the session it replaced had
   * already moved past its own end. So when every question of the lead stage has
   * an answer and NO broad question is left unanswered, this completes the
   * session in the same shape the core would have produced, and says so. The
   * test is on the remaining broad questions rather than on the index, because
   * an index that happens to point at a narrowing question is a question the
   * player still has to answer. Nothing else about the state is touched.
   *
   * @param {string|null} categoryId
   * @returns {boolean} whether the order changed
   */
  const retarget = (categoryId) => {
    if (!staged) return false;
    const asked = state.answers.filter((entry) => broadIds.includes(entry.questionId));
    const before = state.order.map((question) => question.id).join('|');
    const next = createSession(game, {
      seed: options.seed,
      maxQuestions: options.maxQuestions,
      questionIds: questionIdsFor(categoryId)
    });
    if (!next.ok) return false;

    let replayed = play(next.state, asked.map((entry) => entry.optionId));
    const pendingBroad = broadIds.filter(
      (id) => !replayed.answers.some((entry) => entry.questionId === id)
    );
    if (pendingBroad.length === 0 && replayed.order.length === asked.length && broadIds.length > 0) {
      replayed = { ...replayed, status: 'complete' };
    }
    const after = replayed.order.map((question) => question.id).join('|');
    state = replayed;
    return after !== before;
  };

  /** The view currently mounted, so it can be destroyed and replaced cleanly. */
  /** @type {{ destroy: () => void } | null} */
  let mounted = null;
  /** The host element the views are mounted into. */
  let viewport = /** @type {HTMLElement|null} */ (null);
  /** The step-pip list, drawn into on every render. */
  let stepsElement = /** @type {HTMLElement|null} */ (null);
  /** Called when the player asks to leave. */
  let closeHandler = /** @type {((reason: string) => void) | null} */ (null);

  /** How many questions this play asks. It grows when a staged flow narrows. */
  let total = state.order.length;

  /**
   * Recompute the trace from the CURRENT answers. Never cached, always derived.
   *
   * The language is passed every time, which is what makes switching language
   * work: the reasons and notes are prose, so a new trace is built rather than
   * only re-labelling the buttons.
   *
   * @returns {import('../core/audit.js').Trace}
   */
  const traceOf = () => buildTrace(state, { lang });

  /**
   * @param {string} name
   * @param {Record<string, unknown>} detail
   */
  const fire = (name, detail) => {
    if (typeof options.onEvent === 'function') options.onEvent(name, detail);
  };

  /* ------------------------------------------------------------- rendering */

  const mount = () => {
    if (!viewport) return;
    mounted?.destroy();
    mounted = null;

    // The engine always answers, so a finished game always has a result to
    // show — including a cancelled session, and one where nothing was answered.
    if (state.status === 'asking') {
      mounted = mountQuestion();
    } else {
      mounted = mountResult();
    }
    ambient.draw({ value: progressFraction(), animate: true });
    renderSteps();
  };

  const mountQuestion = () => {
    const question = currentQuestion(state);
    if (!question || !viewport) return null;

    const existing = state.answers.find((entry) => entry.index === state.index);
    // Only the options this category can reach. The engine still scores every
    // option; this is what the player is asked, not what the model holds.
    const offered = optionsFor(question);
    const view = createQuestionView({
      view: {
        id: question.id,
        text: question.text,
        help: question.help,
        number: state.index + 1,
        total,
        canGoBack: state.index > 0,
        backLabel: labels.back,
        skippable: question.skippable,
        skipLabel: labels.skip,
        showShortcuts,
        options: offered.map((option) => ({
          id: option.id,
          label: option.label,
          detail: option.detail,
          selected: existing?.optionId === option.id
        }))
      },
      onChoose: (optionId) => choose(optionId),
      onBack: () => back()
    });

    empty(viewport);
    append(viewport, [view.element]);
    focusQuietly(view.element);
    return view;
  };

  const mountResult = () => {
    const trace = traceOf();
    if (!viewport || !trace) return null;
    const winner = game.itemsById[trace.outcome?.winnerId ?? ''] ?? game.items[0];
    const top = trace.ranking[0];
    const noPreference = top?.normalized === 0;
    const category =
      categoryByItem.get(winner.id) ?? (categoryChoice ? categoryChoice.label : '');
    /** The two closest alternatives, by the same ranking the winner came from. */
    const references = trace.ranking.slice(1, 3).map((row) => ({
      label: row.label,
      reference: referenceLine(game.itemsById[row.itemId]),
      category: categoryByItem.get(row.itemId) ?? '',
      why: t(lang, 'result.reference.why')
    }));

    const view = createResultView({
      trace,
      document: game,
      lang,
      view: {
        label: winner.label,
        summary: winner.summary,
        reference: referenceLine(winner),
        category: category ? `${t(lang, 'result.category')}: ${category}` : '',
        bullets: winner.bullets,
        url: winner.url,
        references,
        referencesTitle: t(lang, 'result.references'),
        reasons: trace.outcome?.reasons ?? [],
        /* Tone only. The badge says HOW WELL it fits in words, because a
         * percentage would read as a measurement of the product. */
        badgeTone: noPreference ? 'caveat' : references.length > 0 ? 'match' : 'strong',
        badgeLabel: noPreference
          ? t(lang, 'shell.badge.tiebreak')
          : t(lang, 'shell.badge.match'),
        retryLabel: labels.retry,
        claimLabel: labels.claim,
        showAudit: options.audit !== false,
        auditSummary: labels.audit,
        notes: trace.notes,
        canGoBack: true,
        backLabel: labels.back,
        steps: trace.steps.map((step) => ({
          question: step.questionId,
          option: step.optionLabel,
          applied:
            Object.entries(step.applied)
              .map(([id, value]) => `${id} ${value > 0 ? '+' : ''}${value}`)
              .join(', ') || t(lang, 'result.noPoints')
        }))
      },
      onRetry: () => startOver(),
      onBack: () => back()
    });

    empty(viewport);
    append(viewport, [view.element]);
    focusQuietly(view.element);
    return view;
  };

  const renderSteps = () => {
    if (!stepsElement) return;
    if (state.status !== 'asking') {
      stepsElement.hidden = true;
      return;
    }
    stepsElement.hidden = false;
    empty(stepsElement);
    for (let index = 0; index < total; index += 1) {
      const status =
        index < state.answers.length ? 'done' : index === state.index ? 'current' : 'todo';
      stepsElement.appendChild(el('li', { 'data-state': status }));
    }
  };

  /**
   * How far along the ring should look.
   *
   * The question being asked counts as half a step, so the ring moves on
   * arrival rather than only on answering — a ring that does not move until the
   * first answer looks broken.
   */
  const progressFraction = () => {
    if (total === 0) return 0;
    if (state.status === 'complete') return 1;
    return Math.min(1, (state.answers.length + 0.5) / total);
  };

  /* --------------------------------------------------------------- actions */

  /**
   * @param {string} optionId
   */
  const choose = (optionId) => {
    if (state.status !== 'asking') return;
    const question = currentQuestion(state);
    if (!question) return;

    // The core decides what "answering" means, including that re-answering a
    // question replaces the previous answer instead of adding a second one.
    // The controller accumulates nothing itself.
    const answeredIndex = state.index;
    state = coreAnswer(state, optionId);
    const recorded = state.answers.find((entry) => entry.index === answeredIndex);

    fire(EVENTS.answer, {
      questionId: question.id,
      optionId,
      skipped: recorded?.skipped ?? optionId === SKIP,
      index: answeredIndex,
      answered: state.answers.length,
      total
    });

    // The answer that names a category is what opens the narrowing questions.
    // This happens on the answer that chose it, not on finish, so the counter
    // reads "2 de 5" rather than growing a step mid-play.
    /*
     * Rebuild the session with the right narrowing questions and replay every
     * answer through the core. This runs whenever the ANSWERED QUESTION is part
     * of the first stage, not only when the category changes, because the core
     * state machine advances on `answer()` and a replay has to be the thing
     * that decides whether the play is finished. When nothing needs to change
     * the replay is a no-op that costs a few microseconds.
     */
    if (staged && broadIds.includes(question.id)) {
      const picked = categoryOption.get(optionId) ?? null;
      if (picked && picked.id !== categoryChoice?.id) categoryChoice = picked;
      retarget(categoryChoice?.id ?? null);
      total = state.order.length;
      if (state.status !== 'asking') {
        const trace = traceOf();
        fire(EVENTS.complete, {
          winner: trace.outcome?.winnerId ?? '',
          winnerLabel: trace.outcome?.winnerLabel ?? '',
          trace,
          summary: summariseResult(trace, lang)
        });
        mount();
        announce(
          resultAnnouncement(
            trace.outcome?.winnerLabel ?? '',
            Math.max(0, game.items.length - 1),
            lang
          )
        );
        return;
      }
    }

    if (state.status === 'complete') {
      const trace = traceOf();
      fire(EVENTS.complete, {
        winner: trace.outcome?.winnerId ?? '',
        winnerLabel: trace.outcome?.winnerLabel ?? '',
        trace,
        summary: summariseResult(trace, lang)
      });
      mount();
      announce(
        resultAnnouncement(
          trace.outcome?.winnerLabel ?? '',
          Math.max(0, game.items.length - 1),
          lang
        )
      );
      return;
    }

    mount();
    const next = currentQuestion(state);
    if (next) {
      announce(questionAnnouncement(state.index + 1, total, next.text, optionsFor(next).length, lang));
    }
  };

  const back = () => {
    if (state.status === 'asking' && state.index === 0) return;
    state = coreBack(state);
    mount();
    const question = currentQuestion(state);
    fire(EVENTS.back, { questionId: question?.id ?? '', index: state.index, total });
    if (question) {
      announce(backAnnouncement(state.index + 1, total, question.text, lang));
    }
  };

  const startOver = () => {
    state = coreReset(state);
    // Back to the first stage: the narrowing questions belong to a category the
    // player has not chosen yet in this play.
    if (staged && categoryChoice) {
      categoryChoice = null;
      retarget(null);
      total = state.order.length;
    }
    mount();
    const question = currentQuestion(state);
    if (question) {
      announce(questionAnnouncement(1, total, question.text, optionsFor(question).length, lang));
    }
  };

  const abandon = () => {
    state = coreCancel(state);
  };

  /**
   * The handler for a digit shortcut. Owned here rather than in the element,
   * because only the controller knows whether a question is on screen.
   *
   * The shortcut numbers what is ON SCREEN, not what the document holds: a
   * staged flow offers a subset of a narrowing question's options, and "2" must
   * mean the second option the player can see.
   *
   * @param {number} index
   */
  const pickByIndex = (index) => {
    if (state.status !== 'asking') return;
    const question = currentQuestion(state);
    const option = question ? optionsFor(question)[index] : undefined;
    if (option) choose(option.id);
  };

  return {
    game,
    labels,
    /** The language every sentence is written in. */
    get lang() {
      return lang;
    },
    get state() {
      return state;
    },
    /**
     * Re-render with fresh copy.
     *
     * There is one language, so this no longer changes the words; it stays because
     * a host that overrode `labels` can ask for them to be re-applied, and because
     * it is the seam a second language would return at.
     *
     * @param {string} [_next]
     */
    setLanguage(_next) {
      lang = DEFAULT_LANG;
      labels = { ...defaultLabels(lang), ...(options.labels ?? {}) };
      mount();
      return this;
    },
    get trace() {
      return state.answers.length > 0 ? traceOf() : null;
    },
    /**
     * The progress-ring canvas layer.
     *
     * The host decides WHERE it goes (it needs to sit beside the counter in the
     * shell), so the layer is exposed rather than self-mounting.
     */
    get ring() {
      return ambient;
    },
    /** @param {HTMLElement} element */
    attach(element) {
      viewport = element;
      return this;
    },
    /** @param {HTMLElement} element */
    attachSteps(element) {
      stepsElement = element;
      return this;
    },
    /** @param {(reason: string) => void} handler */
    onDismiss(handler) {
      closeHandler = handler;
      return this;
    },
    requestClose(reason = CLOSE_REASONS.button) {
      abandon();
      closeHandler?.(reason);
    },
    /** Mount the current view. Separate from attach so the host can lay out first. */
    render() {
      mount();
      return this;
    },
    choose,
    back,
    startOver,
    /** @returns {(event: KeyboardEvent) => void} */
    keyboardHandler() {
      return digitShortcuts(pickByIndex);
    },
    /** A summary line for a host's own logging. */
    summary() {
      return summariseResult(traceOf(), lang);
    },
    /** The rule that decided the result, in words. */
    decisionWords() {
      return rungLabel(traceOf().decision.tieBreakApplied, lang);
    },
    /** Announce through the host's region, for the element's own messages. */
    announce,
    destroy() {
      mounted?.destroy();
      mounted = null;
      ambient.destroy();
      closeHandler = null;
    }
  };
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPrepared(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'itemsById' in value &&
      'questionsById' in value &&
      'contentHash' in value
  );
}

/**
 * The `flow` block of a raw game document, when it has a usable one.
 *
 * This is read from the DOCUMENT rather than from the prepared game, because
 * `prepareGame` normalises the engine's own fields and nothing else: the flow is
 * presentation, and the engine neither knows nor needs to know it exists. A
 * document without one plays exactly as before.
 *
 * @param {unknown} document
 * @returns {{ stages: Array<{ id?: string, questions: string[] }>, categories: any[] } | null}
 */
function readFlow(document) {
  if (document === null || typeof document !== 'object' || Array.isArray(document)) return null;
  const flow = /** @type {Record<string, unknown>} */ (document).flow;
  if (flow === null || typeof flow !== 'object' || Array.isArray(flow)) return null;
  const record = /** @type {Record<string, unknown>} */ (flow);
  if (!Array.isArray(record.stages) || record.stages.length < 2) return null;
  if (!Array.isArray(record.categories) || record.categories.length === 0) return null;
  const stages = record.stages
    .filter((stage) => stage && typeof stage === 'object' && Array.isArray(stage.questions))
    .map((stage) => ({
      id: typeof stage.id === 'string' ? stage.id : '',
      questions: stage.questions.filter((id) => typeof id === 'string')
    }));
  if (stages.length < 2) return null;
  return { stages, categories: record.categories.filter((entry) => entry && typeof entry === 'object') };
}

/**
 * The one line that turns an item back into something orderable.
 *
 * @param {import('../core/model.js').Item | undefined} item
 * @returns {string}
 */
function referenceLine(item) {
  if (!item) return '';
  if (item.sku && item.skuMba) return `${item.sku} · ${item.skuMba}`;
  return item.skuMba || item.sku || '';
}

export { SKIP, readFlow };
