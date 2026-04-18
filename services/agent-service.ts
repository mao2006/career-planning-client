type EmploymentMetric = {
  label: string;
  value: string;
};

type EmploymentTargetJob = {
  matchRate: string;
  summary: string;
  title: string;
};

type EmploymentInsight = {
  body: string;
  score: number;
  title: string;
};

export type EmploymentProfileContent = {
  actionItems: string[];
  abilityInsights: EmploymentInsight[];
  certificates: string[];
  gapItems: string[];
  heroBadge: string;
  heroDescription: string;
  heroMetrics: EmploymentMetric[];
  heroTitle: string;
  professionalSkills: string[];
  radarFootnote: string;
  radarValues: number[];
  strengthTags: string[];
  targetJobs: EmploymentTargetJob[];
};

type AgentChatResult = {
  answer: string;
  conversationId: string;
  ended: boolean;
  messageId: string;
  rawAnswer: string;
};

type WorkflowGapItem = {
  gap_item?: string;
  next_best_action?: string;
  severity?: string;
};

type WorkflowMatchResult = {
  alignment_score?: {
    basic?: number;
    literacy?: number;
    overall?: number;
    potential?: number;
    skill?: number;
  };
  career_path_support?: {
    transfer_delta?: string[];
    transfer_path?: string;
    vertical_next?: string;
  };
  decision_evidence?: {
    cons?: string[];
    pros?: string[];
    raw_quotes?: string[];
  };
  rank?: number;
  role_name?: string;
  skills_gap_analysis?: WorkflowGapItem[];
  tier?: string;
};

type WorkflowOutput = {
  decision_timestamp?: string;
  match_results?: WorkflowMatchResult[];
  student_id?: string;
};

const DEFAULT_AGENT_BASE_URL = 'http://110.40.184.85:9090/v1';
const DEFAULT_AGENT_USER = 'maojianhui-career-client';
const DEFAULT_STUDENT_PROFILE = {
  careerAspiration: '希望从 C++ 开发切入，再向后端开发和嵌入式开发延展，优先寻找软件研发类岗位。',
  certificates: ['全国计算机二级', '大学英语四级', '软考程序员'],
  currentStatus: '有大致方向，但不够清晰具体',
  experience:
    '已完成数据结构课程设计、1 次团队协作开发、1 个 Linux + C++ mini 项目，具备持续学习和工程化落地能力。',
  futureGoal: '就业(找工作)',
  honor: '学习吸收快、执行节奏稳，具备工程实现型潜力，适合从研发主线切入。',
  investment: '偏向低成本/免费资源(以自学、校内资源、免费网课为主)',
  major: '车辆工程',
  name: '毛健辉',
  school: '浙江工业大学',
  skills: ['C++ / C', '数据结构与算法', 'Linux 开发环境', 'Git 协作', '调试定位', '计算机网络基础'],
  targetJobs: ['C++ 开发工程师', '后端开发工程师', '嵌入式开发工程师'],
  transferIntent: '没有',
} as const;

