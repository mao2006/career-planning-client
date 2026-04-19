import { useEffect, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import JobGraphPage from './job-graph-page';
import SkillGraphPage from './skill-graph-page';
import {
  AlternativeTaskDetailPage,
  TaskDetailPage,
  type TaskAlternativeCandidate,
  type TaskDetailTask,
  type TaskFrequencyMode,
} from './task-detail-page';
import WeeklySchedulePage, { type WeeklyTaskPlacement } from './weekly-schedule-page';

const PERIOD_OPTIONS = [
  '大二下',
  '大二-大三暑假',
  '大三上',
  '大三寒假',
  '大三下',
  '大三-大四暑假',
  '大四上',
  '大四寒假',
  '大四下',
] as const;
const EXPORT_OPTIONS = [
  { id: 'image', label: '图片' },
  { id: 'pdf', label: 'PDF' },
  { id: 'word', label: 'Word' },
] as const;
const COURSE_FILE_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type PeriodOption = (typeof PERIOD_OPTIONS)[number];
type ExportFormat = (typeof EXPORT_OPTIONS)[number]['id'];
type CompletionState = 'done' | 'todo';
type TaskType = 'accumulate' | 'focused';

type TimelineStage = {
  achievement: string;
  anchor: string;
  coreAbility: string;
  current?: boolean;
  duration: string;
  headline: string;
  phase: string;
  role: string;
};

type SkillGroup = {
  items: string[];
  label: string;
};

type LearningPreset = {
  buildTask: string;
  flagshipTask: string;
  focusAbility: string;
  immersionTask: string;
  polishTask: string;
  proofHighlights: string[];
  weekTemplate: string[];
};

type JobPlan = {
  achievements: string;
  competitiveness: string;
  currentStageLabel: string;
  goal: string;
  headerLabel: string;
  id: string;
  jobGraphTrail: string[];
  label: string;
  learning: LearningPreset;
  matchRate: string;
  path: TimelineStage[];
  skillGroups: SkillGroup[];
};

type LearningTask = {
  completion: CompletionState;
  deliverables: string[];
  detail: string;
  id: string;
  importance: number;
  progress?: number;
  scheduled: boolean;
  title: string;
  type: TaskType;
  windowLabel?: string;
};

type LearningPlan = {
  coreGoal: string;
  expectedOutcome: string;
  focusAbility: string;
  tasks: LearningTask[];
};

type WeeklyScheduleDay = {
  items: string[];
  label: string;
};

type TaskReplacementSnapshot = TaskAlternativeCandidate & {
  sourceTitle: string;
};

type TaskStateOverride = {
  alternativeOffset?: number;
  completion?: CompletionState;
  frequency?: TaskFrequencyMode;
  hoursPerCycle?: number;
  progress?: number;
  replacement?: TaskReplacementSnapshot;
  timeEnd?: string;
  timeStart?: string;
};

type ResolvedLearningTask = LearningTask &
  TaskDetailTask & {
    alternativeOffset: number;
  };

const JOB_PLANS: JobPlan[] = [
  {
    id: 'cpp-dev',
    label: 'C++ 开发工程师',
    headerLabel: 'C++ 开发',
    goal: '毕业前完成从课程能力到工程开发能力的过渡，争取拿到 1 份基础研发方向的实习或 offer。',
    matchRate: '78%',
    competitiveness: '84/100',
    achievements: '已完成数据结构课程设计、1 次服务外包大赛立项、1 次团队协作开发。',
    currentStageLabel: '阶段1',
    jobGraphTrail: ['课程项目', '研发实习', '初级 C++ 开发', '中级工程师', '技术组长', '架构师'],
    skillGroups: [
      { label: '基础能力', items: ['C++ 语法', 'STL', '数据结构', '面向对象'] },
      { label: '工程能力', items: ['Linux', 'Git 协作', '调试定位', '模块拆分'] },
      { label: '证明项', items: ['竞赛项目', '研发实习', '项目复盘', '定向简历'] },
    ],
    learning: {
      flagshipTask: '服务外包大赛',
      immersionTask: '进入实验室或企业做一次研发场景体验',
      buildTask: '完成一个 Linux 环境下的 C++ 工程化 mini 项目',
      polishTask: '整理 1 版研发定向简历与项目说明',
      focusAbility: '代码能力、Linux 开发、数据结构与工程协作',
      proofHighlights: ['可展示代码仓库', '项目复盘文档', '面试问答素材'],
      weekTemplate: ['算法题训练', 'C++ 工程实践', '项目复盘沉淀'],
    },
    path: [
      {
        anchor: '2026',
        phase: '阶段1',
        headline: '学校本科阶段学习',
        duration: '约 2 年',
        role: '本科生 / 校园项目参与者',
        coreAbility: '补齐 C++ 基础、数据结构、课程项目协作能力',
        achievement: '完成 2-3 个可展示项目，拿到 1 次竞赛或实习机会',
        current: true,
      },
      {
        anchor: '2028',
        phase: '阶段2',
        headline: '应届入职，成为初级研发工程师',
        duration: '约 2 年',
        role: '初级 C++ 开发工程师',
        coreAbility: '掌握模块开发、代码调试、基础性能优化与协同流程',
        achievement: '独立完成业务模块，参与 1 个正式上线项目',
      },
      {
        anchor: '2030',
        phase: '阶段3',
        headline: '成长为中级开发工程师',
        duration: '约 3 年',
        role: '中级 C++ 开发工程师',
        coreAbility: '多线程、网络编程、需求分析与复杂问题定位',
        achievement: '主导核心模块迭代，代码质量与交付效率明显提升',
      },
      {
        anchor: '2033',
        phase: '阶段4',
        headline: '进阶为高级工程师 / 技术小组长',
        duration: '约 3 年',
        role: '高级开发工程师 / 技术小组长',
        coreAbility: '架构设计、跨团队协作、方案取舍、技术选型',
        achievement: '主导子系统建设，带 2-3 人小组推进项目',
      },
      {
        anchor: '2036+',
        phase: '阶段5',
        headline: '长期发展到技术主管 / 架构师',
        duration: '长期',
        role: '技术主管 / 架构师',
        coreAbility: '系统规划、团队管理、跨部门协同与技术战略',
        achievement: '负责整体系统设计，形成稳定的业务与团队影响力',
      },
    ],
  },
  {
    id: 'test-dev',
    label: '测试开发工程师',
    headerLabel: '测试开发',
    goal: '在毕业前形成自动化测试与质量保障的证明材料，争取进入具备工程规范的互联网或软件团队。',
    matchRate: '74%',
    competitiveness: '81/100',
    achievements: '完成接口测试课程项目、1 次脚本自动化练习、具备较强流程梳理意识。',
    currentStageLabel: '阶段1',
    jobGraphTrail: ['课程实验', '测试实习', '初级测试开发', '质量平台工程师', '测试负责人', '质量架构师'],
    skillGroups: [
      { label: '基础能力', items: ['测试理论', '用例设计', '接口调试', 'SQL 基础'] },
      { label: '工程能力', items: ['Python/Java', '自动化框架', 'CI/CD', '日志分析'] },
      { label: '证明项', items: ['自动化脚本', '测试报告', '平台工具', '缺陷复盘'] },
    ],
    learning: {
      flagshipTask: '接口自动化专项',
      immersionTask: '跟随项目做一次完整测试流程演练',
      buildTask: '搭建自动化测试脚手架并接入基础报告能力',
      polishTask: '整理 1 版测试开发定向简历与缺陷案例说明',
      focusAbility: '测试设计、自动化脚本、质量分析与流程协作',
      proofHighlights: ['自动化仓库', '测试报告样例', '质量复盘素材'],
      weekTemplate: ['接口自动化练习', '缺陷分析', '质量流程梳理'],
    },
    path: [
      {
        anchor: '2026',
        phase: '阶段1',
        headline: '学校阶段完成测试能力入门',
        duration: '约 2 年',
        role: '本科生 / 课程项目执行者',
        coreAbility: '掌握测试理论、接口调试、自动化基础与文档表达',
        achievement: '沉淀 2 个测试案例与 1 套自动化脚本',
        current: true,
      },
      {
        anchor: '2028',
        phase: '阶段2',
        headline: '进入企业，成为初级测试开发',
        duration: '约 2 年',
        role: '初级测试开发工程师',
        coreAbility: '功能测试、接口自动化、缺陷定位、协作沟通',
        achievement: '承担模块测试任务，输出稳定的测试方案与报告',
      },
      {
        anchor: '2030',
        phase: '阶段3',
        headline: '成长为质量平台或资深测试工程师',
        duration: '约 3 年',
        role: '资深测试开发工程师',
        coreAbility: '平台工具建设、持续集成、质量数据分析与专项治理',
        achievement: '主导自动化平台迭代，明显提升回归效率',
      },
      {
        anchor: '2033',
        phase: '阶段4',
        headline: '成为测试负责人或质量专项 owner',
        duration: '约 3 年',
        role: '测试负责人 / 质量专项 owner',
        coreAbility: '质量体系建设、流程设计、跨团队协同与风险控制',
        achievement: '主导质量策略落地，带领小团队推进专项治理',
      },
      {
        anchor: '2036+',
        phase: '阶段5',
        headline: '长期发展到质量架构或平台负责人',
        duration: '长期',
        role: '质量架构师 / 平台负责人',
        coreAbility: '组织级质量体系规划、平台演进、团队管理',
        achievement: '沉淀体系化质量方法，支撑多业务线稳定交付',
      },
    ],
  },
  {
    id: 'embedded',
    label: '嵌入式开发工程师',
    headerLabel: '嵌入式开发',
    goal: '在毕业前拿出硬件控制与底层开发证明，争取进入智能硬件或 IoT 方向团队。',
    matchRate: '72%',
    competitiveness: '79/100',
    achievements: '完成单片机课程实验、具备基础 C/C++ 能力、参加过 1 次硬件类小项目。',
    currentStageLabel: '阶段1',
    jobGraphTrail: ['课程实验', '硬件项目', '嵌入式实习', '嵌入式开发', '高级工程师', '技术负责人'],
    skillGroups: [
      { label: '基础能力', items: ['C 语言', '电路基础', '单片机', '外设驱动'] },
      { label: '工程能力', items: ['RTOS', '调试工具', '接口协议', '硬件联调'] },
      { label: '证明项', items: ['驱动项目', '板级调试', '实习经历', '方案说明'] },
    ],
    learning: {
      flagshipTask: '智能硬件小项目',
      immersionTask: '参与一次板级调试或实验室硬件联调',
      buildTask: '完成一个基于单片机 / RTOS 的驱动控制项目',
      polishTask: '整理 1 版嵌入式方向简历与项目原理说明',
      focusAbility: '底层编程、硬件联调、接口协议与问题定位',
      proofHighlights: ['原理图说明', '调试记录', '驱动代码与演示视频'],
      weekTemplate: ['驱动代码练习', '硬件联调', '原理说明整理'],
    },
    path: [
      {
        anchor: '2026',
        phase: '阶段1',
        headline: '学校阶段夯实底层开发基础',
        duration: '约 2 年',
        role: '本科生 / 硬件项目参与者',
        coreAbility: '掌握 C 语言、单片机、接口协议与基本硬件调试',
        achievement: '完成 2 个硬件方向项目，具备可展示的开发过程',
        current: true,
      },
      {
        anchor: '2028',
        phase: '阶段2',
        headline: '进入企业，成为初级嵌入式开发',
        duration: '约 2 年',
        role: '初级嵌入式开发工程师',
        coreAbility: '驱动开发、板级调试、基础 RTOS 使用与问题定位',
        achievement: '独立负责简单模块开发，完成量产前验证支持',
      },
      {
        anchor: '2030',
        phase: '阶段3',
        headline: '成长为中级嵌入式工程师',
        duration: '约 3 年',
        role: '中级嵌入式开发工程师',
        coreAbility: '复杂驱动开发、系统联调、接口协议优化与稳定性提升',
        achievement: '承担关键模块开发，主导若干联调问题解决',
      },
      {
        anchor: '2033',
        phase: '阶段4',
        headline: '进阶为高级工程师 / 技术骨干',
        duration: '约 3 年',
        role: '高级嵌入式开发工程师',
        coreAbility: '系统方案设计、跨端协作、性能与功耗优化',
        achievement: '负责整机核心模块设计，带领新人完成复杂交付',
      },
      {
        anchor: '2036+',
        phase: '阶段5',
        headline: '长期发展到技术负责人',
        duration: '长期',
        role: '技术负责人 / 平台负责人',
        coreAbility: '平台路线规划、团队协同、技术决策与业务对齐',
        achievement: '统筹关键产品平台建设，持续推进技术迭代',
      },
    ],
  },
];

function createAccumulateTask(
  id: string,
  title: string,
  importance: number,
  progress: number,
  scheduled: boolean,
  detail: string,
  deliverables: string[]
): LearningTask {
  return {
    id,
    title,
    type: 'accumulate',
    importance,
    progress,
    scheduled,
    completion: progress >= 100 ? 'done' : 'todo',
    detail,
    deliverables,
  };
}

function createFocusedTask(
  id: string,
  title: string,
  importance: number,
  windowLabel: string,
  completion: CompletionState,
  detail: string,
  deliverables: string[]
): LearningTask {
  return {
    id,
    title,
    type: 'focused',
    importance,
    windowLabel,
    scheduled: completion === 'done',
    completion,
    detail,
    deliverables,
  };
}

function buildLearningPlan(job: JobPlan, period: PeriodOption): LearningPlan {
  const prefix = `${job.id}-${period}`;

  switch (period) {
    case '大二下':
      return {
        coreGoal: `围绕 ${job.label} 补齐第一批岗位证明`,
        focusAbility: job.learning.focusAbility,
        expectedOutcome: `完成 ${job.learning.flagshipTask} 的阶段成果，输出 1 版 ${job.headerLabel} 定向简历，并明确暑期实践方向。`,
        tasks: [
          createAccumulateTask(
            `${prefix}-flagship`,
            job.learning.flagshipTask,
            4.5,
            50,
            false,
            `把任务目标与 ${job.label} 岗位要求对齐，先做出可被展示和解释的结果。`,
            [...job.learning.proofHighlights, '阶段成果截图'],
          ),
          createFocusedTask(
            `${prefix}-immersion`,
            job.learning.immersionTask,
            4,
            '2026年2月-2026年4月',
            'todo',
            `通过一次真实或模拟的业务场景，理解 ${job.headerLabel} 的工作节奏与协作方式。`,
            ['1 次岗位访谈记录', '1 份场景观察总结'],
          ),
          createFocusedTask(
            `${prefix}-build`,
            job.learning.buildTask,
            4,
            '2026年2月-2026年5月',
            'todo',
            `把课程知识转成可复用的项目成果，重点补齐“能做出来”的证据。`,
            ['项目代码或过程记录', '1 段项目复盘说明'],
          ),
          createAccumulateTask(
            `${prefix}-polish`,
            job.learning.polishTask,
            3.5,
            35,
            true,
            '每周固定 1 次沉淀，把零散经历逐步整理成简历与面试可复述内容。',
            ['简历草稿', '项目 STAR 素材'],
          ),
        ],
      };
    case '大二-大三暑假':
      return {
        coreGoal: `利用暑期集中产出 1 批 ${job.headerLabel} 证明材料`,
        focusAbility: `${job.learning.focusAbility}、自驱推进与结果沉淀`,
        expectedOutcome: `完成 1 个集中产出项目，形成 1 次定向投递尝试，并拿到可继续深化的反馈。`,
        tasks: [
          createFocusedTask(
            `${prefix}-sprint`,
            `10 天冲刺完成：${job.learning.buildTask}`,
            4.5,
            '2026年7月-2026年8月',
            'todo',
            '把一个完整的小项目从需求拆解、实现到复盘连续做完，形成真正可展示的成果。',
            ['项目演示材料', '过程拆解文档'],
          ),
          createAccumulateTask(
            `${prefix}-flagship`,
            `${job.learning.flagshipTask} 结果打磨`,
            4,
            70,
            true,
            '把阶段成果转成更完整的展示材料，补足亮点和可量化结果。',
            ['成果摘要', '亮点说明'],
          ),
          createFocusedTask(
            `${prefix}-投递`,
            `完成 1 轮 ${job.headerLabel} 暑期实习投递`,
            4,
            '2026年7月-2026年8月',
            'todo',
            '通过真实投递验证岗位匹配度，尽快拿到市场反馈而不是闭门打磨。',
            ['投递记录', '岗位 JD 对比表'],
          ),
          createAccumulateTask(
            `${prefix}-resume`,
            job.learning.polishTask,
            3.5,
            60,
            true,
            '继续沉淀简历与问答素材，形成暑期版本的个人证明包。',
            ['简历迭代版', '面试问题清单'],
          ),
        ],
      };
    case '大三上':
      return {
        coreGoal: `把暑期成果沉淀成更稳定的 ${job.headerLabel} 求职资产`,
        focusAbility: `${job.learning.focusAbility}、复盘表达与岗位对齐`,
        expectedOutcome: `形成 1 版完整项目讲述框架，明确接下来一学期的主攻方向和补强节奏。`,
        tasks: [
          createAccumulateTask(
            `${prefix}-project-review`,
            `${job.learning.flagshipTask} 复盘沉淀`,
            4.5,
            80,
            true,
            '把已经做过的事情讲清楚，尤其是问题、动作和结果的逻辑。',
            ['项目复盘稿', '面试讲述提纲'],
          ),
          createFocusedTask(
            `${prefix}-专项`,
            `补齐 1 项关键短板：${job.learning.focusAbility.split('、')[0] ?? job.learning.focusAbility}`,
            4,
            '2026年9月-2026年11月',
            'todo',
            '找出最影响岗位匹配的一项短板，用一个月左右集中补强。',
            ['专项学习记录', '阶段性验证结果'],
          ),
          createFocusedTask(
            `${prefix}-mock`,
            `${job.headerLabel} 岗位模拟问答`,
            3.5,
            '2026年10月-2026年12月',
            'todo',
            '围绕岗位职责准备基础问答，把表达稳定下来。',
            ['10 个高频问题答案', '1 次模拟反馈'],
          ),
          createAccumulateTask(
            `${prefix}-resume`,
            job.learning.polishTask,
            3.5,
            75,
            true,
            '持续迭代简历和项目描述，让信息表达更贴近岗位语言。',
            ['岗位定向简历', '项目一页纸'],
          ),
        ],
      };
    case '大三寒假':
      return {
        coreGoal: `用寒假完成一次短周期强化，把薄弱项补到可投递水平`,
        focusAbility: `${job.learning.focusAbility}、短周期交付能力`,
        expectedOutcome: `完成 1 次寒假集中补强，明确大三下的投递与实践节奏。`,
        tasks: [
          createFocusedTask(
            `${prefix}-winter-project`,
            `寒假项目冲刺：${job.learning.buildTask}`,
            4.5,
            '2027年1月-2027年2月',
            'todo',
            '利用连续时间补齐工程细节，做出比学期内更完整的成果。',
            ['项目里程碑清单', '可运行版本'],
          ),
          createAccumulateTask(
            `${prefix}-notes`,
            '整理岗位知识笔记与错题清单',
            4,
            55,
            true,
            '把之前学过的内容做二次梳理，为下学期继续推进留出清晰入口。',
            ['知识笔记', '错题/问题清单'],
          ),
          createFocusedTask(
            `${prefix}-访谈`,
            `完成 2 次 ${job.headerLabel} 岗位交流`,
            3.5,
            '2027年1月-2027年2月',
            'todo',
            '通过学长或从业者反馈校正自己的准备方向。',
            ['岗位访谈纪要', '调整建议列表'],
          ),
          createAccumulateTask(
            `${prefix}-resume`,
            job.learning.polishTask,
            3.5,
            80,
            true,
            '把寒假产出同步沉淀到简历和讲述材料里。',
            ['寒假版本简历', '项目讲述提纲'],
          ),
        ],
      };
    case '大三下':
      return {
        coreGoal: `围绕正式投递与深度实践推进 ${job.headerLabel} 方向准备`,
        focusAbility: `${job.learning.focusAbility}、结果证明与面试表现`,
        expectedOutcome: `至少完成 1 次正式投递或实践尝试，拿到一轮较真实的反馈。`,
        tasks: [
          createAccumulateTask(
            `${prefix}-flagship`,
            `${job.learning.flagshipTask} 最终完善`,
            4.5,
            90,
            true,
            '把之前推进的核心任务补到可展示、可面试复述、可接受追问的程度。',
            ['最终展示稿', '数据或过程亮点'],
          ),
          createFocusedTask(
            `${prefix}-实践`,
            `尝试 1 次 ${job.headerLabel} 实习 / 实践机会`,
            4.5,
            '2027年3月-2027年6月',
            'todo',
            '不只停留在准备，必须通过真实环境验证自己的匹配度。',
            ['投递与反馈记录', '实践总结'],
          ),
          createFocusedTask(
            `${prefix}-mock`,
            '完成 2 轮模拟面试或作品讲解',
            4,
            '2027年4月-2027年6月',
            'todo',
            '把项目和能力表达练熟，让输出不再依赖临场发挥。',
            ['模拟反馈表', '改进清单'],
          ),
          createAccumulateTask(
            `${prefix}-resume`,
            job.learning.polishTask,
            3.5,
            88,
            true,
            '把真实反馈持续写回到简历和项目表达里。',
            ['最新简历', '面试话术卡片'],
          ),
        ],
      };
    case '大三-大四暑假':
      return {
        coreGoal: `暑期集中验证就业方向，为秋招前形成强证明包`,
        focusAbility: `${job.learning.focusAbility}、高强度推进与求职节奏管理`,
        expectedOutcome: `形成可直接进入秋招的核心材料组合，包括简历、项目说明和问答底稿。`,
        tasks: [
          createFocusedTask(
            `${prefix}-deliver`,
            `集中交付：${job.learning.buildTask}`,
            4.5,
            '2027年7月-2027年8月',
            'todo',
            '把最重要的项目做到可交付状态，准备支撑后续秋招讲述。',
            ['演示版本', '技术亮点摘要'],
          ),
          createFocusedTask(
            `${prefix}-intern-apply`,
            `完成多轮 ${job.headerLabel} 定向投递`,
            4.5,
            '2027年7月-2027年8月',
            'todo',
            '集中处理投递、笔试、面试反馈，快速迭代策略。',
            ['岗位投递表', '反馈分析'],
          ),
          createAccumulateTask(
            `${prefix}-faq`,
            '整理高频面试问题与案例答案',
            4,
            70,
            true,
            '把项目与能力表达沉淀成稳定模板，避免每次都临时组织语言。',
            ['问题答案库', '案例结构模板'],
          ),
          createAccumulateTask(
            `${prefix}-resume`,
            job.learning.polishTask,
            4,
            95,
            true,
            '把暑期新增成果同步到简历和讲述材料，形成秋招版本。',
            ['秋招简历版', '项目讲述终版'],
          ),
        ],
      };
    case '大四上':
      return {
        coreGoal: `围绕秋招节奏稳定输出，争取尽快拿到 ${job.headerLabel} 方向结果`,
        focusAbility: `${job.learning.focusAbility}、面试应答与反馈迭代`,
        expectedOutcome: `完成多轮正式面试，形成岗位匹配与个人表达的闭环。`,
        tasks: [
          createFocusedTask(
            `${prefix}-delivery`,
            '秋招阶段持续投递与面试',
            4.5,
            '2027年9月-2027年11月',
            'todo',
            '把投递、笔试、面试和复盘串成一个闭环，提高命中率。',
            ['面试复盘表', '岗位优先级列表'],
          ),
          createAccumulateTask(
            `${prefix}-qa`,
            '每周迭代一次面试问答库',
            4,
            65,
            true,
            '基于真实面试题持续更新案例答案，缩短准备时间。',
            ['问答库迭代记录', '薄弱题型清单'],
          ),
          createFocusedTask(
            `${prefix}-project-explain`,
            '强化核心项目讲述与追问应对',
            4,
            '2027年9月-2027年12月',
            'todo',
            '针对项目细节、决策逻辑和结果指标准备追问答案。',
            ['项目问答清单', '版本对比说明'],
          ),
          createAccumulateTask(
            `${prefix}-resume`,
            '维护正式投递版简历',
            3.5,
            100,
            true,
            '简历版本已经稳定，后续按反馈微调。',
            ['正式简历终版'],
          ),
        ],
      };
    case '大四寒假':
      return {
        coreGoal: `根据前一阶段反馈查漏补缺，集中处理剩余关键短板`,
        focusAbility: `${job.learning.focusAbility}、查漏补缺与持续输出`,
        expectedOutcome: `补齐 1 项最影响结果的短板，让后续补招 / 春招准备更稳。`,
        tasks: [
          createFocusedTask(
            `${prefix}-gap`,
            '针对薄弱项完成一次集中补强',
            4.5,
            '2028年1月-2028年2月',
            'todo',
            '把影响结果最大的一块能力单独拉出来做一轮集中处理。',
            ['专项补强结果', '前后差异说明'],
          ),
          createAccumulateTask(
            `${prefix}-review`,
            '整理前期面试与投递反馈',
            4,
            85,
            true,
            '把零散反馈汇总成问题列表，为春招或后续机会服务。',
            ['反馈问题库', '对应改进动作'],
          ),
          createFocusedTask(
            `${prefix}-refresh`,
            `刷新 ${job.headerLabel} 方向展示材料`,
            4,
            '2028年1月-2028年2月',
            'todo',
            '把新补强的内容同步到简历、项目说明和问答库里。',
            ['材料更新版', '新亮点总结'],
          ),
          createAccumulateTask(
            `${prefix}-habits`,
            '保持每周岗位信息跟踪',
            3.5,
            60,
            true,
            '维持对目标岗位和行业机会的关注，避免错过合适窗口。',
            ['岗位观察清单'],
          ),
        ],
      };
    case '大四下':
      return {
        coreGoal: `稳定收尾求职准备，并为入职过渡做好内容交接`,
        focusAbility: `${job.learning.focusAbility}、岗位适应与长期规划意识`,
        expectedOutcome: `完成毕业前的最后一次材料整理，明确入职后的前三个月适应计划。`,
        tasks: [
          createFocusedTask(
            `${prefix}-transition`,
            '梳理入职前 90 天适应计划',
            4.5,
            '2028年3月-2028年6月',
            'todo',
            '从毕业准备切换到岗位适应，提前明确入职后的学习重点。',
            ['90 天计划', '优先学习清单'],
          ),
          createAccumulateTask(
            `${prefix}-archive`,
            '整理完整的项目与求职材料归档',
            4,
            90,
            true,
            '把已有成果沉淀成长期可复用的资料，方便后续持续迭代。',
            ['项目归档包', '求职资料合集'],
          ),
          createFocusedTask(
            `${prefix}-reflection`,
            '完成一次毕业前职业规划复盘',
            3.5,
            '2028年4月-2028年5月',
            'todo',
            '回顾这段规划路径，明确入职后继续补强的方向。',
            ['复盘总结', '长期发展清单'],
          ),
          createAccumulateTask(
            `${prefix}-network`,
            '维持行业信息跟踪与同伴交流',
            3,
            55,
            true,
            '保持对行业变化的感知，避免入职后陷入被动。',
            ['交流记录', '信息订阅清单'],
          ),
        ],
      };
  }
}

function buildWeeklySchedule(job: JobPlan, period: PeriodOption): WeeklyScheduleDay[] {
  const [blockA, blockB, blockC] = job.learning.weekTemplate;

  switch (period) {
    case '大二下':
      return [
        { label: '周一', items: [`19:00-20:30 ${blockA}`, '20:40-21:20 课堂/项目问题清单整理'] },
        { label: '周二', items: [`19:30-21:00 ${blockB}`, '21:00-21:20 Git 提交与复盘'] },
        { label: '周三', items: ['20:00-20:40 岗位 JD 对齐', '20:40-21:20 简历素材沉淀'] },
        { label: '周四', items: [`19:00-20:30 ${blockC}`, '20:40-21:10 访谈或资料阅读'] },
        { label: '周六', items: ['14:00-17:00 核心任务集中推进', '19:00-19:40 周复盘'] },
      ];
    case '大二-大三暑假':
      return [
        { label: '周一', items: ['09:30-11:30 暑期项目冲刺', '15:00-16:00 日报复盘'] },
        { label: '周二', items: [`10:00-11:30 ${blockA}`, '19:30-20:30 简历/投递维护'] },
        { label: '周三', items: [`09:30-11:30 ${blockB}`, '15:30-16:30 问题定位'] },
        { label: '周五', items: ['10:00-11:00 模拟面试', '20:00-20:40 面试反馈整理'] },
        { label: '周日', items: ['15:00-17:00 项目里程碑检查', '20:00-20:30 下周安排'] },
      ];
    default:
      return [
        { label: '周一', items: [`19:00-20:20 ${blockA}`, '20:30-21:00 复盘'] },
        { label: '周三', items: [`19:00-20:30 ${blockB}`, '20:40-21:10 简历/材料迭代'] },
        { label: '周五', items: [`18:50-20:20 ${blockC}`, '20:30-21:00 问题清单整理'] },
        { label: '周六', items: ['14:00-16:30 深度任务推进', '19:00-19:40 本周成果沉淀'] },
      ];
  }
}

const PERIOD_MONTH_OPTIONS: Record<PeriodOption, string[]> = {
  '大二下': ['2026年2月', '2026年3月', '2026年4月', '2026年5月', '2026年6月', '2026年7月'],
  '大二-大三暑假': ['2026年7月', '2026年8月', '2026年9月'],
  '大三上': ['2026年9月', '2026年10月', '2026年11月', '2026年12月', '2027年1月'],
  '大三寒假': ['2027年1月', '2027年2月', '2027年3月'],
  '大三下': ['2027年3月', '2027年4月', '2027年5月', '2027年6月', '2027年7月'],
  '大三-大四暑假': ['2027年7月', '2027年8月', '2027年9月'],
  '大四上': ['2027年9月', '2027年10月', '2027年11月', '2027年12月', '2028年1月'],
  '大四寒假': ['2028年1月', '2028年2月', '2028年3月'],
  '大四下': ['2028年3月', '2028年4月', '2028年5月', '2028年6月', '2028年7月'],
};

function parseMonthLabel(label: string) {
  const match = label.match(/(\d{4})年(\d{1,2})月/);

  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10) * 100 + Number.parseInt(match[2], 10);
}

