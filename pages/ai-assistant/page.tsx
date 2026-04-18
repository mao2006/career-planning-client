import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchAgentOpeningMessage, hasChatAgentAuthorization, sendAgentChatMessage } from '../../services/agent-service';

type ChatRole = 'assistant' | 'user';
type ChatMessageState = 'default' | 'thinking';

type ChatMessage = {
  createdAt: Date;
  id: string;
  role: ChatRole;
  state?: ChatMessageState;
  text: string;
};

type AssessmentScriptStep = {
  assistantReply: string;
  prompt: string;
  thinkingText: string;
};

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
const MAIN_TAB_BAR_HEIGHT = 74;
const TAB_BAR_GAP = 5;
const COMPOSER_CONTROL_HEIGHT = 46;
const COMPOSER_WRAP_HEIGHT = 66;
const AUTO_REPLY_DELAY_MS = 360;
const ASSESSMENT_THINKING_DELAY_MS = 2000;
const ASSESSMENT_STREAM_INTERVAL_MS = 34;
const ASSESSMENT_STREAM_CHUNK_SIZE = 2;
const REMOTE_THINKING_TEXT = 'AI Agent 正在分析你的输入...';
const USER_BASELINE_SUMMARY = '你目前处在职业探索阶段，学习吸收和沟通协同能力相对更突出，也需要继续补足实践证明和岗位聚焦。';
const ASSESSMENT_SCRIPT_STEPS: AssessmentScriptStep[] = [
  {
    prompt: '请告诉我你的大致求职方向',
    thinkingText: '正在识别你的软件求职主方向...',
    assistantReply:
      '收到，你的求职方向会先按软件研发来测，重点看 C++ / 后端这条线的岗位匹配度。接下来，请把你最想优先投递的岗位按顺序说一下。',
  },
  {
    prompt: '在这个方向里，你最想优先投哪一类岗位？如果你有 1、2、3 顺位，可以直接排出来。',
    thinkingText: '正在判断你的岗位优先级是否足够清晰...',
    assistantReply:
      '岗位优先级已经比较清楚，当前主线可以先围绕 C++ 开发来建立证明。下一步我要判断你有没有一段真正能支撑研发岗位的项目经历。请说一段你最能展开的项目或实践。',
  },
  {
    prompt: '你现有经历里，哪一段最能支撑这个岗位？请挑一个最能展开讲的项目、课程设计、竞赛或实践经历。',
    thinkingText: '正在评估这段经历和研发岗位的相关度...',
    assistantReply:
      '这段经历对软件方向是相关的，但我还需要确认你是否真正做过核心实现，而不是只参与外围工作。接下来，请把你独立负责的部分讲清楚。',
  },
  {
    prompt: '在这段经历里，哪些部分是你独立负责的？请尽量讲清楚你具体做了什么、解决了什么问题。',
    thinkingText: '正在确认你的个人贡献与工程参与深度...',
    assistantReply:
      '明白了，这样的经历已经可以作为第一段岗位证明，但还要看它是否足够支撑正式投递。现在请告诉我，和目标岗位相比，你最缺的是什么？',
  },
  {
    prompt: '和目标岗位的要求相比，你现在最欠缺的是什么？更偏向项目深度、实习经历、工程化能力，还是面试表达？',
    thinkingText: '正在定位你当前最关键的求职短板...',
    assistantReply:
      '这个判断比较准确。你当前的短板不在基础课程，而在高质量项目证明和岗位化表达。最后一个问题，如果接下来只能优先补一件事，你会补什么？',
  },
  {
    prompt: '如果接下来只能优先补一件事，你会补什么？为什么它最能提升你的求职结果？',
    thinkingText: '正在汇总测评结果并生成岗位建议...',
    assistantReply:
      '好的，我先给你一个阶段性测评结论。\n\n1. 你的求职方向可以收敛到软件研发，主投 C++ 开发，后端开发和嵌入式开发作为备选。\n2. 你已经有一定课程项目和基础能力，但还缺少更像真实研发场景的项目证明。\n3. 现阶段最关键的补强项，是把 Linux、C++、Git、调试定位这一条工程化链路完整展示出来。\n4. 下一步最优动作，是做一个可运行、可讲解、可写进简历的 C++ 项目，再同步准备项目表达和模拟面试。\n\n这轮测评先到这里，你可以返回查看能力画像页。',
  },
];