export const DEFAULT_EMPLOYMENT_PROFILE_CONTENT: EmploymentProfileContent = {
  actionItems: [
    '2 周内完成一个可运行的 Linux + C++ mini 项目，并补齐 README、模块说明和截图。',
    '3 周内整理 1 版研发定向简历，把项目经历改写成“背景-职责-结果-复盘”的表达。',
    '4 周内围绕 C++ / 后端岗位做 1 次模拟面试，集中补齐项目讲解、网络和操作系统高频题。',
  ],
  abilityInsights: [
    {
      body: '接受新知识速度快，适合通过密集学习把课程内容转成岗位能力。',
      score: 91,
      title: '学习转化',
    },
    {
      body: '小团队协作和任务对接问题不大，但项目汇报和面试表达还可以更主动。',
      score: 80,
      title: '沟通协作',
    },
    {
      body: '执行和交付意识突出，能把任务从“会做”推进到“能展示”。',
      score: 87,
      title: '实践落地',
    },
    {
      body: '遇到调试和截止时间时仍能稳定推进，但多任务并行时节奏会波动。',
      score: 76,
      title: '抗压稳定',
    },
    {
      body: '更偏扎实推进型，适合先建立基础盘，再做渐进式优化和创新。',
      score: 73,
      title: '创新探索',
    },
  ],
  certificates: [...DEFAULT_STUDENT_PROFILE.certificates],
  gapItems: [
    '高质量实习或真实业务证明仍然偏少，需要尽快补一个可讲清楚的项目闭环。',
    '工程化深度还不够，建议把现有项目补齐 Linux、Git、调试和模块拆分细节。',
    '岗位表达偏保守，面试时要提前准备“为什么选这个方向”和“项目里你负责什么”。',
  ],
  heroBadge: '工程实现型画像',
  heroDescription:
    '从当前画像看，你的优势集中在学习转化、实践推进和持续执行上。更适合先从 C++ 开发切入，再向后端或嵌入式方向延展，把课程基础逐步沉淀成可被招聘方看见的项目成果。',
  heroMetrics: [
    { label: '主方向', value: 'C++ 开发' },
    { label: '岗位匹配', value: '82%' },
    { label: '成长势能', value: '高潜' },
  ],
  heroTitle: '你更像一位适合走研发主线的工程型学习者',
  professionalSkills: [...DEFAULT_STUDENT_PROFILE.skills],
  radarFootnote: '你的整体风格偏“先学会，再做深，再做稳”。这类能力结构在研发岗位里更容易跑出稳定成长曲线。',
  radarValues: [91, 80, 87, 76, 73],
  strengthTags: ['学习吸收快', '执行节奏稳', '调试耐心强', '工程意识在线', '持续复盘习惯'],
  targetJobs: [
    {
      matchRate: '82%',
      summary: '主投方向。当前学习吸收和工程实践优势最容易在这个岗位形成证明项。',
      title: 'C++ 开发工程师',
    },
    {
      matchRate: '78%',
      summary: '作为第二志愿更稳妥。继续补数据库、网络和服务端项目后匹配度会继续上升。',
      title: '后端开发工程师',
    },
    {
      matchRate: '74%',
      summary: '适合作为差异化备选方向，尤其适合愿意做底层调试和联调的人。',
      title: '嵌入式开发工程师',
    },
  ],
};

function getEnvValue(name: string) {
  const processRef = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;

  return processRef?.env?.[name]?.trim();
}

function normalizeAuthorization(rawAuthorization: string) {
  return rawAuthorization.startsWith('Bearer ') ? rawAuthorization : `Bearer ${rawAuthorization}`;
}

function getChatAgentAuthorization() {
  const rawAuthorization =
    getEnvValue('EXPO_PUBLIC_CHAT_AGENT_AUTHORIZATION') || getEnvValue('EXPO_PUBLIC_AGENT_AUTHORIZATION');

  if (!rawAuthorization) {
    return '';
  }

  return normalizeAuthorization(rawAuthorization);
}

function getWorkflowAgentAuthorization() {
  const rawAuthorization = getEnvValue('EXPO_PUBLIC_WORKFLOW_AGENT_AUTHORIZATION');

  if (!rawAuthorization) {
    return '';
  }

  return normalizeAuthorization(rawAuthorization);
}

function getAgentBaseUrl() {
  return getEnvValue('EXPO_PUBLIC_AGENT_BASE_URL') || DEFAULT_AGENT_BASE_URL;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeJsonParse<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function clampScore(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(45, Math.min(98, Math.round(value)));
}

function dedupeStrings(values: Array<string | undefined | null>) {
  return values.filter((value): value is string => Boolean(value && value.trim())).filter((value, index, source) => {
    const normalized = value.trim();

    return source.findIndex((item) => item?.trim() === normalized) === index;
  });
}

function interpolateTemplateVariables(text: string) {
  const templateVariables: Record<string, string> = {
    career_aspiration: DEFAULT_STUDENT_PROFILE.careerAspiration,
    major: DEFAULT_STUDENT_PROFILE.major,
    school: DEFAULT_STUDENT_PROFILE.school,
    student_name: DEFAULT_STUDENT_PROFILE.name,
    target_role: DEFAULT_STUDENT_PROFILE.targetJobs[0],
  };

  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (placeholder, variableName: string) => {
    return templateVariables[variableName] ?? placeholder;
  });
}

