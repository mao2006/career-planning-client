import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Polygon,
  Stop,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';

type JobGraphPageProps = {
  onBack?: () => void;
  planJob: {
    headerLabel: string;
    id: string;
    label: string;
  };
};

type AbilityPoint = {
  color: string;
  label: string;
  score: number;
};

type RoleProfile = {
  abilities: AbilityPoint[];
  backgroundBasics: string[];
  growthPotential: string[];
  qualityLead: string;
  qualityTraits: string[];
  skillSystem: string[];
};

type GraphNode = {
  description: string;
  id: string;
  label: string;
  profile: RoleProfile;
  shortLabel: string;
  size: number;
  x: number;
  y: number;
};

type GraphScenario = {
  accentLabel: string;
  connections: Array<[string, string]>;
  nodes: GraphNode[];
  rootId: string;
};

const DEFAULT_ABILITIES: AbilityPoint[] = [
  { label: '学习\n能力', score: 84, color: 'rgba(250, 98, 146, 1)' },
  { label: '沟通\n能力', score: 72, color: 'rgba(31, 149, 215, 1)' },
  { label: '实践\n能力', score: 79, color: 'rgba(241, 193, 39, 1)' },
  { label: '抗压\n能力', score: 68, color: 'rgba(97, 196, 181, 1)' },
  { label: '创新\n能力', score: 74, color: 'rgba(122, 136, 230, 1)' },
] as const;