type AiAssistantPageProps = {
  mode?: 'standalone' | 'tab';
  onBack?: () => void;
};

type RichTextTone = 'assistant' | 'thinking' | 'user';

function padTimeUnit(value: number) {
  return value.toString().padStart(2, '0');
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const mondayBasedOffset = day === 0 ? 6 : day - 1;
  const dayStart = startOfDay(date);

  dayStart.setDate(dayStart.getDate() - mondayBasedOffset);

  return dayStart;
}

function formatClock(date: Date) {
  return `${padTimeUnit(date.getHours())}:${padTimeUnit(date.getMinutes())}`;
}

function formatChatTimestamp(date: Date, now = new Date()) {
  const todayStart = startOfDay(now);
  const targetDayStart = startOfDay(date);
  const diffDays = Math.floor((todayStart.getTime() - targetDayStart.getTime()) / 86400000);
  const timeLabel = formatClock(date);

  if (diffDays <= 0) {
    return timeLabel;
  }

  if (diffDays === 1) {
    return `昨天 ${timeLabel}`;
  }

  if (diffDays === 2) {
    return `前天 ${timeLabel}`;
  }

  if (date >= startOfWeek(now)) {
    return `${WEEKDAY_LABELS[date.getDay()]} ${timeLabel}`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${padTimeUnit(date.getMonth() + 1)}.${padTimeUnit(date.getDate())} ${timeLabel}`;
  }

  return `${date.getFullYear()}.${padTimeUnit(date.getMonth() + 1)}.${padTimeUnit(date.getDate())} ${timeLabel}`;
}

function shouldShowTimestamp(messages: ChatMessage[], index: number) {
  if (index === 0) {
    return true;
  }

  const currentTime = messages[index].createdAt.getTime();
  const previousTime = messages[index - 1].createdAt.getTime();
  const crossedDay = startOfDay(messages[index].createdAt).getTime() !== startOfDay(messages[index - 1].createdAt).getTime();

  return crossedDay || currentTime - previousTime >= 20 * 60 * 1000;
}

function createInitialMessages(now = new Date()): ChatMessage[] {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(20, 18, 0, 0);

  const todayQuestion = new Date(now);
  todayQuestion.setHours(Math.max(now.getHours() - 1, 9), 6, 0, 0);

  const todayAnswer = new Date(todayQuestion.getTime() + 2 * 60 * 1000);

  return [
    {
      id: 'assistant-yesterday',
      role: 'assistant',
      text: '我已经结合你的职业规划场景准备好了回答方式。你可以直接问目标岗位、实习准备、作品集拆解，或者让我把下一步行动排成一周计划。',
      createdAt: yesterday,
    },
    {
      id: 'user-today',
      role: 'user',
      text: '如果我现在还不确定具体岗位，第一步应该先做什么？',
      createdAt: todayQuestion,
    },
    {
      id: 'assistant-today',
      role: 'assistant',
      text:
        '先不要急着广撒网。建议你先圈出 2 个最想尝试的方向，再分别写下这两个方向最常见的任务、需要的证明材料，以及你已经具备的部分。这样你会更快看清应该先补技能、补项目，还是先做一次小实习验证。',
      createdAt: todayAnswer,
    },
  ];
}

function createAssessmentOpeningMessage(now = new Date()): ChatMessage[] {
  return [
    {
      id: 'assistant-ready',
      role: 'assistant',
      text: ASSESSMENT_SCRIPT_STEPS[0].prompt,
      createdAt: now,
    },
  ];
}

function buildAssistantReply(prompt: string) {
  const normalizedPrompt = prompt.trim();
  const intro = `结合你当前的基础情况来看，${USER_BASELINE_SUMMARY}`;

  if (/岗位|方向|适合|选择/.test(normalizedPrompt)) {
    return `${intro}\n\n如果你现在还在收敛方向，先只保留 2 个最想尝试的岗位，然后分别回答三件事：它每天在做什么、你现阶段最缺什么证明、两周内能做哪一个最小验证。\n\n你先把这 2 个岗位发给我，我可以继续帮你拆成更具体的行动表。`;
  }

  if (/简历|面试|自我介绍/.test(normalizedPrompt)) {
    return `${intro}\n\n这类问题先抓“证明力”。简历和面试内容不要只写做过什么，要把问题、动作、结果写清楚。\n\n你可以优先准备 3 段经历：一次课程项目、一次实践协作、一次主动解决问题的例子。把原文发给我，我可以直接帮你改成更像求职表达。`;
  }

  if (/实习|项目|作品|经历/.test(normalizedPrompt)) {
    return `${intro}\n\n现阶段最有效的补强方式通常不是再听一轮课，而是补一个能被看到的项目或经历。建议你先选一个和目标方向最接近的小题目，用 7 天做出可以展示的结果。\n\n如果你愿意，我可以下一条直接帮你把这个项目拆成每天的任务。`;
  }

  if (/学习|计划|安排|怎么做|下一步/.test(normalizedPrompt)) {
    return `${intro}\n\n你现在更适合“小步快跑”的推进方式。先把接下来一周分成三块：信息收集、能力补强、结果沉淀。\n\n比较稳妥的顺序是：先确认目标，再补最关键的一项能力，最后把过程沉淀成简历/作品可展示内容。`;
  }

  return `${intro}\n\n你这条问题我建议先从“目标、差距、动作”三个层次来拆。目标是你想靠近什么岗位，差距是当前最缺哪一项证明，动作是这一周最小但能落地的一步。\n\n如果你愿意，再告诉我你最纠结的是岗位、简历、实习还是学习安排，我可以继续给你更具体的建议。`;
}

function renderInlineRichText(text: string, keyPrefix: string) {
  return text
    .split(/(\*\*.*?\*\*|__.*?__)/g)
    .filter((segment) => segment.length > 0)
    .map((segment, index) => {
      const isBoldMarkdown =
        (segment.startsWith('**') && segment.endsWith('**')) ||
        (segment.startsWith('__') && segment.endsWith('__'));

      if (!isBoldMarkdown) {
        return segment;
      }

      return (
        <Text key={`${keyPrefix}-${index}`} style={styles.richTextStrong}>
          {segment.slice(2, -2)}
        </Text>
      );
    });
}

function RichTextMessage({
  text,
  tone,
}: {
  text: string;
  tone: RichTextTone;
}) {
  const baseTextStyle = [
    styles.bubbleText,
    tone === 'user' ? styles.userBubbleText : styles.assistantBubbleText,
    tone === 'thinking' && styles.thinkingBubbleText,
  ];
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  return (
    <View style={styles.richTextWrap}>
      {lines.map((rawLine, index) => {
        const line = rawLine.replace(/\t/g, '    ');
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          return <View key={`spacer-${index}`} style={styles.richTextSpacer} />;
        }

        const headingMatch = trimmedLine.match(/^#{1,3}\s+(.*)$/);
        const orderedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
        const bulletMatch = line.match(/^\s*[*-]\s+(.*)$/);

        if (headingMatch) {
          return (
            <Text key={`heading-${index}`} style={[baseTextStyle, styles.richTextHeading]}>
              {renderInlineRichText(headingMatch[1], `heading-${index}`)}
            </Text>
          );
        }

        if (orderedMatch) {
          return (
            <View key={`ordered-${index}`} style={styles.richListRow}>
              <Text style={[baseTextStyle, styles.richListMarker]}>{`${orderedMatch[1]}.`}</Text>
              <Text style={[baseTextStyle, styles.richListText]}>
                {renderInlineRichText(orderedMatch[2], `ordered-${index}`)}
              </Text>
            </View>
          );
        }

        if (bulletMatch) {
          return (
            <View key={`bullet-${index}`} style={styles.richListRow}>
              <Text style={[baseTextStyle, styles.richListMarker]}>•</Text>
              <Text style={[baseTextStyle, styles.richListText]}>
                {renderInlineRichText(bulletMatch[1], `bullet-${index}`)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={`paragraph-${index}`} style={baseTextStyle}>
            {renderInlineRichText(line, `paragraph-${index}`)}
          </Text>
        );
      })}
    </View>
  );
}

export default function AiAssistantPage({ mode = 'tab', onBack }: AiAssistantPageProps) {
  const standaloneMode = mode === 'standalone';
  const agentEnabled = hasChatAgentAuthorization();
  const [draft, setDraft] = useState('');
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [conversationId, setConversationId] = useState('');
  const [conversationEnded, setConversationEnded] = useState(false);
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    standaloneMode ? createAssessmentOpeningMessage() : createInitialMessages()
  );
  const [previousAgentOutput, setPreviousAgentOutput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextMessageIdRef = useRef(standaloneMode ? 2 : 4);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 28, 420);
  const horizontalInset = (screenWidth - contentWidth) / 2;
  const tabBarBottomPadding = Math.max(insets.bottom - 16, 2);
  const headerHeight = standaloneMode ? insets.top + 58 : 0;
  const currentAssessmentStep = standaloneMode ? ASSESSMENT_SCRIPT_STEPS[assessmentStep] : undefined;
  const standaloneInputLocked = standaloneMode && !agentEnabled && !currentAssessmentStep;
  const composerBottomSpacing = keyboardVisible
    ? standaloneMode
      ? keyboardHeight + 8
      : TAB_BAR_GAP
    : standaloneMode
      ? Math.max(insets.bottom + 10, 16)
      : MAIN_TAB_BAR_HEIGHT + tabBarBottomPadding + TAB_BAR_GAP;
  const scrollBottomPadding = standaloneMode
    ? COMPOSER_WRAP_HEIGHT + Math.max(insets.bottom + 10, 18) + 12
    : COMPOSER_WRAP_HEIGHT + composerBottomSpacing + 18;
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'ios' ? 60 : 30);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      if (replyTimerRef.current) {
        clearTimeout(replyTimerRef.current);
      }

      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
      }

      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }

      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!agentEnabled) {
      return;
    }

    let active = true;

    fetchAgentOpeningMessage()
      .then((openingMessage) => {
        if (!active || !openingMessage) {
          return;
        }

        setMessages([
          {
            id: 'assistant-opening',
            role: 'assistant',
            text: openingMessage,
            createdAt: new Date(),
          },
        ]);
      })
      .catch(() => {
        // Fall back to the local opening when the remote agent is unavailable.
      });

    return () => {
      active = false;
    };
  }, [agentEnabled]);

  const appendAssistantMessage = (text: string, state: ChatMessageState = 'default') => {
    const id = `message-${nextMessageIdRef.current++}`;

    setMessages((current) => [
      ...current,
      {
        id,
        role: 'assistant',
        state,
        text,
        createdAt: new Date(),
      },
    ]);

    return id;
  };

  const updateMessageText = (messageId: string, text: string) => {
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, text } : message))
    );
  };

  const removeMessage = (messageId: string) => {
    setMessages((current) => current.filter((message) => message.id !== messageId));
  };

  const clearResponseTimers = () => {
    if (replyTimerRef.current) {
      clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }

    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  };

  const streamAssistantReply = (text: string, onComplete?: () => void) => {
    const messageId = appendAssistantMessage('');
    let cursor = 0;

    streamTimerRef.current = setInterval(() => {
      cursor = Math.min(cursor + ASSESSMENT_STREAM_CHUNK_SIZE, text.length);
      updateMessageText(messageId, text.slice(0, cursor));

      if (cursor >= text.length) {
        if (streamTimerRef.current) {
          clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }

        onComplete?.();
      }
    }, ASSESSMENT_STREAM_INTERVAL_MS);
  };

  const waitDuration = (durationMs: number) =>
    new Promise<void>((resolve) => {
      if (durationMs <= 0) {
        resolve();
        return;
      }

      setTimeout(resolve, durationMs);
    });

  const handleVoicePress = () => {
    if (standaloneMode) {
      inputRef.current?.focus();
      return;
    }

    setDraft((current) =>
      current.trim().length > 0 ? current : '结合我当前的能力画像，帮我安排下一周的行动计划'
    );
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft || isAssistantResponding || standaloneInputLocked) {
      return;
    }

    clearResponseTimers();

    const userMessage: ChatMessage = {
      id: `message-${nextMessageIdRef.current++}`,
      role: 'user',
      text: trimmedDraft,
      createdAt: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');

    if (agentEnabled) {
      const nextConversationId = conversationEnded ? '' : conversationId;
      const nextPreviousAgentOutput = conversationEnded ? '' : previousAgentOutput;

      if (conversationEnded) {
        setConversationEnded(false);
        setConversationId('');
        setPreviousAgentOutput('');
      }

      setIsAssistantResponding(true);

      const thinkingMessageId = appendAssistantMessage(REMOTE_THINKING_TEXT, 'thinking');
      const requestStartedAt = Date.now();

      try {
        const result = await sendAgentChatMessage({
          conversationId: nextConversationId || undefined,
          previousAgentOutput: nextPreviousAgentOutput,
          query: trimmedDraft,
        });

        setConversationId(result.conversationId);
        setPreviousAgentOutput(result.rawAnswer || result.answer);

        await waitDuration(ASSESSMENT_THINKING_DELAY_MS - (Date.now() - requestStartedAt));
        removeMessage(thinkingMessageId);

        streamAssistantReply(result.answer, () => {
          setConversationEnded(result.ended);
          setIsAssistantResponding(false);
        });

        return;
      } catch {
        removeMessage(thinkingMessageId);
      }
    }

    setIsAssistantResponding(false);

    if (standaloneMode) {
      if (!currentAssessmentStep) {
        return;
      }

      setIsAssistantResponding(true);

      const thinkingMessageId = appendAssistantMessage(currentAssessmentStep.thinkingText, 'thinking');

      thinkingTimerRef.current = setTimeout(() => {
        removeMessage(thinkingMessageId);

        streamAssistantReply(currentAssessmentStep.assistantReply, () => {
          setAssessmentStep((current) => current + 1);
          setIsAssistantResponding(false);
        });

        thinkingTimerRef.current = null;
      }, ASSESSMENT_THINKING_DELAY_MS);

      return;
    }

    replyTimerRef.current = setTimeout(() => {
      appendAssistantMessage(buildAssistantReply(trimmedDraft));
      replyTimerRef.current = null;
    }, AUTO_REPLY_DELAY_MS);
  };
  const sendDisabled = draft.trim().length === 0 || isAssistantResponding || standaloneInputLocked;

  const assistantContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={styles.screen}
    >
      <StatusBar style="dark" />

      <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowPrimary]} />
      <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowSecondary]} />

      {standaloneMode ? (
        <View
          style={[
            styles.header,
            {
              left: horizontalInset,
              paddingTop: insets.top + 8,
              paddingHorizontal: 4,
              width: contentWidth,
            },
          ]}
        >
          <Pressable hitSlop={10} onPress={onBack} style={styles.headerBackButton}>
            <Ionicons color="rgba(76, 88, 104, 1)" name="chevron-back" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>AI测评对话</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      ) : null}

      <View
        style={[
          styles.contentWrap,
          {
            paddingTop: standaloneMode ? headerHeight : insets.top + 8,
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            width: contentWidth,
            paddingBottom: scrollBottomPadding,
            paddingTop: 6,
          }}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.chatScroll}
        >
          {messages.map((message, index) => {
            const isAssistant = message.role === 'assistant';
            const isThinking = message.state === 'thinking';

            return (
              <View key={message.id}>
                {shouldShowTimestamp(messages, index) ? (
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>{formatChatTimestamp(message.createdAt)}</Text>
                  </View>
                ) : null}

                <View style={[styles.messageRow, isAssistant ? styles.messageRowAssistant : styles.messageRowUser]}>
                  {isAssistant ? (
                    <View style={[styles.avatarShell, styles.assistantAvatarShell]}>
                      <Image
                        source={require('../../assets/jixiangwu.png')}
                        resizeMode="cover"
                        style={styles.assistantAvatarImage}
                      />
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.bubble,
                      isAssistant ? styles.assistantBubble : styles.userBubble,
                      isThinking && styles.thinkingBubble,
                    ]}
                  >
                    {isAssistant ? (
                      <RichTextMessage text={message.text} tone={isThinking ? 'thinking' : 'assistant'} />
                    ) : (
                      <Text style={[styles.bubbleText, styles.userBubbleText]}>{message.text}</Text>
                    )}
                  </View>

                  {!isAssistant ? (
                    <View style={[styles.avatarShell, styles.userAvatarShell]}>
                      <Ionicons color="rgba(76, 88, 104, 1)" name="person-outline" size={18} />
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View
        style={[
          styles.composerWrap,
          {
            bottom: composerBottomSpacing,
            left: horizontalInset,
            width: contentWidth,
          },
        ]}
      >
        <Pressable hitSlop={8} onPress={handleVoicePress} style={styles.voiceButton}>
          <Ionicons color="rgba(70, 154, 145, 1)" name="mic-outline" size={22} />
        </Pressable>

        <View style={styles.inputShell}>
          <TextInput
            ref={inputRef}
            editable={!standaloneInputLocked}
            onChangeText={setDraft}
            placeholder={
              standaloneMode
                ? !standaloneInputLocked
                  ? conversationEnded
                    ? '本轮已结束，可输入新的问题'
                    : '请输入你的回答'
                  : '本轮测评已完成'
                : conversationEnded
                  ? '本轮已结束，可输入新的问题'
                  : '问目标岗位、实习或下一步'
            }
            placeholderTextColor="rgba(152, 162, 179, 1)"
            style={styles.input}
            value={draft}
          />
        </View>

        <Pressable
          disabled={sendDisabled}
          hitSlop={8}
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            sendDisabled && styles.sendButtonDisabled,
            pressed && !sendDisabled && styles.sendButtonPressed,
          ]}
        >
          <Text style={styles.sendButtonText}>发送</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  if (standaloneMode) {
    return (
      <LinearGradient
        colors={['rgba(168, 237, 229, 1)', 'rgba(252, 250, 250, 1)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={styles.screen}
      >
        {assistantContent}
      </LinearGradient>
    );
  }

  return assistantContent;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
  },
  headerTitle: {
    color: 'rgba(34, 42, 52, 1)',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0,
  },
  headerRightSpacer: {
    width: 40,
    height: 40,
  },
  backgroundGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.7,
  },
  backgroundGlowPrimary: {
    top: 54,
    right: -24,
    width: 180,
    height: 180,
    backgroundColor: 'rgba(188, 238, 235, 0.75)',
  },
  backgroundGlowSecondary: {
    top: 180,
    left: -68,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 230, 191, 0.45)',
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
  },
  chatScroll: {
    flex: 1,
  },
  timeRow: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  timeLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    color: 'rgba(102, 112, 133, 1)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatarShell: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  assistantAvatarShell: {
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  assistantAvatarImage: {
    width: 32,
    height: 32,
  },
  userAvatarShell: {
    marginLeft: 10,
    backgroundColor: 'rgba(227, 233, 242, 1)',
  },
  bubble: {
    maxWidth: '78%',
    minHeight: 46,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    justifyContent: 'center',
    shadowColor: 'rgba(18, 38, 37, 0.08)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  assistantBubble: {
    borderTopLeftRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(230, 236, 240, 1)',
  },
  thinkingBubble: {
    backgroundColor: 'rgba(246, 249, 251, 0.98)',
    borderColor: 'rgba(214, 224, 230, 1)',
  },
  userBubble: {
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(128, 213, 205, 0.95)',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  richTextWrap: {
    gap: 6,
  },
  richTextSpacer: {
    height: 2,
  },
  richTextHeading: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  richListRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  richListMarker: {
    width: 18,
    paddingTop: 0,
    fontWeight: '700',
  },
  richListText: {
    flex: 1,
  },
  richTextStrong: {
    fontWeight: '800',
  },
  assistantBubbleText: {
    color: 'rgba(28, 36, 45, 1)',
    fontWeight: '500',
  },
  thinkingBubbleText: {
    color: 'rgba(95, 106, 118, 1)',
  },
  userBubbleText: {
    color: 'rgba(10, 37, 34, 1)',
    fontWeight: '600',
  },
  composerWrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(225, 232, 236, 1)',
    shadowColor: 'rgba(38, 56, 55, 0.14)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  voiceButton: {
    width: COMPOSER_CONTROL_HEIGHT,
    height: COMPOSER_CONTROL_HEIGHT,
    borderRadius: COMPOSER_CONTROL_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 249, 247, 1)',
    marginRight: 10,
  },
  inputShell: {
    flex: 1,
    height: COMPOSER_CONTROL_HEIGHT,
    borderRadius: 18,
    backgroundColor: 'rgba(247, 249, 251, 1)',
    paddingHorizontal: 14,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  input: {
    height: COMPOSER_CONTROL_HEIGHT,
    color: 'rgba(16, 24, 40, 1)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  sendButton: {
    minWidth: 60,
    height: COMPOSER_CONTROL_HEIGHT,
    borderRadius: 15,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 179, 169, 1)',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(190, 207, 214, 1)',
  },
  sendButtonPressed: {
    opacity: 0.88,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
});
