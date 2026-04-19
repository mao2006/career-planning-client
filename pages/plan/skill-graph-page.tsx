import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

type SkillGraphPageProps = {
  onBack?: () => void;
  planJob: {
    headerLabel: string;
    id: string;
    label: string;
  };
};

type SkillProfile = {
  actions: string[];
  completion: string;
  lead: string;
  litSkills: string[];
  pendingSkills: string[];
  traits: string[];
};

type SkillGraphNode = {
  description: string;
  id: string;
  label: string;
  profile: SkillProfile;
  progressBadge: string;
  size: number;
  x: number;
  y: number;
};

type SkillGraphScenario = {
  accentLabel: string;
  connections: Array<[string, string]>;
  nodes: SkillGraphNode[];
  rootId: string;
};

const SKILL_GRAPH_SCENARIOS: Record<string, SkillGraphScenario> = {
  'cpp-dev': {
    accentLabel: '将技能图谱收束成基础、工程、证明三条主线，直接看当前完成度和补齐方向。',
    rootId: 'cpp-core',
    connections: [
      ['cpp-core', 'foundation'],
      ['cpp-core', 'engineering'],
      ['cpp-core', 'proof'],
    ],
    nodes: [
      {
        id: 'cpp-core',
        label: 'C++ 能力核心',
        progressBadge: '7/12',
        x: 0.48,
        y: 0.5,
        size: 118,
        description: '当前更适合先把基础和工程能力做实，再用项目、实习和交付经历把岗位说服力补完整。',
        profile: {
          completion: '7 / 12 已点亮',
          lead: '你已经具备进入 C++ 岗位准备期的基本盘，短板主要不在“完全不会”，而在可证明的工程深度还不够。',
          litSkills: ['C++ 语法', '数据结构', 'Linux', 'Git 协作', 'GDB 调试', '课程项目', '模块拆分'],
          pendingSkills: ['模板泛型', '算法优化', '构建部署', '竞赛/实习', '上线经验'],
          actions: [
            '做一个 Linux 环境下的 C++ 工程化 mini 项目，并补完整 README 与运行说明。',
            '把调试过程沉淀成问题定位笔记，形成面试可讲的排错闭环。',
            '补 1 段竞赛、实验室或实习型经历，把“会做”变成“能证明”。',
          ],
          traits: ['基础已成型', '工程能力较强', '证明项偏弱'],
        },
      },
      {
        id: 'foundation',
        label: '编程基础',
        progressBadge: '2/4',
        x: 0.68,
        y: 0.24,
        size: 92,
        description: '决定你能不能从“会写题”真正过渡到“能写工程代码”的第一层能力。',
        profile: {
          completion: '2 / 4 已点亮',
          lead: '语法和数据结构已经打底，但能拉开差距的抽象表达与性能意识还需要继续补。',
          litSkills: ['C++ 语法', '数据结构'],
          pendingSkills: ['模板泛型', '算法优化'],
          actions: [
            '围绕模板、STL 容器和泛型写 2 到 3 个小练习，避免只停留在语法会用。',
            '做一次复杂度分析和常见性能瓶颈复盘，把算法优化和真实代码联系起来。',
            '为常见基础知识准备口头表达模板，避免面试里只会写不会讲。',
          ],
          traits: ['语法基础', '抽象能力', '性能意识'],
        },
      },
      {
        id: 'engineering',
        label: '工程实现',
        progressBadge: '3/4',
        x: 0.78,
        y: 0.76,
        size: 92,
        description: '这里决定你是否具备真实研发环境里的协作、调试和交付能力。',
        profile: {
          completion: '3 / 4 已点亮',
          lead: 'Linux、Git 和调试能力已经形成明显优势，下一步主要是把构建与交付链路补齐。',
          litSkills: ['Linux', 'Git 协作', 'GDB 调试'],
          pendingSkills: ['构建部署'],
          actions: [
            '用 CMake 组织一次多模块项目，完整走通构建、运行和调试链路。',
            '把常见编译错误、链接问题、运行时问题整理成自己的排错清单。',
            '给项目补一次发布流程说明，把“写完代码”推进到“可被别人使用”。',
          ],
          traits: ['工具链', '调试定位', '模块协作'],
        },
      },
      {
        id: 'proof',
        label: '岗位证明',
        progressBadge: '2/4',
        x: 0.16,
        y: 0.74,
        size: 92,
        description: '这是把学习成果转成简历亮点和岗位匹配度的关键一环。',
        profile: {
          completion: '2 / 4 已点亮',
          lead: '你已经有课程项目和模块拆分意识，但还缺少更贴近岗位语境的实习或交付证明。',
          litSkills: ['课程项目', '模块拆分'],
          pendingSkills: ['竞赛/实习', '上线经验'],
          actions: [
            '把现有项目改写成岗位视角的简历表述，突出模块 owner 和问题定位。',
            '争取 1 次实验室、竞赛或企业场景实践，补足外部证明。',
            '为项目补上线、部署、使用反馈等结果信息，提升说服力。',
          ],
          traits: ['项目表达', '岗位证明', '交付意识'],
        },
      },
    ],
  },
  'test-dev': {
    accentLabel: '把测试开发技能压缩成测试设计、自动化工程、质量闭环三块，结构和岗位图谱保持一致。',
    rootId: 'test-core',
    connections: [
      ['test-core', 'testing-design'],
      ['test-core', 'automation'],
      ['test-core', 'quality-loop'],
    ],
    nodes: [
      {
        id: 'test-core',
        label: '测试开发核心',
        progressBadge: '7/12',
        x: 0.48,
        y: 0.5,
        size: 118,
        description: '当前能力更像“质量意识已经形成，工程化能力正在补”的状态，适合尽快把自动化和平台化证明做出来。',
        profile: {
          completion: '7 / 12 已点亮',
          lead: '你已经不是测试零基础，而是进入了要把测试思维转成自动化和质量闭环成果的阶段。',
          litSkills: ['用例设计', '接口调试', 'SQL 分析', 'Python', '测试报告', '缺陷复盘', '回归策略'],
          pendingSkills: ['风险识别', '自动化框架', 'CI 接入', '平台工具', '质量度量'],
          actions: [
            '搭一个最小可运行的自动化脚手架，先解决可执行、可报告、可复用三个问题。',
            '围绕一类业务流程输出缺陷复盘和回归策略，补足质量思考深度。',
            '尝试把自动化结果接进 CI 或可视化报表，形成工程化证据。',
          ],
          traits: ['质量意识较强', '自动化待强化', '闭环能力可提升'],
        },
      },
      {
        id: 'testing-design',
        label: '测试设计',
        progressBadge: '3/4',
        x: 0.68,
        y: 0.24,
        size: 92,
        description: '决定你能否真正理解业务风险，而不是只会机械执行测试步骤。',
        profile: {
          completion: '3 / 4 已点亮',
          lead: '基础验证能力已经具备，现在差的是把“会测”推进到“知道为什么这样测”。',
          litSkills: ['用例设计', '接口调试', 'SQL 分析'],
          pendingSkills: ['风险识别'],
          actions: [
            '给一个真实业务流程拆边界、异常流和高风险路径，练习风险识别。',
            '把接口测试和数据校验放在一起讲清楚，而不是只记工具操作。',
            '输出一份结构化测试方案，强化设计能力的可展示度。',
          ],
          traits: ['业务理解', '测试设计', '风险敏感'],
        },
      },
      {
        id: 'automation',
        label: '自动化工程',
        progressBadge: '2/4',
        x: 0.78,
        y: 0.76,
        size: 92,
        description: '这是测试开发最容易被岗位直接识别的一块，也是目前最值得加速补齐的部分。',
        profile: {
          completion: '2 / 4 已点亮',
          lead: '已经有语言基础和报告输出意识，但框架搭建与流水线接入还没有形成闭环。',
          litSkills: ['Python', '测试报告'],
          pendingSkills: ['自动化框架', 'CI 接入'],
          actions: [
            '选一套主框架做从脚本组织到报告输出的完整练习。',
            '补一次持续执行场景，把自动化接进 CI 或定时任务。',
            '为失败用例增加日志、截图或环境记录，提升脚本可维护性。',
          ],
          traits: ['脚本能力', '框架意识', '持续执行'],
        },
      },
      {
        id: 'quality-loop',
        label: '质量闭环',
        progressBadge: '2/4',
        x: 0.16,
        y: 0.74,
        size: 92,
        description: '这一块决定你能否从“做测试”进一步成长为“推动质量治理”。',
        profile: {
          completion: '2 / 4 已点亮',
          lead: '你已经有缺陷复盘和回归策略意识，但还没有把质量信息沉淀成平台或度量能力。',
          litSkills: ['缺陷复盘', '回归策略'],
          pendingSkills: ['平台工具', '质量度量'],
          actions: [
            '整理缺陷类型、影响范围和回归结论，沉淀基础质量指标。',
            '尝试做一个轻量工具页或表格模板，把零散问题变成复用能力。',
            '补一次质量周报或专项总结，训练面向团队的表达方式。',
          ],
          traits: ['复盘意识', '平台化思维', '结果闭环'],
        },
      },
    ],
  },
  embedded: {
    accentLabel: '保留嵌入式能力的三条主线，但展示方式改成和岗位图谱一致的固定图谱。',
    rootId: 'embedded-core',
    connections: [
      ['embedded-core', 'low-level'],
      ['embedded-core', 'debug'],
      ['embedded-core', 'delivery'],
    ],
    nodes: [
      {
        id: 'embedded-core',
        label: '嵌入式核心',
        progressBadge: '6/12',
        x: 0.48,
        y: 0.5,
        size: 118,
        description: '当前更像是底层与调试能力已入门，但场景化交付和系统级完整链路还需要继续补的状态。',
        profile: {
          completion: '6 / 12 已点亮',
          lead: '你已经具备切入嵌入式方向的基础，但要真正对口岗位，还需要把底层能力和项目交付绑定起来。',
          litSkills: ['C 语言', '接口协议', '调试工具', '问题定位', '硬件项目', '板级验证'],
          pendingSkills: ['内存控制', '驱动开发', 'RTOS', '启动流程', 'IoT 接入', '远程升级'],
          actions: [
            '围绕一个板级项目补全从驱动、调试到验证的完整链路说明。',
            '把问题定位过程写成调试记录，体现嵌入式岗位很看重的耐心和方法论。',
            '增加联网、升级或系统启动相关实践，让能力不只停留在单点实验。',
          ],
          traits: ['底层基础已具备', '联调能力在形成', '交付链路偏弱'],
        },
      },
      {
        id: 'low-level',
        label: '底层编程',
        progressBadge: '2/4',
        x: 0.68,
        y: 0.24,
        size: 92,
        description: '这部分决定你能否真正理解硬件约束，并写出可控、可验证的底层代码。',
        profile: {
          completion: '2 / 4 已点亮',
          lead: 'C 语言和接口协议已经有了抓手，但更深入的资源控制和驱动开发还需要专项练习。',
          litSkills: ['C 语言', '接口协议'],
          pendingSkills: ['内存控制', '驱动开发'],
          actions: [
            '补一轮寄存器、内存布局和常见资源限制问题的专项练习。',
            '针对一个外设做初始化、读写和异常处理的小型驱动实验。',
            '把接口协议和驱动代码对应起来，避免知识停留在分散记忆。',
          ],
          traits: ['资源控制', '驱动意识', '底层理解'],
        },
      },
      {
        id: 'debug',
        label: '硬件联调',
        progressBadge: '2/4',
        x: 0.78,
        y: 0.76,
        size: 92,
        description: '这里体现的是面对复杂现场时的问题收敛能力，也是嵌入式岗位的高频考点。',
        profile: {
          completion: '2 / 4 已点亮',
          lead: '已经具备工具使用和问题定位基础，但系统级调试能力还需要 RTOS 与启动链路支撑。',
          litSkills: ['调试工具', '问题定位'],
          pendingSkills: ['RTOS', '启动流程'],
          actions: [
            '做一次从启动到运行时异常的完整问题排查，训练系统化定位思路。',
            '补 RTOS 基础概念和任务调度案例，不要只停留在名词层面。',
            '梳理启动流程图和关键日志点，提升联调时的全局感。',
          ],
          traits: ['调试方法', '系统视角', '联调节奏'],
        },
      },
      {
        id: 'delivery',
        label: '场景交付',
        progressBadge: '2/4',
        x: 0.16,
        y: 0.74,
        size: 92,
        description: '这一块让你的能力更接近真实产品环境，而不是停留在课程实验层面。',
        profile: {
          completion: '2 / 4 已点亮',
          lead: '你已经有项目和板级验证经历，但联网接入和远程维护能力还没有补上。',
          litSkills: ['硬件项目', '板级验证'],
          pendingSkills: ['IoT 接入', '远程升级'],
          actions: [
            '为现有项目补一次设备接入、数据上报或远程控制场景。',
            '了解远程升级和版本管理的基本流程，强化交付意识。',
            '把实验结果改写成产品场景语言，提升岗位匹配度。',
          ],
          traits: ['项目交付', '场景意识', '持续验证'],
        },
      },
    ],
  },
};