const JOB_GRAPH_SCENARIOS: Record<string, GraphScenario> = {
  'cpp-dev': {
    accentLabel: '结合当前岗位方向推荐的相邻研发路径',
    rootId: 'cpp-core',
    connections: [
      ['cpp-core', 'backend'],
      ['cpp-core', 'embedded'],
      ['cpp-core', 'audio-video'],
    ],
    nodes: [
      {
        id: 'cpp-core',
        label: 'C++开发',
        shortLabel: 'C++',
        x: 0.48,
        y: 0.5,
        size: 112,
        description: '偏底层和工程实现，适合作为多条研发路径的核心起点。',
        profile: {
          backgroundBasics: [
            '计算机、软件工程、电子信息等专业更对口，数理基础稳定更有优势。',
            '数据结构、操作系统、计算机网络、编译原理等课程表现越扎实，后续迁移越顺。',
            '如果有课程项目、算法练习或 Linux 开发经历，岗位适配度会明显提升。',
          ],
          skillSystem: [
            '编程语言：C++、C，能读写基础 Python / Shell 脚本更好。',
            '框架和工具：Linux、Git、CMake、GDB、基础单元测试工具。',
            '领域知识：STL、面向对象、内存管理、多线程、网络基础。',
            '系统设计能力：具备模块拆分、接口约束和问题定位能力。',
          ],
          qualityLead:
            '这一方向需要持续学习和稳定执行，也要求你能在需求不清晰时快速定位问题并和上下游协同。',
          qualityTraits: ['主动复盘', '协作意识', '问题定位', '持续推进'],
          growthPotential: [
            '项目经验深度：从课程项目逐步走向真实业务模块或竞赛项目。',
            '行业认知：理解后端、嵌入式、音视频等不同研发场景的工程侧重点。',
            '团队领导潜力：在小组合作中承担模块 owner 角色，逐步建立技术判断。',
          ],
          abilities: [
            { label: '学习\n能力', score: 86, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 71, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 80, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 74, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 69, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'backend',
        label: '后端开发',
        shortLabel: '后端',
        x: 0.68,
        y: 0.24,
        size: 92,
        description: '更偏服务端架构、接口设计和稳定性建设，和 C++ 工程能力有较强衔接。',
        profile: {
          backgroundBasics: [
            '计算机基础课程需要稳定，尤其是网络、数据库、操作系统和算法。',
            '如果做过服务端课程项目、接口开发或数据库设计，会更容易进入岗位语境。',
            '具备阅读英文文档和定位线上问题的能力，会比单纯写代码更重要。',
          ],
          skillSystem: [
            '编程语言：C++ / Java / Go 至少有一门能完成服务端开发。',
            '框架和工具：Linux、Git、MySQL、Redis、消息队列、日志平台。',
            '领域知识：HTTP、RPC、缓存、并发、服务治理、基本安全意识。',
            '系统设计能力：能够围绕稳定性、扩展性和资源成本做基础取舍。',
          ],
          qualityLead:
            '后端开发要求你不仅能写功能，还要能围绕稳定性、性能和协作边界持续优化交付。',
          qualityTraits: ['结构化表达', '稳定推进', '边界意识', '服务意识'],
          growthPotential: [
            '项目经验深度：从单接口实现逐步过渡到完整业务链路设计。',
            '行业认知：理解业务指标、调用链路和服务稳定性之间的关系。',
            '团队领导潜力：能够在多人协作中承担模块 owner 与技术沟通职责。',
          ],
          abilities: [
            { label: '学习\n能力', score: 83, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 78, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 77, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 73, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 67, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'embedded',
        label: '嵌入式开发',
        shortLabel: '嵌入式',
        x: 0.77,
        y: 0.76,
        size: 92,
        description: '更偏底层驱动、硬件联调和接口协议，适合对系统细节耐心较强的人。',
        profile: {
          backgroundBasics: [
            '电子信息、自动化、通信工程、计算机相关专业背景都可切入。',
            '数电模电、单片机、接口协议、C 语言等课程基础会直接影响上手速度。',
            '如果做过板级调试或实验室硬件项目，会比单纯软件项目更有说服力。',
          ],
          skillSystem: [
            '编程语言：C / C++ 为主，能写基础脚本帮助调试会更高效。',
            '框架和工具：Keil、JLink、示波器、逻辑分析仪、RTOS 工具链。',
            '领域知识：外设驱动、串口/I2C/SPI、Boot 流程、资源受限环境开发。',
            '系统设计能力：能从硬件约束出发做模块拆分和故障定位。',
          ],
          qualityLead:
            '嵌入式开发尤其考验耐心、细节敏感度和与硬件同学联调时的沟通协同能力。',
          qualityTraits: ['耐心调试', '细节敏感', '联调协作', '持续验证'],
          growthPotential: [
            '项目经验深度：从单一驱动开发逐步扩展到系统级联调和整机问题定位。',
            '行业认知：理解产品形态、硬件约束和交付周期之间的平衡。',
            '团队领导潜力：在复杂联调项目里承担节奏推进和问题收敛职责。',
          ],
          abilities: [
            { label: '学习\n能力', score: 81, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 70, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 82, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 76, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 65, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'audio-video',
        label: '音视频开发',
        shortLabel: '音视频',
        x: 0.16,
        y: 0.74,
        size: 92,
        description: '偏多媒体处理与性能优化，适合对系统性能和底层调优有兴趣的人。',
        profile: {
          backgroundBasics: [
            '计算机相关专业更常见，有信号处理、图像处理基础会更加分。',
            '操作系统、网络、多线程以及性能调优相关课程最好不要薄弱。',
            '有播放器、推拉流、编解码实验或相关竞赛经验会很有辨识度。',
          ],
          skillSystem: [
            '编程语言：C++ 为主，理解 C 和基础脚本能力。',
            '框架和工具：FFmpeg、SDL、音视频调试工具、性能分析工具。',
            '领域知识：编解码、渲染链路、推拉流协议、同步机制、卡顿优化。',
            '系统设计能力：能围绕性能、稳定性和端侧资源做方案取舍。',
          ],
          qualityLead:
            '音视频方向除了技术门槛高，还要求你能面对复杂问题链路时保持耐心并持续验证。',
          qualityTraits: ['复杂问题拆解', '稳定排查', '性能意识', '持续试验'],
          growthPotential: [
            '项目经验深度：从功能实现逐步走向性能优化和跨端问题处理。',
            '行业认知：理解直播、会议、播放器等不同业务场景的技术重点。',
            '团队领导潜力：能在跨端协作中承担链路分析和方案推进角色。',
          ],
          abilities: [
            { label: '学习\n能力', score: 88, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 69, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 76, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 74, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 72, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
    ],
  },
  'test-dev': {
    accentLabel: '围绕测试开发延展出的质量保障岗位分工',
    rootId: 'test-dev-core',
    connections: [
      ['test-dev-core', 'automation'],
      ['test-dev-core', 'performance'],
      ['test-dev-core', 'quality-platform'],
    ],
    nodes: [
      {
        id: 'test-dev-core',
        label: '测试开发',
        shortLabel: '测试开发',
        x: 0.48,
        y: 0.5,
        size: 112,
        description: '兼顾测试思维和工程能力，适合善于梳理流程、定位风险的人。',
        profile: {
          backgroundBasics: [
            '计算机、软件工程、信息管理等专业都可进入，核心在于系统理解能力。',
            '数据库、接口原理、操作系统和软件工程课程最好具备稳定基础。',
            '如果做过测试设计、缺陷分析或自动化脚本，会更容易建立岗位说服力。',
          ],
          skillSystem: [
            '编程语言：Python / Java 至少掌握一门能支撑自动化落地。',
            '框架和工具：Postman、JMeter、Selenium / Playwright、CI 工具。',
            '领域知识：测试设计、接口调试、缺陷生命周期、质量度量。',
            '系统设计能力：能从业务流程出发设计验证链路与回归策略。',
          ],
          qualityLead:
            '测试开发不是被动找 bug，而是要主动识别风险、推进质量闭环，并持续和研发产品协同。',
          qualityTraits: ['流程意识', '沟通协同', '风险敏感', '结果闭环'],
          growthPotential: [
            '项目经验深度：从手工验证逐步走向自动化与平台化能力建设。',
            '行业认知：理解不同业务类型下质量策略的差异。',
            '团队领导潜力：能够推动跨角色对齐质量目标和交付节奏。',
          ],
          abilities: [
            { label: '学习\n能力', score: 82, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 81, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 74, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 72, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 66, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'automation',
        label: '自动化测试',
        shortLabel: '自动化',
        x: 0.68,
        y: 0.24,
        size: 92,
        description: '重在脚本能力和自动化体系搭建，和测试开发路径衔接最直接。',
        profile: {
          backgroundBasics: [
            '要求对接口、页面元素、执行流程有较强理解，不一定要求非常强的算法背景。',
            '如果做过脚本项目或自动化课程实验，上手门槛会明显降低。',
            '能快速阅读文档和定位失败原因，会比只会照着教程写脚本更重要。',
          ],
          skillSystem: [
            '编程语言：Python / JavaScript / Java 任选其一做自动化主力语言。',
            '框架和工具：Selenium、Playwright、Pytest、Allure、CI 流水线。',
            '领域知识：回归策略、稳定性处理、数据隔离、失败重试。',
            '系统设计能力：能设计高复用、低维护成本的自动化结构。',
          ],
          qualityLead:
            '自动化测试需要很强的耐心和抽象能力，既要能写脚本，也要持续优化执行稳定性。',
          qualityTraits: ['抽象能力', '耐心维护', '复用意识', '工程意识'],
          growthPotential: [
            '项目经验深度：从单点脚本逐步扩展到持续集成回归体系。',
            '行业认知：理解不同业务的自动化 ROI 与边界。',
            '团队领导潜力：能够主导自动化策略和执行规范沉淀。',
          ],
          abilities: [
            { label: '学习\n能力', score: 80, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 74, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 80, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 69, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 68, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'performance',
        label: '性能测试',
        shortLabel: '性能',
        x: 0.78,
        y: 0.76,
        size: 92,
        description: '更关注系统瓶颈、资源消耗和性能指标，对分析能力要求更高。',
        profile: {
          backgroundBasics: [
            '操作系统、网络、数据库和基础性能分析知识会直接影响问题判断质量。',
            '如果做过压测或排查性能瓶颈的课程 / 项目，会更有优势。',
            '需要一定数学和逻辑能力来理解指标趋势、日志与监控变化。',
          ],
          skillSystem: [
            '编程语言：Python / Java 可用于压测脚本和数据分析。',
            '框架和工具：JMeter、Locust、Prometheus、Grafana、APM 工具。',
            '领域知识：吞吐、延迟、并发、资源利用率、容量评估。',
            '系统设计能力：能从全链路视角分析性能瓶颈和优化优先级。',
          ],
          qualityLead:
            '性能测试更像分析型岗位，需要你在大量指标和日志之间保持清晰判断并推动优化。',
          qualityTraits: ['数据敏感', '问题推理', '全局视角', '结果追踪'],
          growthPotential: [
            '项目经验深度：从单轮压测扩展到持续性能治理和专项优化。',
            '行业认知：理解业务峰值、容量模型和成本控制之间的关系。',
            '团队领导潜力：能推动研发、运维、测试一起收敛性能问题。',
          ],
          abilities: [
            { label: '学习\n能力', score: 84, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 72, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 75, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 77, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 67, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'quality-platform',
        label: '质量平台',
        shortLabel: '平台',
        x: 0.16,
        y: 0.74,
        size: 92,
        description: '更偏平台建设和流程效率提升，适合有体系意识和工具化思维的人。',
        profile: {
          backgroundBasics: [
            '对软件工程、研发流程和质量度量有清晰理解会更有优势。',
            '如果做过工具类项目、平台脚手架或流程优化实践，会更贴近岗位要求。',
            '需要理解不同角色的工作链路，才能设计出真正被用起来的平台能力。',
          ],
          skillSystem: [
            '编程语言：Python / Java / Node.js 可用于工具平台开发。',
            '框架和工具：CI/CD、质量报告平台、权限系统、日志与监控组件。',
            '领域知识：质量指标、流程治理、自动化接入、数据可视化。',
            '系统设计能力：能围绕效率、规范和可扩展性搭建平台结构。',
          ],
          qualityLead:
            '质量平台方向要求你把零散问题抽象成可复用的能力，并持续推动组织内落地。',
          qualityTraits: ['体系意识', '抽象能力', '推进落地', '跨团队协作'],
          growthPotential: [
            '项目经验深度：从单点工具扩展到组织级质量能力平台。',
            '行业认知：理解不同团队、不同业务体量下的治理重点。',
            '团队领导潜力：能够牵头协调研发、测试、运维共建平台规范。',
          ],
          abilities: [
            { label: '学习\n能力', score: 81, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 84, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 71, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 73, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 70, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
    ],
  },
  embedded: {
    accentLabel: '基于嵌入式开发延展出的底层与联调岗位图谱',
    rootId: 'embedded-core',
    connections: [
      ['embedded-core', 'driver'],
      ['embedded-core', 'iot'],
      ['embedded-core', 'system-debug'],
    ],
    nodes: [
      {
        id: 'embedded-core',
        label: '嵌入式开发',
        shortLabel: '嵌入式',
        x: 0.48,
        y: 0.5,
        size: 112,
        description: '位于软硬件交界处，兼顾底层编码、硬件约束和系统联调能力。',
        profile: {
          backgroundBasics: [
            '电子信息、自动化、通信、计算机等专业都可以切入，关键是底层基础是否扎实。',
            '数电模电、单片机、接口协议、操作系统和 C 语言课程会直接影响理解深度。',
            '如果做过实验室硬件项目或板级调试实践，岗位适配度会更高。',
          ],
          skillSystem: [
            '编程语言：C / C++ 为主，能写基础脚本辅助调试会更高效。',
            '框架和工具：JLink、Keil、示波器、逻辑分析仪、RTOS 工具链。',
            '领域知识：驱动开发、Boot 流程、中断、总线协议、资源受限系统。',
            '系统设计能力：能根据硬件约束做模块划分并完成问题收敛。',
          ],
          qualityLead:
            '嵌入式开发既考验技术细节，也考验你在长链路联调里保持耐心、节奏和协作效率。',
          qualityTraits: ['耐心验证', '细节意识', '联调协作', '稳步推进'],
          growthPotential: [
            '项目经验深度：从简单驱动逐步扩展到系统联调和整机问题处理。',
            '行业认知：理解硬件资源、产品形态与交付周期之间的相互制约。',
            '团队领导潜力：在复杂联调场景中承担关键问题 owner 与节奏推进者。',
          ],
          abilities: [
            { label: '学习\n能力', score: 80, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 71, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 84, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 77, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 64, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'driver',
        label: '驱动开发',
        shortLabel: '驱动',
        x: 0.68,
        y: 0.24,
        size: 92,
        description: '更关注底层接口、资源控制和硬件抽象，是嵌入式中偏底层的一支。',
        profile: {
          backgroundBasics: [
            '需要较扎实的 C 语言、计算机组成和接口协议理解。',
            '如果做过外设驱动或设备初始化类实验，迁移会更快。',
            '阅读芯片手册和排查寄存器问题的能力很关键。',
          ],
          skillSystem: [
            '编程语言：C / C++ 为主，熟悉底层内存和寄存器操作。',
            '框架和工具：调试器、驱动日志工具、芯片手册、交叉编译链。',
            '领域知识：I2C/SPI/UART、DMA、中断、设备树、内核接口。',
            '系统设计能力：能在性能、稳定性和资源限制之间做平衡。',
          ],
          qualityLead:
            '驱动开发对细节敏感度要求极高，需要在重复验证中保持稳定输出。',
          qualityTraits: ['细节耐心', '排查能力', '文档阅读', '持续验证'],
          growthPotential: [
            '项目经验深度：从单外设驱动走向复杂板级支持和系统初始化链路。',
            '行业认知：理解芯片平台、整机架构与量产交付的关系。',
            '团队领导潜力：能在复杂驱动问题上承担关键分析与推进职责。',
          ],
          abilities: [
            { label: '学习\n能力', score: 79, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 68, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 86, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 75, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 61, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'iot',
        label: 'IoT开发',
        shortLabel: 'IoT',
        x: 0.78,
        y: 0.76,
        size: 92,
        description: '更偏设备联网、云端协同和场景化落地，适合关注系统整体链路的人。',
        profile: {
          backgroundBasics: [
            '通信、电子信息、计算机相关专业都适合切入。',
            '网络基础、嵌入式系统和协议类课程理解越清晰，越容易进入实际项目。',
            '有智能硬件项目、传感器接入或云端联动经验会更有优势。',
          ],
          skillSystem: [
            '编程语言：C / C++ 为端侧主力，理解基础脚本与接口调试。',
            '框架和工具：MQTT、HTTP、串口调试工具、云平台 SDK。',
            '领域知识：联网协议、设备接入、云边协同、远程升级、安全基础。',
            '系统设计能力：能从设备稳定性和场景落地角度设计方案。',
          ],
          qualityLead:
            'IoT 开发要求你同时兼顾设备端和云端联动，既要动手也要有全链路视角。',
          qualityTraits: ['全链路视角', '场景意识', '协作推进', '问题闭环'],
          growthPotential: [
            '项目经验深度：从单设备功能开发走向云边协同和产品场景落地。',
            '行业认知：理解智能硬件、平台能力和用户使用场景之间的连接。',
            '团队领导潜力：能够协调端、云、硬件多方共同推进交付。',
          ],
          abilities: [
            { label: '学习\n能力', score: 82, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 76, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 79, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 73, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 67, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
      {
        id: 'system-debug',
        label: '系统联调',
        shortLabel: '联调',
        x: 0.16,
        y: 0.74,
        size: 92,
        description: '偏系统级问题收敛与多模块协同，对沟通、排查和推进能力要求更高。',
        profile: {
          backgroundBasics: [
            '需要同时理解软硬件接口、系统流程和调试工具使用方式。',
            '如果做过实验室联调、整机排障或复杂问题复盘，会非常贴近岗位要求。',
            '能快速记录现象、复现实验和总结结论，是这个方向的重要基础。',
          ],
          skillSystem: [
            '编程语言：理解 C / C++ 足够支撑日志定位和基础问题分析。',
            '框架和工具：日志系统、示波器、串口工具、问题追踪平台。',
            '领域知识：启动流程、模块依赖、接口协议、整机问题分类与排查路径。',
            '系统设计能力：能建立问题收敛顺序和跨模块沟通机制。',
          ],
          qualityLead:
            '系统联调更像问题解决者岗位，需要在压力下保持清晰、协调多方并持续推进闭环。',
          qualityTraits: ['跨团队沟通', '问题收敛', '记录复盘', '稳定推进'],
          growthPotential: [
            '项目经验深度：从单问题排查逐步走向整机问题治理与联调策略设计。',
            '行业认知：理解研发、测试、硬件、生产多个环节的边界和协同。',
            '团队领导潜力：能够在复杂项目里承担节奏控制和问题优先级判断。',
          ],
          abilities: [
            { label: '学习\n能力', score: 78, color: 'rgba(250, 98, 146, 1)' },
            { label: '沟通\n能力', score: 83, color: 'rgba(31, 149, 215, 1)' },
            { label: '实践\n能力', score: 75, color: 'rgba(241, 193, 39, 1)' },
            { label: '抗压\n能力', score: 81, color: 'rgba(97, 196, 181, 1)' },
            { label: '创新\n能力', score: 62, color: 'rgba(122, 136, 230, 1)' },
          ],
        },
      },
    ],
  },
};

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function AbilityRadarChart({ abilities, size }: { abilities: AbilityPoint[]; size: number }) {
  const center = size / 2;
  const radius = size * 0.28;
  const levelCount = 5;
  const axisAngles = abilities.map((_, index) => (360 / abilities.length) * index);
  const polygonLevels = Array.from({ length: levelCount }, (_, index) => {
    const currentRadius = (radius / levelCount) * (index + 1);

    return axisAngles
      .map((angle) => {
        const point = polarPoint(center, center, currentRadius, angle);

        return `${point.x},${point.y}`;
      })
      .join(' ');
  });
  const valuePolygon = axisAngles
    .map((angle, index) => {
      const point = polarPoint(center, center, radius * (abilities[index].score / 100), angle);

      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <Svg height={size} width={size}>
      <Defs>
        <SvgLinearGradient id="ability-fill" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="rgba(91, 226, 210, 0.34)" />
          <Stop offset="100%" stopColor="rgba(54, 187, 173, 0.14)" />
        </SvgLinearGradient>
      </Defs>

      {polygonLevels.map((points, index) => (
        <Polygon
          key={`grid-${index}`}
          fill={index === levelCount - 1 ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}
          points={points}
          stroke="rgba(133, 205, 196, 0.44)"
          strokeWidth={1.4}
        />
      ))}

      {axisAngles.flatMap((angle, index) => {
        const axisEnd = polarPoint(center, center, radius, angle);
        const labelPoint = polarPoint(center, center, radius + 28, angle);

        return [
          <Line
            key={`line-${abilities[index].label}`}
            stroke="rgba(107, 183, 173, 0.55)"
            strokeWidth={1.4}
            x1={center}
            x2={axisEnd.x}
            y1={center}
            y2={axisEnd.y}
          />,
          <SvgText
            fill="rgba(66, 78, 82, 1)"
            fontSize="14"
            fontWeight="700"
            key={`label-${abilities[index].label}`}
            textAnchor="middle"
            x={labelPoint.x}
            y={labelPoint.y}
          >
            {abilities[index].label.split('\n').map((line, lineIndex) => (
              <TSpan dy={lineIndex === 0 ? 0 : 15} key={`${abilities[index].label}-${line}`} x={labelPoint.x}>
                {line}
              </TSpan>
            ))}
          </SvgText>,
        ];
      })}

      <Polygon fill="url(#ability-fill)" points={valuePolygon} stroke="rgba(49, 197, 182, 0.98)" strokeWidth={3} />

      {axisAngles.map((angle, index) => {
        const point = polarPoint(center, center, radius * (abilities[index].score / 100), angle);

        return (
          <Circle
            cx={point.x}
            cy={point.y}
            fill={abilities[index].color}
            key={`value-${abilities[index].label}`}
            r={5.5}
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth={2}
          />
        );
      })}
    </Svg>
  );
}

function RoleProfileSection({ index, items, title }: { index: number; items: string[]; title: string }) {
  return (
    <View style={styles.profileSection}>
      <Text style={styles.profileSectionTitle}>{`${index}. ${title}`}</Text>
      {items.map((item) => (
        <Text key={`${title}-${item}`} style={styles.profileBulletText}>
          {`- ${item}`}
        </Text>
      ))}
    </View>
  );
}

export default function JobGraphPage({ onBack, planJob }: JobGraphPageProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [abilityModalVisible, setAbilityModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 28, 420);
  const graphCanvasHeight = Math.min(Math.max(contentWidth * 1.2, 430), screenHeight * 0.54);
  const radarSize = Math.min(contentWidth - 28, 280);
  const scenario = useMemo(() => JOB_GRAPH_SCENARIOS[planJob.id] ?? {
    accentLabel: '点击圆圈查看岗位画像',
    rootId: 'default-root',
    connections: [],
    nodes: [
      {
        id: 'default-root',
        label: planJob.headerLabel,
        shortLabel: planJob.headerLabel,
        x: 0.5,
        y: 0.5,
        size: 112,
        description: '当前岗位画像待进一步补充资料分析，这里先保留默认说明。',
        profile: {
          backgroundBasics: ['专业背景建议与当前方向对口，课程基础以计算机核心课程为主。'],
          skillSystem: ['建议补齐编程语言、工具链、领域知识和系统设计四类能力。'],
          qualityLead: '当前岗位方向需要稳定推进、持续学习和良好的协作表达。',
          qualityTraits: ['学习能力', '实践能力', '沟通协作'],
          growthPotential: ['先从项目积累和岗位理解做起，再逐步沉淀长期成长路径。'],
          abilities: [...DEFAULT_ABILITIES],
        },
      },
    ],
  }, [planJob.headerLabel, planJob.id]);
  const selectedRole = scenario.nodes.find((node) => node.id === selectedRoleId) ?? null;
  const rootNode = scenario.nodes.find((node) => node.id === scenario.rootId) ?? scenario.nodes[0];

  const renderNode = (node: GraphNode, active = false, onPress?: () => void) => {
    const size = active ? node.size + 6 : node.size;
    const left = contentWidth * node.x - size / 2;
    const top = graphCanvasHeight * node.y - size / 2;

    return (
      <Pressable
        key={node.id}
        onPress={onPress}
        style={[
          styles.graphNodeButton,
          {
            left,
            top,
            width: size,
            height: size,
          },
          active && styles.graphNodeButtonActive,
        ]}
      >
        <LinearGradient
          colors={
            active
              ? ['rgba(255, 255, 255, 0.98)', 'rgba(222, 251, 229, 0.98)', 'rgba(246, 255, 249, 1)']
              : ['rgba(255, 255, 255, 0.94)', 'rgba(224, 249, 230, 0.9)', 'rgba(244, 255, 247, 0.95)']
          }
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.graphNodeInner}
        >
          <Text numberOfLines={2} style={[styles.graphNodeText, active && styles.graphNodeTextActive]}>
            {node.label}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  };

  if (selectedRole) {
    return (
      <View style={styles.screen}>
        <LinearGradient
          colors={['rgba(178, 238, 230, 1)', 'rgba(241, 249, 247, 1)', 'rgba(248, 250, 250, 1)']}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.screen}
        >
          <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowPrimary]} />
          <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowSecondary]} />

          <View style={[styles.header, { paddingTop: insets.top + 12, width: contentWidth }]}>
            <Pressable hitSlop={10} onPress={() => setSelectedRoleId(null)} style={styles.circleHeaderButton}>
              <MaterialIcons color="rgba(110, 118, 124, 1)" name="arrow-back-ios-new" size={22} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text numberOfLines={1} style={styles.profilePageTitle}>
                {selectedRole.label}
              </Text>
            </View>

            <View style={styles.headerSideSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.profileScrollContent,
              {
                paddingBottom: insets.bottom + 42,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.profileTopCard, { width: contentWidth }]}>
              <View style={styles.profileTopCardAccent} />
              <View style={styles.profileTopCardBody}>
                <Text style={styles.profileTopCardTitle}>{selectedRole.label}</Text>
                <Text style={styles.profileTopCardDescription}>{selectedRole.description}</Text>
              </View>
            </View>

            <View style={[styles.profilePanelWrap, { width: contentWidth }]}>
              <View style={styles.profilePanelAccent} />
              <View style={styles.profilePanelCard}>
                <RoleProfileSection index={1} items={selectedRole.profile.backgroundBasics} title="学历背景基础" />
                <RoleProfileSection index={2} items={selectedRole.profile.skillSystem} title="专业技能体系" />

                <View style={styles.profileSection}>
                  <View style={styles.qualityHeaderRow}>
                    <Text style={styles.profileSectionTitle}>3. 职业素养品质</Text>
                    <Pressable onPress={() => setAbilityModalVisible(true)} style={styles.qualityLinkButton}>
                      <Text style={styles.qualityLinkText}>点击查看</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.qualityLeadText}>{selectedRole.profile.qualityLead}</Text>

                  <View style={styles.qualityTagWrap}>
                    {selectedRole.profile.qualityTraits.map((trait) => (
                      <View key={trait} style={styles.qualityTag}>
                        <Text style={styles.qualityTagText}>{trait}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <RoleProfileSection index={4} items={selectedRole.profile.growthPotential} title="职业进阶潜力" />
              </View>
            </View>
          </ScrollView>

          <Modal animationType="fade" onRequestClose={() => setAbilityModalVisible(false)} transparent visible={abilityModalVisible}>
            <View style={styles.abilityModalOverlay}>
              <Pressable onPress={() => setAbilityModalVisible(false)} style={StyleSheet.absoluteFill} />

              <View style={[styles.abilityModalCard, { width: Math.min(contentWidth, 360) }]}>
                <View style={styles.abilityModalHeader}>
                  <Text style={styles.abilityModalTitle}>{`${selectedRole.label} 能力画像`}</Text>
                  <Pressable onPress={() => setAbilityModalVisible(false)} style={styles.abilityModalCloseButton}>
                    <MaterialIcons color="rgba(99, 107, 114, 1)" name="close" size={22} />
                  </Pressable>
                </View>

                <AbilityRadarChart abilities={selectedRole.profile.abilities} size={radarSize} />

                <Text style={styles.abilityModalNote}>
                  当前图示用于表达该岗位更看重的能力侧重点，后续可继续接入真实画像评分。
                </Text>
              </View>
            </View>
          </Modal>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(178, 238, 230, 1)', 'rgba(238, 248, 246, 1)', 'rgba(248, 250, 250, 1)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.screen}
      >
        <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowPrimary]} />
        <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowSecondary]} />

        <View style={[styles.header, { paddingTop: insets.top + 12, width: contentWidth }]}>
          <Pressable hitSlop={10} onPress={onBack} style={styles.circleHeaderButton}>
            <MaterialIcons color="rgba(110, 118, 124, 1)" name="arrow-back-ios-new" size={22} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.pageTitle}>岗位图谱</Text>
            <Text style={styles.headerHintText}>点击圆圈查看岗位画像</Text>
          </View>
        </View>

        <View style={[styles.graphIntroCard, { width: contentWidth }]}>
          <Text style={styles.graphIntroTitle}>{rootNode.label}</Text>
          <Text style={styles.graphIntroBody}>{scenario.accentLabel}</Text>
        </View>

        <View style={[styles.graphCanvas, { width: contentWidth, height: graphCanvasHeight }]}>
          <Svg height={graphCanvasHeight} style={StyleSheet.absoluteFill} width={contentWidth}>
            {scenario.connections.map(([fromId, toId]) => {
              const fromNode = scenario.nodes.find((node) => node.id === fromId);
              const toNode = scenario.nodes.find((node) => node.id === toId);

              if (!fromNode || !toNode) {
                return null;
              }

              return (
                <Line
                  key={`${fromId}-${toId}`}
                  stroke="rgba(21, 96, 81, 0.78)"
                  strokeLinecap="round"
                  strokeWidth={2.2}
                  x1={contentWidth * fromNode.x}
                  x2={contentWidth * toNode.x}
                  y1={graphCanvasHeight * fromNode.y}
                  y2={graphCanvasHeight * toNode.y}
                />
              );
            })}
          </Svg>

          <View pointerEvents="none" style={[styles.graphHalo, styles.graphHaloOne]} />
          <View pointerEvents="none" style={[styles.graphHalo, styles.graphHaloTwo]} />

          {scenario.nodes.map((node) => renderNode(node, node.id === scenario.rootId, () => setSelectedRoleId(node.id)))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(244, 249, 248, 1)',
  },
  backgroundGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.56,
  },
  backgroundGlowPrimary: {
    width: 280,
    height: 280,
    top: 92,
    right: -52,
    backgroundColor: 'rgba(123, 223, 208, 0.24)',
  },
  backgroundGlowSecondary: {
    width: 220,
    height: 220,
    left: -70,
    top: 244,
    backgroundColor: 'rgba(255, 225, 153, 0.18)',
  },
  header: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(132, 139, 145, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSideSpacer: {
    width: 40,
    height: 40,
  },
  headerTitleWrap: {
    flex: 1,
    paddingLeft: 10,
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: 'rgba(10, 16, 18, 1)',
  },
  profilePageTitle: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    color: 'rgba(10, 16, 18, 1)',
  },
  headerHintText: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(64, 154, 255, 1)',
    textDecorationLine: 'underline',
  },
  graphIntroCard: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220, 232, 229, 1)',
    shadowColor: 'rgba(18, 58, 51, 0.08)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
  },
  graphIntroTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: 'rgba(18, 32, 35, 1)',
    marginBottom: 4,
  },
  graphIntroBody: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(81, 92, 97, 1)',
  },
  graphCanvas: {
    alignSelf: 'center',
    marginTop: 18,
    position: 'relative',
  },
  graphHalo: {
    position: 'absolute',
    borderRadius: 999,
  },
  graphHaloOne: {
    width: 220,
    height: 220,
    left: 84,
    top: 88,
    backgroundColor: 'rgba(112, 230, 218, 0.12)',
  },
  graphHaloTwo: {
    width: 160,
    height: 160,
    left: 130,
    top: 120,
    backgroundColor: 'rgba(250, 249, 210, 0.18)',
  },
  graphNodeButton: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: 'rgba(49, 123, 105, 0.22)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 9,
  },
  graphNodeButtonActive: {
    shadowColor: 'rgba(30, 122, 101, 0.32)',
    shadowRadius: 20,
    elevation: 12,
  },
  graphNodeInner: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(213, 239, 219, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  graphNodeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(14, 26, 29, 1)',
    textAlign: 'center',
  },
  graphNodeTextActive: {
    color: 'rgba(10, 85, 60, 1)',
  },
  profileScrollContent: {
    paddingTop: 18,
    alignItems: 'center',
  },
  profileTopCard: {
    position: 'relative',
    marginBottom: 14,
  },
  profileTopCardAccent: {
    position: 'absolute',
    top: 10,
    bottom: -10,
    right: 14,
    width: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(118, 219, 209, 0.34)',
  },
  profileTopCardBody: {
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(221, 231, 228, 1)',
    shadowColor: 'rgba(14, 55, 47, 0.08)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
  },
  profileTopCardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: 'rgba(15, 24, 28, 1)',
    marginBottom: 6,
  },
  profileTopCardDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(67, 77, 82, 1)',
  },
  profilePanelWrap: {
    position: 'relative',
  },
  profilePanelAccent: {
    position: 'absolute',
    top: 16,
    bottom: 0,
    right: 18,
    width: 88,
    borderRadius: 26,
    backgroundColor: 'rgba(112, 223, 211, 0.38)',
  },
  profilePanelCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(221, 230, 228, 1)',
    shadowColor: 'rgba(14, 55, 47, 0.1)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 7,
  },
  profileSection: {
    marginBottom: 18,
  },
  profileSectionTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
    color: 'rgba(27, 35, 39, 1)',
    marginBottom: 8,
  },
  profileBulletText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(54, 63, 69, 1)',
    marginBottom: 2,
  },
  qualityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  qualityLinkButton: {
    paddingVertical: 4,
  },
  qualityLinkText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(62, 154, 255, 1)',
  },
  qualityLeadText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(60, 69, 74, 1)',
    marginBottom: 12,
  },
  qualityTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  qualityTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(236, 247, 244, 1)',
    marginRight: 8,
    marginBottom: 8,
  },
  qualityTagText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(20, 105, 75, 1)',
  },
  abilityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 23, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  abilityModalCard: {
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'center',
  },
  abilityModalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  abilityModalTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: 'rgba(23, 31, 35, 1)',
  },
  abilityModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(243, 245, 247, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  abilityModalNote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(109, 117, 124, 1)',
    textAlign: 'center',
  },
  dropdownAnchorRaised: {
    zIndex: 20,
  },
});