function toPercentText(value: number, fallback: string) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return `${Math.round(value)}%`;
}

function buildResumeText() {
  return [
    `姓名：${DEFAULT_STUDENT_PROFILE.name}`,
    `学校：${DEFAULT_STUDENT_PROFILE.school}`,
    `专业：${DEFAULT_STUDENT_PROFILE.major}`,
    `技能：${DEFAULT_STUDENT_PROFILE.skills.join('、')}`,
    `证书：${DEFAULT_STUDENT_PROFILE.certificates.join('、')}`,
    `经历：${DEFAULT_STUDENT_PROFILE.experience}`,
    `荣誉：${DEFAULT_STUDENT_PROFILE.honor}`,
    `目标岗位：${DEFAULT_STUDENT_PROFILE.targetJobs.join(' / ')}`,
  ].join('\n');
}

function buildSurveyResult() {
  return [
    `未来目标：${DEFAULT_STUDENT_PROFILE.futureGoal}`,
    `目前状态：${DEFAULT_STUDENT_PROFILE.currentStatus}`,
    `经济投入：${DEFAULT_STUDENT_PROFILE.investment}`,
    `转专业意愿：${DEFAULT_STUDENT_PROFILE.transferIntent}`,
  ].join('\n');
}

function buildFullProfileJson() {
  return JSON.stringify(
    {
      certificate: DEFAULT_STUDENT_PROFILE.certificates,
      career_aspiration: DEFAULT_STUDENT_PROFILE.careerAspiration,
      current_status: DEFAULT_STUDENT_PROFILE.currentStatus,
      experience: DEFAULT_STUDENT_PROFILE.experience,
      future_goal: DEFAULT_STUDENT_PROFILE.futureGoal,
      honor: DEFAULT_STUDENT_PROFILE.honor,
      investment: DEFAULT_STUDENT_PROFILE.investment,
      major: DEFAULT_STUDENT_PROFILE.major,
      name: DEFAULT_STUDENT_PROFILE.name,
      school: DEFAULT_STUDENT_PROFILE.school,
      skill: DEFAULT_STUDENT_PROFILE.skills,
      target_job: DEFAULT_STUDENT_PROFILE.targetJobs,
      transfer_intent: DEFAULT_STUDENT_PROFILE.transferIntent,
    },
    null,
    2
  );
}

function buildErrorMessage(status: number, rawText: string) {
  const parsed = safeJsonParse<Record<string, unknown>>(rawText);

  if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
    return parsed.message;
  }

  if (rawText.trim()) {
    return rawText.trim();
  }

  return `请求失败（${status}）`;
}

function parseSsePayloads(rawText: string) {
  return rawText
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .map((block) =>
      block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n')
    )
    .filter((payload) => payload.length > 0 && payload !== '[DONE]')
    .map((payload) => safeJsonParse<unknown>(payload) ?? payload);
}

function extractOpeningMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (!isRecord(payload)) {
    return null;
  }

  const candidates = [
    payload.opening_statement,
    payload.opening_message,
    payload.opening,
    isRecord(payload.data) ? payload.data.opening_statement : null,
    isRecord(payload.data) ? payload.data.opening_message : null,
    isRecord(payload.data) ? payload.data.opening : null,
  ];

  const openingMessage =
    candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0) ?? null;

  return openingMessage ? interpolateTemplateVariables(openingMessage) : null;
}

