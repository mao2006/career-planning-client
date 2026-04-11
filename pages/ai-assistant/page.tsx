import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  createdAt: Date;
  id: string;
  role: ChatRole;
  text: string;
};

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
const MAIN_TAB_BAR_HEIGHT = 74;
const TAB_BAR_GAP = 5;
const COMPOSER_CONTROL_HEIGHT = 46;
const COMPOSER_WRAP_HEIGHT = 66;
const AUTO_REPLY_DELAY_MS = 360;
const USER_BASELINE_SUMMARY = '你目前处在职业探索阶段，学习吸收和沟通协同能力相对更突出，也需要继续补足实践证明和岗位聚焦。';

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

export default function AiAssistantPage() {
  const [draft, setDraft] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => createInitialMessages());
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextMessageIdRef = useRef(4);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 28, 420);
  const tabBarBottomPadding = Math.max(insets.bottom - 16, 2);
  const composerBottomSpacing = keyboardVisible ? TAB_BAR_GAP : MAIN_TAB_BAR_HEIGHT + tabBarBottomPadding + TAB_BAR_GAP;
  const scrollBottomPadding = COMPOSER_WRAP_HEIGHT + composerBottomSpacing + 18;

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'ios' ? 60 : 30);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      if (replyTimerRef.current) {
        clearTimeout(replyTimerRef.current);
      }

      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const appendAssistantMessage = (text: string) => {
    setMessages((current) => [
      ...current,
      {
        id: `message-${nextMessageIdRef.current++}`,
        role: 'assistant',
        text,
        createdAt: new Date(),
      },
    ]);
  };

  const handleVoicePress = () => {
    setDraft((current) =>
      current.trim().length > 0 ? current : '结合我当前的能力画像，帮我安排下一周的行动计划'
    );
    inputRef.current?.focus();
  };

  const handleSend = () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    if (replyTimerRef.current) {
      clearTimeout(replyTimerRef.current);
    }

    const userMessage: ChatMessage = {
      id: `message-${nextMessageIdRef.current++}`,
      role: 'user',
      text: trimmedDraft,
      createdAt: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');

    replyTimerRef.current = setTimeout(() => {
      appendAssistantMessage(buildAssistantReply(trimmedDraft));
      replyTimerRef.current = null;
    }, AUTO_REPLY_DELAY_MS);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={styles.screen}
    >
      <StatusBar style="dark" />

      <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowPrimary]} />
      <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowSecondary]} />

      <View
        style={[
          styles.contentWrap,
          {
            paddingTop: insets.top + 8,
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

                  <View style={[styles.bubble, isAssistant ? styles.assistantBubble : styles.userBubble]}>
                    <Text style={[styles.bubbleText, isAssistant ? styles.assistantBubbleText : styles.userBubbleText]}>
                      {message.text}
                    </Text>
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
            marginBottom: composerBottomSpacing,
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
            onChangeText={setDraft}
            placeholder="问目标岗位、实习或下一步"
            placeholderTextColor="rgba(152, 162, 179, 1)"
            style={styles.input}
            value={draft}
          />
        </View>

        <Pressable
          disabled={draft.trim().length === 0}
          hitSlop={8}
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            draft.trim().length === 0 && styles.sendButtonDisabled,
            pressed && draft.trim().length > 0 && styles.sendButtonPressed,
          ]}
        >
          <Text style={styles.sendButtonText}>发送</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
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
  userBubble: {
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(128, 213, 205, 0.95)',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  assistantBubbleText: {
    color: 'rgba(28, 36, 45, 1)',
    fontWeight: '500',
  },
  userBubbleText: {
    color: 'rgba(10, 37, 34, 1)',
    fontWeight: '600',
  },
  composerWrap: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
