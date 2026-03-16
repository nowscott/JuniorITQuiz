'use client';

import type { ExamConfig, NotificationState } from '@/hooks/useQuizState';
import type { Question } from '@/data/questions';

import SettingsView from './settings/SettingsView';
import ProgressModal from './modals/ProgressModal';
import ConfirmationModal from './modals/ConfirmationModal';

export default function QuizOverlays(props: {
  isSettingsModalOpen: boolean;
  onCloseSettings: () => void;
  examConfig: ExamConfig;
  onUpdateExamConfig: (config: ExamConfig) => void;
  onClearProgress: () => void;
  isProgressModalOpen: boolean;
  onCloseProgress: () => void;
  progressTitle: string;
  progressQuestions: Question[];
  progressUserAnswers: Record<string, number>;
  currentQuestionIndex: number;
  onJumpToQuestion: (index: number) => void;
  showProgressResults: boolean;
  exitConfirmOpen: boolean;
  onCloseExitConfirm: () => void;
  onConfirmExitExam: () => void;
  submitConfirmOpen: boolean;
  onCloseSubmitConfirm: () => void;
  onConfirmSubmitExam: () => void;
  notification: NotificationState;
  onCloseNotification: () => void;
}) {
  const {
    isSettingsModalOpen,
    onCloseSettings,
    examConfig,
    onUpdateExamConfig,
    onClearProgress,
    isProgressModalOpen,
    onCloseProgress,
    progressTitle,
    progressQuestions,
    progressUserAnswers,
    currentQuestionIndex,
    onJumpToQuestion,
    showProgressResults,
    exitConfirmOpen,
    onCloseExitConfirm,
    onConfirmExitExam,
    submitConfirmOpen,
    onCloseSubmitConfirm,
    onConfirmSubmitExam,
    notification,
    onCloseNotification
  } = props;

  return (
    <>
      <SettingsView
        key={`${isSettingsModalOpen}-${examConfig.questionCount}-${examConfig.timeLimit}`}
        isOpen={isSettingsModalOpen}
        onClose={onCloseSettings}
        currentConfig={examConfig}
        onUpdateConfig={onUpdateExamConfig}
        onClearProgress={onClearProgress}
      />

      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={onCloseProgress}
        title={progressTitle}
        questions={progressQuestions}
        userAnswers={progressUserAnswers}
        currentIndex={currentQuestionIndex}
        onJump={onJumpToQuestion}
        showResults={showProgressResults}
      />

      <ConfirmationModal
        isOpen={exitConfirmOpen}
        onClose={onCloseExitConfirm}
        onConfirm={onConfirmExitExam}
        title="提前交卷"
        message="确认提前交卷并查看成绩？交卷后将无法修改答案。"
        confirmText="交卷"
        cancelText="继续答题"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={submitConfirmOpen}
        onClose={onCloseSubmitConfirm}
        onConfirm={onConfirmSubmitExam}
        title="提交试卷"
        message="确认提交试卷？提交后将无法修改答案。"
        confirmText="提交"
        cancelText="继续答题"
        variant="info"
      />

      <ConfirmationModal
        isOpen={notification.isOpen}
        onClose={onCloseNotification}
        onConfirm={onCloseNotification}
        title={notification.title}
        message={notification.message}
        confirmText="知道了"
        cancelText=""
        variant={
          notification.type === 'error'
            ? 'danger'
            : notification.type === 'success'
              ? 'info'
              : 'warning'
        }
      />
    </>
  );
}