function buildChatEndText(summary: string) {
  return `${summary}\n\n本轮对话已结束，你可以返回查看能力画像页。`;
}

function formatStructuredChatAnswer(answer: string) {
  const trimmedAnswer = answer.trim();

  if (trimmedAnswer.includes('[对话已收敛]')) {
    const normalizedText = interpolateTemplateVariables(trimmedAnswer.replace('[对话已收敛]', '').trim());

    return {
      ended: true,
      text: buildChatEndText(normalizedText || '我已经完成本轮信息收集，并整理好了阶段性判断。'),
    };
  }

  const parsed = safeJsonParse<Record<string, unknown>>(trimmedAnswer);

  if (!parsed) {
    return {
      ended: false,
      text: interpolateTemplateVariables(trimmedAnswer),
    };
  }

  const evidencePackage = isRecord(parsed.evidence_package) ? parsed.evidence_package : null;
  const observations = Array.isArray(evidencePackage?.structured_observations)
    ? evidencePackage?.structured_observations.filter((item): item is string => typeof item === 'string')
    : [];
  const lines = dedupeStrings([
    typeof parsed.simulation_role === 'string' ? `模拟岗位：${parsed.simulation_role}` : null,
    typeof parsed.simulation_status === 'string' ? `测评状态：${parsed.simulation_status}` : null,
    observations[0] ? `观察结论：${observations[0]}` : null,
    observations[1] ? `补充判断：${observations[1]}` : null,
    typeof parsed.summary === 'string' ? parsed.summary : null,
    typeof parsed.final_summary === 'string' ? parsed.final_summary : null,
    typeof parsed.conclusion === 'string' ? parsed.conclusion : null,
  ]);

  if (lines.length > 0) {
    return {
      ended: true,
      text: buildChatEndText(interpolateTemplateVariables(lines.join('\n'))),
    };
  }

  return {
    ended: true,
    text: buildChatEndText('我已经完成本轮信息收集，并生成了阶段性结论。'),
  };
}

function extractFinalAnswerFromPayload(payload: Record<string, unknown>) {
  const directCandidates = [
    typeof payload.answer === 'string' ? payload.answer : null,
    isRecord(payload.data) && typeof payload.data.answer === 'string' ? payload.data.answer : null,
    isRecord(payload.data) && isRecord(payload.data.outputs) && typeof payload.data.outputs.answer === 'string'
      ? payload.data.outputs.answer
      : null,
  ];

  return directCandidates.find((candidate): candidate is string => Boolean(candidate && candidate.trim()));
}

function parseChatResponse(rawText: string) {
  const parsedJson = safeJsonParse<Record<string, unknown>>(rawText);
  const payloads = parsedJson ? [parsedJson] : parseSsePayloads(rawText);
  let streamedAnswer = '';
  let finalAnswer = '';
  let conversationId = '';
  let messageId = '';

  payloads.forEach((payload) => {
    if (!isRecord(payload)) {
      return;
    }

    const eventName = typeof payload.event === 'string' ? payload.event : '';

    if (eventName === 'message' && typeof payload.answer === 'string') {
      streamedAnswer += payload.answer;
    }

    const finalPayloadAnswer = extractFinalAnswerFromPayload(payload);

    if (!finalAnswer && finalPayloadAnswer) {
      finalAnswer = finalPayloadAnswer;
    }

    if (!conversationId && typeof payload.conversation_id === 'string') {
      conversationId = payload.conversation_id;
    }

    if (!messageId && typeof payload.message_id === 'string') {
      messageId = payload.message_id;
    }
  });

  const rawAnswer = streamedAnswer || finalAnswer || rawText;
  const normalizedAnswer = formatStructuredChatAnswer(rawAnswer);

  return {
    answer: normalizedAnswer.text || '我已经收到你的信息，可以继续说下一点。',
    conversationId,
    ended: normalizedAnswer.ended,
    messageId,
    rawAnswer,
  };
}