function parseTaskWindowLabel(windowLabel?: string) {
  if (!windowLabel) {
    return null;
  }

  const match = windowLabel.match(/(\d{4}年\d{1,2}月)-(\d{4}年\d{1,2}月)/);

  if (!match) {
    return null;
  }

  return {
    timeStart: match[1],
    timeEnd: match[2],
  };
}

function uniqueMonthOptions(options: string[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (seen.has(option)) {
      return false;
    }

    seen.add(option);
    return true;
  });
}

function buildTimeOptions(period: PeriodOption, extraLabels: string[] = []) {
  return uniqueMonthOptions([...PERIOD_MONTH_OPTIONS[period], ...extraLabels]).sort((first, second) => {
    const firstValue = parseMonthLabel(first) ?? 0;
    const secondValue = parseMonthLabel(second) ?? 0;

    return firstValue - secondValue;
  });
}

function buildDefaultTaskTiming(task: LearningTask, period: PeriodOption) {
  const parsedRange = parseTaskWindowLabel(task.windowLabel);
  const periodOptions = buildTimeOptions(period, parsedRange ? [parsedRange.timeStart, parsedRange.timeEnd] : []);
  const focusedFallbackEndIndex = Math.min(periodOptions.length - 1, 2);
  const accumulateFallbackEndIndex = Math.min(periodOptions.length - 1, 3);

  return {
    timeStart: parsedRange?.timeStart ?? periodOptions[0],
    timeEnd:
      parsedRange?.timeEnd ??
      periodOptions[task.type === 'focused' ? focusedFallbackEndIndex : accumulateFallbackEndIndex],
    frequency: task.type === 'accumulate' ? ('每周' as const) : undefined,
    hoursPerCycle: task.type === 'accumulate' ? 3 : undefined,
  };
}