function SkillProfileSection({ index, items, title }: { index: number; items: string[]; title: string }) {
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

export default function SkillGraphPage({ onBack, planJob }: SkillGraphPageProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 28, 420);
  const graphCanvasHeight = Math.min(Math.max(contentWidth * 1.06, 400), screenHeight * 0.52);
  const scenario = useMemo(
    () =>
      SKILL_GRAPH_SCENARIOS[planJob.id] ?? {
        accentLabel: `围绕 ${planJob.headerLabel} 岗位，将技能拆成几条主线来查看当前阶段完成度。`,
        rootId: 'default-core',
        connections: [
          ['default-core', 'default-foundation'],
          ['default-core', 'default-engineering'],
          ['default-core', 'default-proof'],
        ],
        nodes: [
          {
            id: 'default-core',
            label: `${planJob.headerLabel} 核心`,
            progressBadge: '待补充',
            x: 0.48,
            y: 0.5,
            size: 118,
            description: '当前岗位方向的技能拆解暂未补全，这里先保留默认说明。',
            profile: {
              completion: '待补充',
              lead: '可以先按基础、工程和证明项三块来梳理自己的技能现状。',
              litSkills: ['先盘点已有课程、项目和工具链基础。'],
              pendingSkills: ['补齐岗位更看重的关键技能与证明材料。'],
              actions: ['从一个可展示项目开始，把技能和成果同时补上。'],
              traits: ['能力盘点', '工程积累', '岗位证明'],
            },
          },
          {
            id: 'default-foundation',
            label: '基础能力',
            progressBadge: '待补充',
            x: 0.68,
            y: 0.24,
            size: 92,
            description: '先明确底层知识和核心技能是否真的可用。',
            profile: {
              completion: '待补充',
              lead: '建议从语言、基础课程和核心概念入手建立判断。',
              litSkills: ['已有课程基础'],
              pendingSkills: ['核心知识盲区'],
              actions: ['为基础知识做一次系统盘点。'],
              traits: ['基础认知'],
            },
          },
          {
            id: 'default-engineering',
            label: '工程能力',
            progressBadge: '待补充',
            x: 0.78,
            y: 0.76,
            size: 92,
            description: '把工具链、协作和交付流程拉出来单独梳理。',
            profile: {
              completion: '待补充',
              lead: '工程化不足往往比单纯不会知识点更影响岗位匹配。',
              litSkills: ['已有工具使用经验'],
              pendingSkills: ['完整工程链路'],
              actions: ['围绕项目补一次工程化闭环。'],
              traits: ['工具链'],
            },
          },
          {
            id: 'default-proof',
            label: '证明项',
            progressBadge: '待补充',
            x: 0.16,
            y: 0.74,
            size: 92,
            description: '最终要把能力转成简历、项目和结果证明。',
            profile: {
              completion: '待补充',
              lead: '没有证明项，再多技能点也很难被快速识别。',
              litSkills: ['已有项目经历'],
              pendingSkills: ['岗位化表达'],
              actions: ['把项目重新整理成岗位视角的证明材料。'],
              traits: ['结果展示'],
            },
          },
        ],
      },
    [planJob.headerLabel, planJob.id],
  );
  const selectedNode = scenario.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const rootNode = scenario.nodes.find((node) => node.id === scenario.rootId) ?? scenario.nodes[0];

  const renderNode = (node: SkillGraphNode, active = false, onPress?: () => void) => {
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
              ? ['rgba(255, 255, 255, 0.98)', 'rgba(221, 251, 228, 0.98)', 'rgba(245, 255, 248, 1)']
              : ['rgba(255, 255, 255, 0.94)', 'rgba(231, 248, 242, 0.9)', 'rgba(244, 255, 248, 0.95)']
          }
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.graphNodeInner}
        >
          <Text numberOfLines={2} style={[styles.graphNodeText, active && styles.graphNodeTextActive]}>
            {node.label}
          </Text>

          <View style={[styles.nodeBadge, active && styles.nodeBadgeActive]}>
            <Text style={[styles.nodeBadgeText, active && styles.nodeBadgeTextActive]}>{node.progressBadge}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  if (selectedNode) {
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
            <Pressable hitSlop={10} onPress={() => setSelectedNodeId(null)} style={styles.circleHeaderButton}>
              <MaterialIcons color="rgba(110, 118, 124, 1)" name="arrow-back-ios-new" size={22} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text numberOfLines={1} style={styles.profilePageTitle}>
                {selectedNode.label}
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
                <View style={styles.profileBadgeRow}>
                  <View style={styles.profileCompletionBadge}>
                    <Text style={styles.profileCompletionBadgeText}>{selectedNode.profile.completion}</Text>
                  </View>
                </View>

                <Text style={styles.profileTopCardTitle}>{selectedNode.label}</Text>
                <Text style={styles.profileTopCardDescription}>{selectedNode.description}</Text>
              </View>
            </View>

            <View style={[styles.profilePanelWrap, { width: contentWidth }]}>
              <View style={styles.profilePanelAccent} />

              <View style={styles.profilePanelCard}>
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>1. 当前状态判断</Text>
                  <Text style={styles.profileLeadText}>{selectedNode.profile.lead}</Text>

                  <View style={styles.profileTagWrap}>
                    {selectedNode.profile.traits.map((trait) => (
                      <View key={trait} style={styles.profileTag}>
                        <Text style={styles.profileTagText}>{trait}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <SkillProfileSection index={2} items={selectedNode.profile.litSkills} title="已点亮技能" />
                <SkillProfileSection index={3} items={selectedNode.profile.pendingSkills} title="待补齐技能" />
                <SkillProfileSection index={4} items={selectedNode.profile.actions} title="下一步动作" />
              </View>
            </View>
          </ScrollView>
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

        <ScrollView
          contentContainerStyle={[
            styles.overviewScrollContent,
            {
              paddingBottom: insets.bottom + 28,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingTop: insets.top + 12, width: contentWidth }]}>
            <Pressable hitSlop={10} onPress={onBack} style={styles.circleHeaderButton}>
              <MaterialIcons color="rgba(110, 118, 124, 1)" name="arrow-back-ios-new" size={22} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.pageTitle}>技能图谱</Text>
              <Text style={styles.headerHintText}>点击圆圈查看技能详情</Text>
            </View>
          </View>

          <View style={[styles.graphIntroCard, { width: contentWidth }]}>
            <View style={styles.graphIntroMetaRow}>
              <View style={styles.graphIntroProgressBadge}>
                <Text style={styles.graphIntroProgressText}>{rootNode.profile.completion}</Text>
              </View>
            </View>

            <Text style={styles.graphIntroTitle}>{rootNode.label}</Text>
            <Text style={styles.graphIntroBody}>{scenario.accentLabel}</Text>
          </View>

          <View style={[styles.legendRow, { width: contentWidth }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSwatchLit]} />
              <Text style={styles.legendText}>当前已点亮</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSwatchDim]} />
              <Text style={styles.legendText}>点击节点看待补齐项</Text>
            </View>
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

            {scenario.nodes.map((node) => renderNode(node, node.id === scenario.rootId, () => setSelectedNodeId(node.id)))}
          </View>
        </ScrollView>
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
  overviewScrollContent: {
    alignItems: 'center',
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
    color: 'rgba(23, 116, 96, 1)',
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
  graphIntroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  graphIntroProgressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 20, 24, 0.94)',
  },
  graphIntroProgressText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
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
  legendRow: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220, 232, 229, 1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendSwatchLit: {
    backgroundColor: 'rgba(18, 22, 27, 0.92)',
  },
  legendSwatchDim: {
    backgroundColor: 'rgba(190, 204, 199, 1)',
  },
  legendText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(95, 105, 109, 1)',
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
    paddingVertical: 12,
  },
  graphNodeText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: 'rgba(14, 26, 29, 1)',
    textAlign: 'center',
  },
  graphNodeTextActive: {
    color: 'rgba(10, 85, 60, 1)',
  },
  nodeBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(229, 236, 233, 0.95)',
  },
  nodeBadgeActive: {
    backgroundColor: 'rgba(20, 27, 31, 0.94)',
  },
  nodeBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: 'rgba(92, 101, 105, 1)',
  },
  nodeBadgeTextActive: {
    color: 'rgba(255, 255, 255, 1)',
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
  profileBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  profileCompletionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(18, 22, 27, 0.94)',
  },
  profileCompletionBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
  },
  profileTopCardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: 'rgba(14, 24, 27, 1)',
  },
  profileTopCardDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(76, 88, 93, 1)',
  },
  profilePanelWrap: {
    position: 'relative',
  },
  profilePanelAccent: {
    position: 'absolute',
    top: 14,
    bottom: -12,
    left: 12,
    right: 12,
    borderRadius: 26,
    backgroundColor: 'rgba(173, 232, 224, 0.28)',
  },
  profilePanelCard: {
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(222, 231, 229, 1)',
    shadowColor: 'rgba(17, 61, 53, 0.08)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
  },
  profileSection: {
    marginBottom: 18,
  },
  profileSectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: 'rgba(16, 29, 32, 1)',
    marginBottom: 10,
  },
  profileLeadText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(73, 85, 90, 1)',
  },
  profileTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  profileTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(232, 248, 242, 1)',
    marginRight: 8,
    marginBottom: 8,
  },
  profileTagText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(24, 111, 90, 1)',
  },
  profileBulletText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(75, 86, 92, 1)',
    marginBottom: 8,
  },
});