function extractWorkflowOutput(payload: unknown): WorkflowOutput | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (isRecord(payload.data) && isRecord(payload.data.outputs) && isRecord(payload.data.outputs.output)) {
    return payload.data.outputs.output as WorkflowOutput;
  }

  if (isRecord(payload.outputs) && isRecord(payload.outputs.output)) {
    return payload.outputs.output as WorkflowOutput;
  }

  if (isRecord(payload.output)) {
    return payload.output as WorkflowOutput;
  }

  return null;
}

function parseWorkflowResponse(rawText: string) {
  const directPayload = safeJsonParse<Record<string, unknown>>(rawText);

  if (directPayload) {
    const directOutput = extractWorkflowOutput(directPayload);

    if (directOutput) {
      return directOutput;
    }
  }

  let latestOutput: WorkflowOutput | null = null;
  const payloads = parseSsePayloads(rawText);

  payloads.forEach((payload) => {
    const output = extractWorkflowOutput(payload);

    if (output) {
      latestOutput = output;
    }
  });

  return latestOutput;
}

function scoreSummary(score: number, highText: string, midText: string, lowText: string) {
  if (score >= 85) {
    return highText;
  }

  if (score >= 70) {
    return midText;
  }

  return lowText;
}

function buildJobSummary(match: WorkflowMatchResult) {
  const pros = match.decision_evidence?.pros ?? [];
  const cons = match.decision_evidence?.cons ?? [];
  const lead = pros.length > 0 ? `优势在${pros.slice(0, 2).join('、')}` : '当前匹配度较高';
  const gap = cons[0] ? `下一步要重点补${cons[0]}` : '建议继续补强项目证明和表达';

  return `${lead}。${gap}。`;
}