function resolveTaskWithOverride(task: LearningTask, override: TaskStateOverride | undefined, period: PeriodOption): ResolvedLearningTask {
  const defaultTiming = buildDefaultTaskTiming(task, period);
  const replacement = override?.replacement;
  const resolvedType = replacement?.type ?? task.type;
  const resolvedTitle = replacement?.title ?? task.title;
  const resolvedImportance = replacement?.importance ?? task.importance;
  const resolvedDetail = replacement?.detail ?? task.detail;
  const resolvedDeliverables = replacement?.deliverables ?? task.deliverables;
  const resolvedProgress =
    resolvedType === 'accumulate'
      ? Math.max(0, Math.min(override?.progress ?? (replacement ? 0 : task.progress ?? 0), 100))
      : undefined;
  const resolvedCompletion =
    resolvedType === 'accumulate'
      ? resolvedProgress === 100
        ? 'done'
        : 'todo'
      : override?.completion ?? (replacement ? 'todo' : task.completion);

  return {
    ...task,
    completion: resolvedCompletion,
    deliverables: resolvedDeliverables,
    detail: resolvedDetail,
    hoursPerCycle: resolvedType === 'accumulate' ? override?.hoursPerCycle ?? replacement?.hoursPerCycle ?? defaultTiming.hoursPerCycle : undefined,
    id: task.id,
    importance: resolvedImportance,
    progress: resolvedProgress,
    replacementOriginTitle: replacement?.sourceTitle,
    scheduled: task.scheduled,
    timeEnd: override?.timeEnd ?? replacement?.timeEnd ?? defaultTiming.timeEnd,
    timeStart: override?.timeStart ?? replacement?.timeStart ?? defaultTiming.timeStart,
    title: resolvedTitle,
    type: resolvedType,
    windowLabel: task.windowLabel,
    frequency: resolvedType === 'accumulate' ? override?.frequency ?? replacement?.frequency ?? defaultTiming.frequency : undefined,
    alternativeOffset: override?.alternativeOffset ?? 0,
  };
}