function mapWorkflowOutputToProfile(output: WorkflowOutput): EmploymentProfileContent {
  const topMatch = output.match_results?.[0];

  if (!topMatch) {
    return DEFAULT_EMPLOYMENT_PROFILE_CONTENT;
  }

  const scores = topMatch.alignment_score ?? {};
  const basicScore = clampScore(scores.basic ?? 82, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.abilityInsights[0].score);
  const skillScore = clampScore(scores.skill ?? 78, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.abilityInsights[2].score);
  const literacyScore = clampScore(scores.literacy ?? 80, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.abilityInsights[1].score);
  const potentialScore = clampScore(scores.potential ?? 76, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.abilityInsights[4].score);
  const overallScore = clampScore(scores.overall ?? 82, 82);
  const targetJobs = (output.match_results ?? [])
    .slice(0, 3)
    .map((match) => ({
      matchRate: toPercentText(match.alignment_score?.overall ?? 0, '80%'),
      summary: buildJobSummary(match),
      title: match.role_name || '研发岗位',
    }));
  const gapItems = (topMatch.skills_gap_analysis ?? [])
    .map((item) => {
      const segments = [
        item.gap_item,
        item.severity ? `（${item.severity}）` : '',
        item.next_best_action ? `：${item.next_best_action}` : '',
      ];

      return segments.join('');
    })
    .filter((item) => item.trim().length > 0);
  const actionItems = dedupeStrings([
    ...(topMatch.skills_gap_analysis ?? []).map((item) => item.next_best_action),
    topMatch.career_path_support?.vertical_next
      ? `继续向 ${topMatch.career_path_support.vertical_next} 方向补齐进阶能力。`
      : null,
    topMatch.career_path_support?.transfer_path
      ? `保留 ${topMatch.career_path_support.transfer_path} 作为中长期可迁移路径。`
      : null,
    ...(topMatch.career_path_support?.transfer_delta ?? []).map((item) => `额外补强：${item}`),
  ]);
  const strengthTags = dedupeStrings([
    ...(topMatch.decision_evidence?.pros ?? []),
    ...(topMatch.decision_evidence?.raw_quotes ?? []).map((item) => item.replace(/[。，“”"]/g, '').trim()),
  ]);
  const heroDescriptionSegments = dedupeStrings([
    topMatch.decision_evidence?.pros?.length
      ? `当前最突出的匹配点是${topMatch.decision_evidence.pros.slice(0, 2).join('、')}。`
      : null,
    topMatch.decision_evidence?.cons?.[0] ? `接下来要重点补齐${topMatch.decision_evidence.cons[0]}。` : null,
    topMatch.career_path_support?.vertical_next
      ? `如果持续补强，可进一步向${topMatch.career_path_support.vertical_next}延展。`
      : null,
  ]);

  return {
    actionItems: actionItems.length > 0 ? actionItems.slice(0, 4) : DEFAULT_EMPLOYMENT_PROFILE_CONTENT.actionItems,
    abilityInsights: [
      {
        body: scoreSummary(
          basicScore,
          '基础匹配度较高，说明当前课程背景和基础能力能支撑主投岗位起步。',
          '基础条件基本够用，但仍建议继续补关键课程和底层原理表达。',
          '基础匹配偏弱，需要先把课程知识和岗位语言重新对齐。'
        ),
        score: basicScore,
        title: '基础匹配',
      },
      {
        body: scoreSummary(
          literacyScore,
          '职业素养分值稳定，说明协作、表达和推进节奏具备一定岗位适配性。',
          '职业素养整体在线，但在面试表达和主动汇报上还有提升空间。',
          '职业素养仍需加强，尤其要补任务表达和项目复盘能力。'
        ),
        score: literacyScore,
        title: '职业素养',
      },
      {
        body: scoreSummary(
          skillScore,
          '技能贴合度较高，现有项目和工具链已经能形成部分岗位证明。',
          '技能面有基础，但还需要更完整的项目深度来支撑正式投递。',
          '技能贴合度仍偏弱，要优先补最关键的工程化能力链路。'
        ),
        score: skillScore,
        title: '技能贴合',
      },
      {
        body: scoreSummary(
          overallScore,
          '总体匹配表现不错，已经具备从目标岗位切入的现实基础。',
          '总体匹配可用，但还需要通过项目和面试表达把分数继续抬高。',
          '总体匹配暂时偏保守，建议先集中补 1 到 2 个决定性短板。'
        ),
        score: overallScore,
        title: '总体匹配',
      },
      {
        body: scoreSummary(
          potentialScore,
          '成长潜力分值较高，说明继续补强后有明显上升空间。',
          '成长潜力稳定，适合通过持续项目积累逐步拉开差距。',
          '潜力项还没有被充分证明，需要尽快形成更强的成长证据。'
        ),
        score: potentialScore,
        title: '成长潜力',
      },
    ],
    certificates: DEFAULT_EMPLOYMENT_PROFILE_CONTENT.certificates,
    gapItems: gapItems.length > 0 ? gapItems.slice(0, 3) : DEFAULT_EMPLOYMENT_PROFILE_CONTENT.gapItems,
    heroBadge: topMatch.tier ? `${topMatch.tier} 级岗位匹配` : DEFAULT_EMPLOYMENT_PROFILE_CONTENT.heroBadge,
    heroDescription:
      heroDescriptionSegments.join('') || DEFAULT_EMPLOYMENT_PROFILE_CONTENT.heroDescription,
    heroMetrics: [
      { label: '主方向', value: topMatch.role_name || DEFAULT_EMPLOYMENT_PROFILE_CONTENT.heroMetrics[0].value },
      { label: '岗位匹配', value: toPercentText(scores.overall ?? 0, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.heroMetrics[1].value) },
      {
        label: '成长势能',
        value: topMatch.career_path_support?.vertical_next || topMatch.tier || DEFAULT_EMPLOYMENT_PROFILE_CONTENT.heroMetrics[2].value,
      },
    ],
    heroTitle: `你当前更适合先从${topMatch.role_name || '研发岗位'}切入`,
    professionalSkills: DEFAULT_EMPLOYMENT_PROFILE_CONTENT.professionalSkills,
    radarFootnote: `从岗位评分看，你目前在基础匹配、技能贴合和成长潜力上更有优势，下一阶段要重点补强岗位短板与工程证明。`,
    radarValues: [
      clampScore((basicScore + potentialScore) / 2, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.radarValues[0]),
      clampScore(literacyScore, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.radarValues[1]),
      clampScore(skillScore, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.radarValues[2]),
      clampScore((overallScore + literacyScore) / 2, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.radarValues[3]),
      clampScore(potentialScore, DEFAULT_EMPLOYMENT_PROFILE_CONTENT.radarValues[4]),
    ],
    strengthTags: strengthTags.length > 0 ? strengthTags.slice(0, 5) : DEFAULT_EMPLOYMENT_PROFILE_CONTENT.strengthTags,
    targetJobs: targetJobs.length > 0 ? targetJobs : DEFAULT_EMPLOYMENT_PROFILE_CONTENT.targetJobs,
  };
}

async function requestRawText(pathname: string, authorization: string, init?: RequestInit) {

  if (!authorization) {
    throw new Error('缺少 Agent 授权，请配置 EXPO_PUBLIC_AGENT_AUTHORIZATION。');
  }

  const response = await fetch(`${getAgentBaseUrl()}${pathname}`, {
    ...init,
    headers: {
      Authorization: authorization,
      ...(init?.body ? { 'Content-Type': 'application/json' } : null),
      ...(init?.headers ?? {}),
    },
  });
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(buildErrorMessage(response.status, rawText));
  }

  return rawText;
}

export function hasChatAgentAuthorization() {
  return getChatAgentAuthorization().length > 0;
}

export function hasWorkflowAgentAuthorization() {
  return getWorkflowAgentAuthorization().length > 0;
}

export async function fetchAgentOpeningMessage() {
  const rawText = await requestRawText('/parameters', getChatAgentAuthorization());
  const directPayload = safeJsonParse<unknown>(rawText);
  const openingMessage = extractOpeningMessage(directPayload) ?? parseSsePayloads(rawText).map(extractOpeningMessage).find(Boolean);

  return openingMessage ?? null;
}

export async function sendAgentChatMessage({
  conversationId,
  previousAgentOutput,
  query,
}: {
  conversationId?: string;
  previousAgentOutput?: string;
  query: string;
}) {
  const rawText = await requestRawText('/chat-messages', getChatAgentAuthorization(), {
    body: JSON.stringify({
      conversation_id: conversationId,
      inputs: {
        previous_agent_output: previousAgentOutput ?? '',
        resume_text: buildResumeText(),
        student_name: DEFAULT_STUDENT_PROFILE.name,
        survey_result: buildSurveyResult(),
        target_role: DEFAULT_STUDENT_PROFILE.targetJobs[0],
      },
      query,
      response_mode: 'streaming',
      user: DEFAULT_AGENT_USER,
    }),
    method: 'POST',
  });

  return parseChatResponse(rawText) as AgentChatResult;
}

export async function generateEmploymentProfileContent() {
  const workflowAuthorization = getWorkflowAgentAuthorization();

  if (!workflowAuthorization) {
    throw new Error('缺少工作流授权，请配置 EXPO_PUBLIC_WORKFLOW_AGENT_AUTHORIZATION。');
  }

  const rawText = await requestRawText('/workflows/run', workflowAuthorization, {
    body: JSON.stringify({
      inputs: {
        career_aspiration: DEFAULT_STUDENT_PROFILE.careerAspiration,
        full_profile_json: buildFullProfileJson(),
        raw_resume_text: buildResumeText(),
      },
      response_mode: 'streaming',
      user: DEFAULT_AGENT_USER,
    }),
    method: 'POST',
  });
  const workflowOutput = parseWorkflowResponse(rawText);

  if (!workflowOutput) {
    throw new Error('画像工作流未返回可解析结果。');
  }

  return mapWorkflowOutputToProfile(workflowOutput);
}