function buildAlternativePool(task: ResolvedLearningTask, job: JobPlan): TaskAlternativeCandidate[] {
  const sharedTiming = {
    timeStart: task.timeStart,
    timeEnd: task.timeEnd,
    frequency: task.type === 'accumulate' ? task.frequency ?? '每周' : undefined,
    hoursPerCycle: task.type === 'accumulate' ? task.hoursPerCycle ?? 3 : undefined,
  };

  const focusedAlternativesByJob: Record<JobPlan['id'], Array<Omit<TaskAlternativeCandidate, 'frequency' | 'hoursPerCycle' | 'timeEnd' | 'timeStart' | 'type'>>> = {
    'cpp-dev': [
      {
        id: `${task.id}-alt-hackathon`,
        title: '研发竞赛冲刺',
        importance: 4.5,
        reason: '更容易在短时间里形成代码、答辩和团队协作三类证明材料。',
        detail: '围绕目标岗位要求挑选一个偏工程实现的竞赛主题，重点突出模块 owner、问题定位和结果展示。',
        deliverables: ['竞赛项目仓库', '过程拆解文档', '结果答辩材料'],
      },
      {
        id: `${task.id}-alt-lab`,
        title: '实验室研发项目',
        importance: 4.5,
        reason: '比纯课程任务更接近真实研发环境，更适合强化岗位语境。',
        detail: '优先选择能接触 Linux、模块协作和调试流程的实验室项目，把过程写成岗位化表达。',
        deliverables: ['实验室项目说明', '核心模块记录', '阶段复盘'],
      },
      {
        id: `${task.id}-alt-open-source`,
        title: '开源协作任务',
        importance: 4,
        reason: '可以补齐代码协作与问题收敛能力，也更利于面试讲述。',
        detail: '选择一个难度适中的开源项目，从 issue 分析、修复到提交流程完整走通一次。',
        deliverables: ['PR 记录', '问题定位笔记', '协作文档'],
      },
      {
        id: `${task.id}-alt-bootcamp`,
        title: '企业实训项目',
        importance: 4,
        reason: '如果现有任务推进资源不足，实训项目更容易在短周期内获得外部证明。',
        detail: '优先选和目标岗位贴近的企业项目，重点沉淀需求拆解、模块交付和结果汇报。',
        deliverables: ['项目说明', '成果展示页', '复盘总结'],
      },
    ],
    'test-dev': [
      {
        id: `${task.id}-alt-automation`,
        title: '自动化专项实战',
        importance: 4.5,
        reason: '相比泛化任务，更容易直接体现测试开发岗位的核心工程能力。',
        detail: '围绕一个完整业务流做自动化脚手架、执行报告和失败处理，形成工程化闭环。',
        deliverables: ['自动化仓库', '执行报告', '失败案例总结'],
      },
      {
        id: `${task.id}-alt-quality`,
        title: '质量治理项目',
        importance: 4,
        reason: '更能体现质量思维和跨角色协作，不只停留在执行测试。',
        detail: '挑一个模块做质量问题收集、回归策略设计和指标跟踪，形成专项治理记录。',
        deliverables: ['质量周报', '缺陷分析表', '策略说明'],
      },
      {
        id: `${task.id}-alt-performance`,
        title: '性能测试训练营',
        importance: 4,
        reason: '可作为普通测试任务的等价升级版，更有区分度。',
        detail: '以压测、指标分析和瓶颈定位为主线做一次小型性能专项，重点沉淀方法论。',
        deliverables: ['压测脚本', '性能报告', '优化建议'],
      },
      {
        id: `${task.id}-alt-platform`,
        title: '质量平台共建',
        importance: 4,
        reason: '如果目标是测试开发，这类任务更容易把工具化与平台化能力体现出来。',
        detail: '从小工具或质量看板切入，强调复用性、接入方式和落地价值。',
        deliverables: ['工具页面', '接入说明', '复盘记录'],
      },
    ],
    embedded: [
      {
        id: `${task.id}-alt-driver`,
        title: '驱动开发小项目',
        importance: 4.5,
        reason: '比泛化学习任务更贴近嵌入式岗位的底层能力要求。',
        detail: '围绕一个具体外设做初始化、读写与异常处理，重点记录驱动逻辑和验证过程。',
        deliverables: ['驱动代码', '调试记录', '接口说明'],
      },
      {
        id: `${task.id}-alt-rtos`,
        title: 'RTOS 场景实验',
        importance: 4.5,
        reason: '能更直接体现系统调度、任务拆分和实时性理解。',
        detail: '选择一个 RTOS 实验场景，围绕任务调度、资源管理和异常定位形成完整过程。',
        deliverables: ['实验代码', '系统流程图', '问题分析笔记'],
      },
      {
        id: `${task.id}-alt-iot`,
        title: 'IoT 接入实践',
        importance: 4,
        reason: '更容易把设备端开发和产品场景联系起来，适合替代单点实验类任务。',
        detail: '完成一次设备联网、数据上报或远程控制的实践，把端到端链路写清楚。',
        deliverables: ['联网演示', '接入日志', '场景说明'],
      },
      {
        id: `${task.id}-alt-debug`,
        title: '联调问题收敛专项',
        importance: 4,
        reason: '如果当前任务落地困难，联调专项更容易形成真实可讲的问题解决案例。',
        detail: '围绕一类整机问题，记录现象、假设、验证与收敛过程，形成方法论总结。',
        deliverables: ['问题定位报告', '验证记录', '复盘文档'],
      },
    ],
  };

  const accumulateAlternativesByJob: Record<JobPlan['id'], Array<Omit<TaskAlternativeCandidate, 'frequency' | 'hoursPerCycle' | 'timeEnd' | 'timeStart' | 'type'>>> = {
    'cpp-dev': [
      {
        id: `${task.id}-alt-algo`,
        title: '算法与数据结构精练计划',
        importance: 4,
        reason: '更适合作为长期滚动任务，用来稳定补齐基础短板。',
        detail: '按周拆分刷题、复杂度复盘和题型总结，让基础能力持续可见地增长。',
        deliverables: ['刷题记录', '题型总结', '错题复盘'],
      },
      {
        id: `${task.id}-alt-linux`,
        title: 'Linux 工程实操日志',
        importance: 4,
        reason: '相比泛化学习，更贴近研发岗位实际使用场景。',
        detail: '围绕命令行、构建、调试和脚本工具做连续记录，把环境操作变成稳定能力。',
        deliverables: ['操作日志', '问题清单', '环境搭建文档'],
      },
      {
        id: `${task.id}-alt-jd`,
        title: '岗位 JD 拆解计划',
        importance: 3.5,
        reason: '适合在没有大块时间时持续推进，帮助任务和岗位要求对齐。',
        detail: '每周拆 3 到 5 个目标岗位 JD，提炼高频关键词并反向补材料。',
        deliverables: ['JD 对照表', '补强清单', '简历改写记录'],
      },
      {
        id: `${task.id}-alt-reading`,
        title: '工程文章精读笔记',
        importance: 3.5,
        reason: '适合作为替代的轻量积累任务，能持续提升技术表达。',
        detail: '围绕 C++ 工程、调试和系统设计主题做文章精读，每篇都输出结构化笔记。',
        deliverables: ['文章笔记', '关键概念卡片', '口头讲解提纲'],
      },
    ],
    'test-dev': [
      {
        id: `${task.id}-alt-cases`,
        title: '接口用例库整理',
        importance: 4,
        reason: '适合替代零散学习任务，更能长期沉淀测试设计能力。',
        detail: '将接口场景按正常流、异常流和风险点分类，形成一套可复用的用例模板。',
        deliverables: ['用例库', '边界清单', '模板说明'],
      },
      {
        id: `${task.id}-alt-bug`,
        title: '缺陷复盘笔记',
        importance: 4,
        reason: '更强调质量思维和问题归因，适合持续积累。',
        detail: '围绕线上或项目缺陷做复盘，拆清原因、影响和预防方案。',
        deliverables: ['缺陷归档', '复盘文档', '预防策略'],
      },
      {
        id: `${task.id}-alt-ci`,
        title: 'CI 脚本迭代',
        importance: 3.5,
        reason: '如果当前任务难以推进，改成 CI 方向的积累任务更容易形成工程成果。',
        detail: '每周优化一部分执行脚本、报告或任务编排，让自动化逐步接近流水线。',
        deliverables: ['脚本版本记录', '接入说明', '问题清单'],
      },
      {
        id: `${task.id}-alt-log`,
        title: '日志分析训练',
        importance: 3.5,
        reason: '可以作为低门槛但高价值的替代积累任务。',
        detail: '按周收集失败日志和问题案例，训练从现象到结论的结构化分析能力。',
        deliverables: ['日志分析卡片', '定位结论汇总', '方法论笔记'],
      },
    ],
    embedded: [
      {
        id: `${task.id}-alt-register`,
        title: '寄存器阅读计划',
        importance: 4,
        reason: '适合作为长期积累任务，能稳步强化底层理解。',
        detail: '每周阅读一部分芯片手册或寄存器说明，并输出结构化摘录与示例代码。',
        deliverables: ['寄存器笔记', '示例代码', '概念卡片'],
      },
      {
        id: `${task.id}-alt-protocol`,
        title: '协议抓包记录',
        importance: 4,
        reason: '更贴近调试和接口联调场景，适合持续滚动推进。',
        detail: '围绕串口、I2C、SPI 或网络协议记录通信过程和异常分析结论。',
        deliverables: ['抓包记录', '协议说明', '异常归档'],
      },
      {
        id: `${task.id}-alt-driver-reading`,
        title: '驱动源码精读',
        importance: 3.5,
        reason: '如果当前没有硬件条件，这类替代任务更容易落地但仍然有效。',
        detail: '每周精读一段驱动源码，拆解初始化、资源管理和错误处理逻辑。',
        deliverables: ['源码笔记', '流程图', '关键点总结'],
      },
      {
        id: `${task.id}-alt-debug-cases`,
        title: '调试案例复盘',
        importance: 3.5,
        reason: '适合做成轻量但连续的积累型任务，帮助建立问题定位习惯。',
        detail: '持续收集调试案例，按现象、原因、验证路径整理成问题库。',
        deliverables: ['案例库', '验证路径清单', '复盘结论'],
      },
    ],
  };

  const sourcePool = task.type === 'focused' ? focusedAlternativesByJob[job.id] : accumulateAlternativesByJob[job.id];

  return sourcePool.map((item) => ({
    ...item,
    type: task.type,
    timeStart: task.timeStart,
    timeEnd: task.timeEnd,
    frequency: task.type === 'accumulate' ? sharedTiming.frequency : undefined,
    hoursPerCycle: task.type === 'accumulate' ? sharedTiming.hoursPerCycle : undefined,
  }));
}

function pickAlternatives(pool: TaskAlternativeCandidate[], offset: number) {
  if (pool.length <= 2) {
    return pool;
  }

  const safeOffset = offset % pool.length;

  return Array.from({ length: 2 }, (_, index) => pool[(safeOffset + index) % pool.length]);
}

function ImportanceStars({ size = 18, value }: { size?: number; value: number }) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const filledThreshold = index + 1;
    const halfThreshold = index + 0.5;
    let name: keyof typeof Ionicons.glyphMap = 'star-outline';

    if (value >= filledThreshold) {
      name = 'star';
    } else if (value >= halfThreshold) {
      name = 'star-half';
    }

    return (
      <Ionicons
        key={`star-${index}`}
        color={name === 'star-outline' ? 'rgba(146, 153, 161, 1)' : 'rgba(12, 94, 63, 1)'}
        name={name}
        size={size}
        style={styles.starIcon}
      />
    );
  });

  return <View style={styles.starRow}>{stars}</View>;
}

function DetailPageModal({
  children,
  subtitle,
  title,
  visible,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
  subtitle?: string;
  title: string;
  visible: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={styles.detailModalScreen}>
        <StatusBar style="dark" />

        <View style={[styles.detailModalHeader, { paddingTop: insets.top + 14 }]}>
          <Pressable hitSlop={10} onPress={onClose} style={styles.detailModalCloseButton}>
            <MaterialIcons color="rgba(64, 73, 82, 1)" name="arrow-back-ios-new" size={20} />
          </Pressable>

          <View style={styles.detailModalHeaderTextWrap}>
            <Text style={styles.detailModalTitle}>{title}</Text>
            {subtitle ? <Text style={styles.detailModalSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.detailModalContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

type PlanPageProps = {
  onDetailVisibilityChange?: (visible: boolean) => void;
};

export default function PlanPage({ onDetailVisibilityChange }: PlanPageProps) {
  const [activeSubview, setActiveSubview] = useState<
    'alternativeTaskDetail' | 'jobGraph' | 'main' | 'skillGraph' | 'taskDetail' | 'weeklySchedule'
  >('main');
  const [selectedJobId, setSelectedJobId] = useState(JOB_PLANS[0].id);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(PERIOD_OPTIONS[0]);
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [pathExpanded, setPathExpanded] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeAlternativeId, setActiveAlternativeId] = useState<string | null>(null);
  const [taskDetailReturnView, setTaskDetailReturnView] = useState<'main' | 'weeklySchedule'>('main');
  const [importedScheduleName, setImportedScheduleName] = useState('');
  const [taskOverridesByKey, setTaskOverridesByKey] = useState<Record<string, Record<string, TaskStateOverride>>>({});
  const [weeklyTaskPlacementsByKey, setWeeklyTaskPlacementsByKey] = useState<Record<string, WeeklyTaskPlacement[]>>({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>('pdf');
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const currentJob = JOB_PLANS.find((item) => item.id === selectedJobId) ?? JOB_PLANS[0];
  const currentBaseLearningPlan = buildLearningPlan(currentJob, selectedPeriod);
  const currentScheduleStorageKey = `${selectedJobId}-${selectedPeriod}`;
  const currentTaskOverrides = taskOverridesByKey[currentScheduleStorageKey] ?? {};
  const currentLearningPlan = {
    ...currentBaseLearningPlan,
    tasks: currentBaseLearningPlan.tasks.map((task) => resolveTaskWithOverride(task, currentTaskOverrides[task.id], selectedPeriod)),
  };
  const currentTaskMap = Object.fromEntries(currentLearningPlan.tasks.map((task) => [task.id, task]));
  const currentBaseTaskMap = Object.fromEntries(currentBaseLearningPlan.tasks.map((task) => [task.id, task]));
  const activeTask = activeTaskId ? (currentTaskMap[activeTaskId] as ResolvedLearningTask | undefined) ?? null : null;
  const activeTaskAlternativePool = activeTask ? buildAlternativePool(activeTask, currentJob) : [];
  const activeTaskAlternatives = activeTask ? pickAlternatives(activeTaskAlternativePool, activeTask.alternativeOffset) : [];
  const activeAlternative =
    activeAlternativeId && activeTask
      ? activeTaskAlternativePool.find((alternative) => alternative.id === activeAlternativeId) ?? null
      : null;
  const activeTimeOptions = activeTask
    ? buildTimeOptions(selectedPeriod, [activeTask.timeStart, activeTask.timeEnd, ...(activeAlternative ? [activeAlternative.timeStart, activeAlternative.timeEnd] : [])])
    : buildTimeOptions(selectedPeriod);
  const sortedTasks = [...currentLearningPlan.tasks].sort((a, b) => b.importance - a.importance);
  const contentWidth = Math.min(screenWidth - 24, 430);
  const headerSelectorWidth = 168;
  const bottomReservedSpace = 168 + Math.max(insets.bottom - 16, 2);
  const contentLeft = (screenWidth - contentWidth) / 2;
  const floatingJobDropdownLeft = contentLeft + contentWidth - headerSelectorWidth;
  const floatingJobDropdownTop = insets.top + 18 + 48;

  useEffect(() => {
    onDetailVisibilityChange?.(activeSubview !== 'main');
  }, [activeSubview, onDetailVisibilityChange]);

  useEffect(() => {
    return () => {
      onDetailVisibilityChange?.(false);
    };
  }, [onDetailVisibilityChange]);

  const closeMenus = () => {
    setJobDropdownOpen(false);
    setPeriodDropdownOpen(false);
  };

  const updateTaskOverride = (taskId: string, updater: (current: TaskStateOverride | undefined) => TaskStateOverride) => {
    setTaskOverridesByKey((current) => ({
      ...current,
      [currentScheduleStorageKey]: {
        ...(current[currentScheduleStorageKey] ?? {}),
        [taskId]: updater(current[currentScheduleStorageKey]?.[taskId]),
      },
    }));
  };

  const openTaskDetail = (taskId: string, returnView: 'main' | 'weeklySchedule') => {
    setTaskDetailReturnView(returnView);
    setActiveTaskId(taskId);
    setActiveAlternativeId(null);
    setActiveSubview('taskDetail');
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    setPathExpanded(false);
    setActiveTaskId(null);
    setActiveAlternativeId(null);
    closeMenus();
  };

  const handlePeriodSelect = (period: PeriodOption) => {
    setSelectedPeriod(period);
    setActiveTaskId(null);
    setActiveAlternativeId(null);
    closeMenus();
  };

  const handleImportSchedule = async (openAfterImport = false) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: COURSE_FILE_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      setImportedScheduleName(asset.name || '本学期课表');
      setWeeklyTaskPlacementsByKey((current) => {
        const next = { ...current };

        delete next[currentScheduleStorageKey];

        return next;
      });

      if (openAfterImport) {
        setActiveSubview('weeklySchedule');
        return;
      }

      Alert.alert('课表已导入', '已根据你当前的学习计划生成个性化周表，现在可以点击“查看周表”。');
    } catch (error) {
      Alert.alert('导入失败', '暂时无法读取课表文件，请稍后重试。');
    }
  };

  const handleSchedulePress = async () => {
    closeMenus();

    if (importedScheduleName) {
      setActiveSubview('weeklySchedule');
      return;
    }

    await handleImportSchedule(true);
  };

  const handleExportConfirm = () => {
    setExportModalVisible(false);
    Alert.alert(
      '导出入口已就绪',
      `已选择导出为${EXPORT_OPTIONS.find((item) => item.id === selectedExportFormat)?.label ?? 'PDF'}。当前版本已完成格式选择入口，下一层再接入真实文件生成与目录保存。`,
    );
  };

  if (activeSubview === 'jobGraph') {
    return <JobGraphPage onBack={() => setActiveSubview('main')} planJob={currentJob} />;
  }

  if (activeSubview === 'skillGraph') {
    return <SkillGraphPage onBack={() => setActiveSubview('main')} planJob={currentJob} />;
  }

  if (activeSubview === 'taskDetail' && activeTask) {
    return (
      <TaskDetailPage
        key={activeTask.id}
        alternatives={activeTaskAlternatives}
        onBack={() => {
          setActiveSubview(taskDetailReturnView);
          setActiveAlternativeId(null);
        }}
        onOpenAlternativeDetail={(alternativeId) => {
          setActiveAlternativeId(alternativeId);
          setActiveSubview('alternativeTaskDetail');
        }}
        onRefreshAlternatives={() => {
          updateTaskOverride(activeTask.id, (current) => ({
            ...current,
            alternativeOffset: (current?.alternativeOffset ?? 0) + 1,
          }));
        }}
        onUpdateFocusedCompletion={(completion) => {
          updateTaskOverride(activeTask.id, (current) => ({
            ...current,
            completion,
          }));
        }}
        onUpdateProgress={(progress) => {
          updateTaskOverride(activeTask.id, (current) => ({
            ...current,
            progress,
          }));
        }}
        onUpdateTiming={(payload) => {
          updateTaskOverride(activeTask.id, (current) => ({
            ...current,
            timeStart: payload.timeStart,
            timeEnd: payload.timeEnd,
            frequency: payload.frequency,
            hoursPerCycle: payload.hoursPerCycle,
          }));
        }}
        task={activeTask}
        timeOptions={activeTimeOptions}
      />
    );
  }

  if (activeSubview === 'alternativeTaskDetail' && activeTask && activeAlternative) {
    return (
      <AlternativeTaskDetailPage
        alternative={activeAlternative}
        key={activeAlternative.id}
        onBack={() => setActiveSubview('taskDetail')}
        onReplace={(payload) => {
          const baseTask = currentBaseTaskMap[activeTask.id];

          updateTaskOverride(activeTask.id, (current) => ({
            ...current,
            completion: 'todo',
            frequency: payload.frequency,
            hoursPerCycle: payload.hoursPerCycle,
            progress: activeAlternative.type === 'accumulate' ? 0 : undefined,
            replacement: {
              ...activeAlternative,
              sourceTitle: baseTask?.title ?? activeTask.title,
              timeStart: payload.timeStart,
              timeEnd: payload.timeEnd,
              frequency: payload.frequency,
              hoursPerCycle: payload.hoursPerCycle,
            },
            timeStart: payload.timeStart,
            timeEnd: payload.timeEnd,
          }));
          setActiveSubview('taskDetail');
          setActiveAlternativeId(null);
        }}
        timeOptions={activeTimeOptions}
      />
    );
  }

  if (activeSubview === 'weeklySchedule') {
    return (
      <WeeklySchedulePage
        importedScheduleName={importedScheduleName || '本学期课表'}
        learningPlan={currentLearningPlan}
        onBack={() => setActiveSubview('main')}
        onImportSchedule={() => handleImportSchedule(false)}
        onPlacementsChange={(placements) => {
          setWeeklyTaskPlacementsByKey((current) => ({
            ...current,
            [currentScheduleStorageKey]: placements,
          }));
        }}
        onTaskPress={(taskId) => openTaskDetail(taskId, 'weeklySchedule')}
        placements={weeklyTaskPlacementsByKey[currentScheduleStorageKey]}
        planJob={currentJob}
        selectedPeriod={selectedPeriod}
        storageKey={currentScheduleStorageKey}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomReservedSpace,
          },
        ]}
        onScrollBeginDrag={closeMenus}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['rgba(181, 239, 231, 0.98)', 'rgba(166, 229, 221, 0.95)']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[
            styles.headerGradient,
            {
              paddingTop: insets.top + 18,
            },
          ]}
        >
          <View style={[styles.contentWrap, { width: contentWidth }]}>
            <View style={styles.headerRow}>
              <Text style={styles.pageTitle}>职业规划</Text>

              <View style={[styles.headerSelectorWrap, jobDropdownOpen && styles.dropdownAnchorRaised]}>
                <Pressable
                  onPress={() => {
                    setPeriodDropdownOpen(false);
                    setJobDropdownOpen((current) => !current);
                  }}
                  style={styles.headerSelector}
                >
                  <Text numberOfLines={1} style={styles.headerSelectorText}>
                    {currentJob.label}
                  </Text>
                  <MaterialIcons
                    color="rgba(103, 111, 120, 1)"
                    name={jobDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={24}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.contentWrap, styles.mainContentWrap, { width: contentWidth }]}>
          <View style={styles.summarySection}>
            <View style={styles.summaryTextColumn}>
              <Text style={styles.summaryItemText}>
                <Text style={styles.summaryLabel}>总目标：</Text>
                {currentJob.goal}
              </Text>
              <Text style={styles.summaryItemText}>
                <Text style={styles.summaryLabel}>目前个人能力与岗位匹配度：</Text>
                {currentJob.matchRate}
              </Text>
              <Text style={styles.summaryItemText}>
                <Text style={styles.summaryLabel}>目前竞争力评分：</Text>
                {currentJob.competitiveness}
              </Text>
              <Text style={styles.summaryItemText}>
                <Text style={styles.summaryLabel}>现有关键成果：</Text>
                {currentJob.achievements}
              </Text>
              <Pressable
                onPress={() => setPathExpanded((current) => !current)}
                style={({ pressed }) => [styles.pathTriggerRow, pressed && styles.pathTriggerRowPressed]}
              >
                <Text style={styles.summaryItemText}>
                  <Text style={styles.summaryLabel}>长期发展路径</Text>
                  <Text style={styles.pathStageHint}>（目前处于{currentJob.currentStageLabel}）</Text>
                </Text>
                <MaterialIcons
                  color="rgba(145, 149, 154, 1)"
                  name={pathExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-right'}
                  size={22}
                />
              </Pressable>
            </View>

            <View style={styles.summaryActionColumn}>
              <Pressable
                onPress={() => {
                  closeMenus();
                  setActiveSubview('jobGraph');
                }}
                style={styles.graphButton}
              >
                <Text style={styles.graphButtonText}>岗位图谱</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  closeMenus();
                  setActiveSubview('skillGraph');
                }}
                style={styles.graphButton}
              >
                <Text style={styles.graphButtonText}>技能图谱</Text>
              </Pressable>
            </View>
          </View>

          {pathExpanded ? (
            <View style={styles.timelineCard}>
              {currentJob.path.map((stage, index) => {
                const showLine = index < currentJob.path.length - 1;

                return (
                  <View key={`${stage.phase}-${stage.anchor}`} style={styles.timelineRow}>
                    <View style={styles.timelineRailColumn}>
                      <View style={[styles.timelineDot, stage.current && styles.timelineDotCurrent]} />
                      {showLine ? <View style={styles.timelineLine} /> : null}
                    </View>

                    <View style={styles.timelineYearWrap}>
                      <Text style={styles.timelineYearText}>{stage.anchor}</Text>
                    </View>

                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineHeadline}>
                        {stage.phase}：{stage.headline}
                      </Text>
                      <Text style={styles.timelineDuration}>{stage.duration}</Text>
                      <Text style={styles.timelineBulletText}>岗位：{stage.role}</Text>
                      <Text style={styles.timelineBulletText}>核心能力：{stage.coreAbility}</Text>
                      <Text style={styles.timelineBulletText}>关键成果：{stage.achievement}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.learningSection}>
            <Text style={styles.sectionTitle}>学习计划</Text>

            <View style={[styles.learningToolbar, periodDropdownOpen && styles.dropdownAnchorRaised]}>
              <View style={styles.periodPickerWrap}>
                <Pressable
                  onPress={() => {
                    setJobDropdownOpen(false);
                    setPeriodDropdownOpen((current) => !current);
                  }}
                  style={styles.periodPicker}
                >
                  <Text style={styles.periodPickerText}>{selectedPeriod}</Text>
                  <MaterialIcons
                    color="rgba(178, 184, 191, 1)"
                    name={periodDropdownOpen ? 'keyboard-arrow-up' : 'play-arrow'}
                    size={22}
                    style={periodDropdownOpen ? undefined : styles.periodPickerClosedIcon}
                  />
                </Pressable>

                {periodDropdownOpen ? (
                  <View style={styles.periodDropdownMenu}>
                    {PERIOD_OPTIONS.map((period, index) => {
                      const active = period === selectedPeriod;

                      return (
                        <Pressable
                          key={period}
                          onPress={() => handlePeriodSelect(period)}
                          style={[
                            styles.periodDropdownOption,
                            index < PERIOD_OPTIONS.length - 1 && styles.periodDropdownOptionBorder,
                          ]}
                        >
                          <View style={[styles.periodCheckbox, active && styles.periodCheckboxActive]} />
                          <Text style={[styles.periodDropdownOptionText, active && styles.periodDropdownOptionTextActive]}>
                            {period}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <View style={styles.scheduleActionWrap}>
                <Pressable onPress={handleSchedulePress} style={styles.scheduleLinkButton}>
                  <Text style={styles.scheduleLinkText}>{importedScheduleName ? '查看周表' : '点击导入本学期课表'}</Text>
                </Pressable>

                {importedScheduleName ? (
                  <Text numberOfLines={1} style={styles.scheduleImportedText}>
                    已导入：{importedScheduleName}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.learningCard}>
              <Text style={styles.learningMetaText}>
                <Text style={styles.learningMetaLabel}>核心目标：</Text>
                {currentLearningPlan.coreGoal}
              </Text>
              <Text style={styles.learningMetaText}>
                <Text style={styles.learningMetaLabel}>重点提升能力：</Text>
                {currentLearningPlan.focusAbility}
              </Text>
              <Text style={styles.learningMetaText}>
                <Text style={styles.learningMetaLabel}>任务列表总览：</Text>
                <Text style={styles.learningHintText}>
                  （
                  <Ionicons
                    color="rgba(12, 94, 63, 1)"
                    name="star"
                    size={14}
                    style={styles.learningHintStarIcon}
                  />
                  {' '}表示重要性）
                </Text>
              </Text>

              <View style={styles.taskList}>
                {sortedTasks.map((task) => {
                  const isAccumulateTask = task.type === 'accumulate';
                  const progress = task.progress ?? 0;
                  const taskStatusText = isAccumulateTask
                    ? progress >= 100
                      ? '已完成'
                      : `${progress}%`
                    : task.completion === 'done'
                      ? '已完成'
                      : '未完成';

                  return (
                    <View key={task.id} style={styles.taskCard}>
                      <View style={styles.taskTopRow}>
                        <View style={styles.taskTitleWrap}>
                          <Text numberOfLines={2} style={styles.taskTitle}>
                            {task.title}
                          </Text>
                          <Text style={styles.taskTypeText}>{isAccumulateTask ? '积累型' : '整时型'}</Text>
                        </View>

                        <View style={styles.taskStarWrap}>
                          <ImportanceStars value={task.importance} />
                        </View>

                        <Pressable onPress={() => openTaskDetail(task.id, 'main')} style={styles.taskDetailButton}>
                          <Text style={styles.taskDetailButtonText}>查看详情</Text>
                        </Pressable>
                      </View>

                      {isAccumulateTask ? (
                        <View style={styles.progressSection}>
                          <View style={styles.progressBarTrack}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
                          </View>
                          <Text style={styles.progressValueText}>{taskStatusText}</Text>
                          <Text style={styles.taskCompletionText}>{task.completion === 'done' ? '已完成' : '进行中'}</Text>
                        </View>
                      ) : (
                        <View style={styles.focusedTaskMetaRow}>
                          <Text style={styles.focusedTaskMetaText}>预估时间：{task.windowLabel}</Text>
                          <Text style={styles.focusedTaskMetaText}>{taskStatusText}</Text>
                        </View>
                      )}

                      <Text style={styles.taskFootnoteText}>
                        {isAccumulateTask
                          ? task.scheduled
                            ? '已编入周表'
                            : '未编入周表'
                          : task.completion === 'done'
                            ? '已完成，可继续用于面试表达'
                            : '建议拆成 2-3 次整块时间推进'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.expectedOutcomeWrap}>
                <Text style={styles.expectedOutcomeLabel}>预期成果：</Text>
                <Text style={styles.expectedOutcomeText}>{currentLearningPlan.expectedOutcome}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {jobDropdownOpen ? (
        <View pointerEvents="box-none" style={styles.jobDropdownOverlay}>
          <Pressable onPress={closeMenus} style={styles.jobDropdownDismissLayer} />

          <View
            style={[
              styles.headerDropdownMenuFloating,
              {
                left: floatingJobDropdownLeft,
                top: floatingJobDropdownTop,
                width: headerSelectorWidth,
              },
            ]}
          >
            {JOB_PLANS.map((job, index) => {
              const active = job.id === selectedJobId;

              return (
                <Pressable
                  key={job.id}
                  onPress={() => handleJobSelect(job.id)}
                  style={[
                    styles.headerDropdownOption,
                    index < JOB_PLANS.length - 1 && styles.headerDropdownOptionBorder,
                  ]}
                >
                  <View style={[styles.optionDot, active && styles.optionDotActive]} />
                  <Text style={[styles.headerDropdownOptionText, active && styles.headerDropdownOptionTextActive]}>
                    {job.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          closeMenus();
          setExportModalVisible(true);
        }}
        style={[
          styles.exportFloatingButton,
          {
            bottom: 104 + Math.max(insets.bottom - 16, 2),
          },
        ]}
      >
        <Ionicons color="rgba(255, 255, 255, 1)" name="share-social-outline" size={18} />
        <Text style={styles.exportFloatingButtonText}>导出规划</Text>
      </Pressable>

      <Modal animationType="fade" onRequestClose={() => setExportModalVisible(false)} transparent visible={exportModalVisible}>
        <View style={styles.exportModalOverlay}>
          <Pressable onPress={() => setExportModalVisible(false)} style={StyleSheet.absoluteFill} />

          <View style={styles.exportModalCard}>
            <Text style={styles.exportModalTitle}>导出规划</Text>
            <Text style={styles.exportModalSubtitle}>选择导出格式</Text>

            {EXPORT_OPTIONS.map((option) => {
              const active = option.id === selectedExportFormat;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedExportFormat(option.id)}
                  style={[styles.exportOptionRow, active && styles.exportOptionRowActive]}
                >
                  <Text style={[styles.exportOptionText, active && styles.exportOptionTextActive]}>{option.label}</Text>
                  <View style={[styles.exportOptionRadioOuter, active && styles.exportOptionRadioOuterActive]}>
                    {active ? <View style={styles.exportOptionRadioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}

            <View style={styles.exportModalActions}>
              <Pressable onPress={() => setExportModalVisible(false)} style={styles.exportSecondaryButton}>
                <Text style={styles.exportSecondaryButtonText}>取消</Text>
              </Pressable>
              <Pressable onPress={handleExportConfirm} style={styles.exportPrimaryButton}>
                <Text style={styles.exportPrimaryButtonText}>确认导出</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(249, 251, 250, 1)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  contentWrap: {
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 41,
  },
  pageTitle: {
    flex: 1,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    color: 'rgba(11, 18, 19, 1)',
    letterSpacing: 0.5,
  },
  headerSelectorWrap: {
    width: 168,
    flexShrink: 0,
  },
  headerSelector: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(218, 223, 228, 1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSelectorText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(99, 106, 113, 1)',
    marginRight: 6,
  },
  headerDropdownMenu: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(224, 228, 232, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 18,
  },
  headerDropdownMenuFloating: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(224, 228, 232, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 18,
  },
  jobDropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    elevation: 90,
  },
  jobDropdownDismissLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerDropdownOption: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDropdownOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(228, 232, 236, 1)',
  },
  optionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(202, 208, 214, 1)',
    marginRight: 10,
  },
  optionDotActive: {
    backgroundColor: 'rgba(26, 133, 92, 1)',
  },
  headerDropdownOptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(88, 95, 102, 1)',
  },
  headerDropdownOptionTextActive: {
    color: 'rgba(22, 103, 74, 1)',
    fontWeight: '700',
  },
  mainContentWrap: {
    paddingTop: 24,
    zIndex: 1,
  },
  summarySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryTextColumn: {
    flex: 1,
    paddingRight: 16,
  },
  summaryActionColumn: {
    width: 92,
    alignItems: 'stretch',
  },
  summaryItemText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(28, 34, 41, 1)',
  },
  summaryLabel: {
    fontWeight: '700',
    color: 'rgba(24, 28, 31, 1)',
  },
  pathStageHint: {
    fontWeight: '600',
    color: 'rgba(138, 142, 147, 1)',
  },
  pathTriggerRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    marginRight: 4,
  },
  pathTriggerRowPressed: {
    opacity: 0.74,
  },
  graphButton: {
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(67, 160, 255, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: 'rgba(53, 137, 224, 0.24)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  graphButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
  },
  timelineCard: {
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(221, 225, 230, 1)',
    marginBottom: 26,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 18,
  },
  timelineRailColumn: {
    width: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(88, 203, 188, 1)',
  },
  timelineDotCurrent: {
    backgroundColor: 'rgba(55, 190, 175, 1)',
    shadowColor: 'rgba(55, 190, 175, 0.36)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  timelineLine: {
    width: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(202, 207, 212, 1)',
    marginTop: 6,
  },
  timelineYearWrap: {
    minWidth: 48,
    paddingTop: 0,
    paddingRight: 10,
  },
  timelineYearText: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 241, 244, 1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(72, 78, 84, 1)',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 0,
  },
  timelineHeadline: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    color: 'rgba(33, 40, 48, 1)',
    marginBottom: 4,
  },
  timelineDuration: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(137, 145, 151, 1)',
    marginBottom: 8,
  },
  timelineBulletText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(46, 52, 58, 1)',
    marginBottom: 2,
  },
  learningSection: {
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    color: 'rgba(14, 17, 19, 1)',
    marginBottom: 12,
  },
  learningToolbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    zIndex: 20,
  },
  periodPickerWrap: {
    width: 118,
    position: 'relative',
    marginRight: 12,
  },
  periodPicker: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214, 218, 223, 1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodPickerText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(91, 98, 104, 1)',
  },
  periodPickerClosedIcon: {
    transform: [{ rotate: '90deg' }],
  },
  periodDropdownMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    width: 224,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(221, 225, 229, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
  },
  periodDropdownOption: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodDropdownOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(231, 235, 238, 1)',
  },
  periodCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: 'rgba(214, 214, 214, 1)',
    marginRight: 10,
  },
  periodCheckboxActive: {
    backgroundColor: 'rgba(70, 157, 132, 1)',
  },
  periodDropdownOptionText: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(61, 67, 74, 1)',
  },
  periodDropdownOptionTextActive: {
    color: 'rgba(18, 96, 71, 1)',
    fontWeight: '700',
  },
  scheduleActionWrap: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingTop: 1,
  },
  scheduleLinkButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  scheduleLinkText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: 'rgba(74, 153, 255, 1)',
  },
  scheduleImportedText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(118, 126, 133, 1)',
  },
  learningCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(223, 227, 231, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  learningMetaText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(33, 37, 42, 1)',
  },
  learningMetaLabel: {
    fontWeight: '700',
    color: 'rgba(22, 27, 31, 1)',
  },
  learningHintText: {
    color: 'rgba(159, 164, 170, 1)',
    fontWeight: '600',
  },
  learningHintStarIcon: {
    marginHorizontal: 1,
  },
  taskList: {
    marginTop: 10,
  },
  taskCard: {
    borderWidth: 1,
    borderColor: 'rgba(218, 223, 229, 1)',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskTitleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
    color: 'rgba(16, 93, 62, 1)',
  },
  taskTypeText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(184, 184, 184, 1)',
    fontWeight: '600',
  },
  taskStarWrap: {
    width: 104,
    alignItems: 'flex-start',
    paddingTop: 2,
    marginRight: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  taskDetailButton: {
    paddingLeft: 2,
    paddingTop: 2,
  },
  taskDetailButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(65, 154, 255, 1)',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 242, 244, 1)',
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(66, 151, 255, 1)',
  },
  progressValueText: {
    width: 44,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(124, 129, 135, 1)',
    textAlign: 'right',
    marginRight: 10,
  },
  taskCompletionText: {
    minWidth: 40,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(155, 160, 166, 1)',
    textAlign: 'right',
  },
  focusedTaskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  focusedTaskMetaText: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(138, 143, 149, 1)',
  },
  taskFootnoteText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(160, 165, 171, 1)',
  },
  expectedOutcomeWrap: {
    paddingTop: 8,
  },
  expectedOutcomeLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: 'rgba(31, 35, 39, 1)',
    marginBottom: 4,
  },
  expectedOutcomeText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(53, 59, 66, 1)',
  },
  exportFloatingButton: {
    position: 'absolute',
    right: 18,
    bottom: 104,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(31, 132, 93, 0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(18, 100, 70, 0.28)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 15,
  },
  exportFloatingButtonText: {
    marginLeft: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
  },
  detailModalScreen: {
    flex: 1,
    backgroundColor: 'rgba(247, 249, 248, 1)',
  },
  detailModalHeader: {
    minHeight: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(223, 227, 231, 1)',
  },
  detailModalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(244, 246, 248, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailModalHeaderTextWrap: {
    flex: 1,
  },
  detailModalTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    color: 'rgba(21, 27, 31, 1)',
  },
  detailModalSubtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(123, 130, 136, 1)',
  },
  detailModalContent: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    paddingBottom: 34,
  },
  modalHeroCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(223, 227, 231, 1)',
    marginBottom: 14,
  },
  modalHeroTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: 'rgba(21, 27, 31, 1)',
    marginBottom: 6,
  },
  modalHeroBody: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(74, 81, 88, 1)',
  },
  scheduleDayCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(224, 228, 232, 1)',
    marginBottom: 12,
  },
  scheduleDayLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: 'rgba(20, 97, 68, 1)',
    marginBottom: 8,
  },
  scheduleItemText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(58, 65, 72, 1)',
    marginBottom: 4,
  },
  graphTrailWrap: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(223, 227, 231, 1)',
  },
  graphTrailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  graphTrailText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(25, 31, 36, 1)',
    marginRight: 8,
    marginBottom: 2,
  },
  skillGroupCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(223, 227, 231, 1)',
    marginBottom: 12,
  },
  skillGroupTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: 'rgba(20, 96, 67, 1)',
    marginBottom: 10,
  },
  skillChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(236, 247, 244, 1)',
    marginRight: 8,
    marginBottom: 8,
  },
  skillChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(24, 100, 72, 1)',
  },
  taskDetailMetaCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(223, 227, 231, 1)',
    marginBottom: 14,
  },
  taskDetailMetaRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskDetailMetaLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(34, 40, 46, 1)',
    marginRight: 12,
  },
  taskDetailMetaValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(86, 92, 99, 1)',
    textAlign: 'right',
  },
  taskDetailMetaDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(227, 231, 235, 1)',
  },
  deliverableCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(223, 227, 231, 1)',
  },
  deliverableTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: 'rgba(23, 29, 34, 1)',
    marginBottom: 8,
  },
  deliverableItemText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(69, 75, 82, 1)',
    marginBottom: 4,
  },
  exportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 22, 26, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  exportModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  exportModalTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    color: 'rgba(21, 26, 31, 1)',
  },
  exportModalSubtitle: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(112, 119, 126, 1)',
  },
  exportOptionRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(247, 249, 251, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  exportOptionRowActive: {
    backgroundColor: 'rgba(236, 247, 243, 1)',
  },
  exportOptionText: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(49, 56, 63, 1)',
    fontWeight: '700',
  },
  exportOptionTextActive: {
    color: 'rgba(17, 97, 69, 1)',
  },
  exportOptionRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(186, 192, 198, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionRadioOuterActive: {
    borderColor: 'rgba(20, 110, 78, 1)',
  },
  exportOptionRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(20, 110, 78, 1)',
  },
  exportModalActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  exportSecondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 243, 245, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exportSecondaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(82, 90, 97, 1)',
  },
  exportPrimaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 131, 92, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportPrimaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
  },
  dropdownAnchorRaised: {
    zIndex: 20,
  },
});
