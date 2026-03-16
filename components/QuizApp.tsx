'use client';

import Sidebar from './layout/Sidebar';
import WelcomePage from './home/WelcomePage';
import QuizHeader from './quiz/QuizHeader';
import QuizMain from './quiz/QuizMain';
import QuizOverlays from './QuizOverlays';

import { useQuizState } from '@/hooks/useQuizState';
import { useExamLogic } from '@/hooks/useExamLogic';
import { useQuizSelectors } from '@/hooks/useQuizSelectors';


export default function QuizApp() {
  const { state, actions } = useQuizState();
  const { handlers, computed } = useExamLogic(state, actions);


  const {
    currentModuleId, mode, currentQuestionIndex, userAnswers,
    examQuestions, sidebarOpen, sidebarCollapsed,
    examSubmitted, showResultCard, isProgressModalOpen, isSettingsModalOpen,
    examState, exitConfirmOpen, submitConfirmOpen,
    examSessionId, examSeedString, examConfig, timeLeft, notification,
    defaultModuleId
  } = state;

  const {
    setSidebarOpen, setSidebarCollapsed, setIsProgressModalOpen,
    setExitConfirmOpen, setSubmitConfirmOpen, setIsSettingsModalOpen
  } = actions;

  const {
    handleGoHome,
    handleModuleChange,
    prepareExam,
    startExam,
    startInfinite,
    submitExam,
    performSubmit,
    handleAnswer,
    handleNextQuestion,
    handlePrevQuestion,
    handleExitExam,
    confirmExitExam,
    handleBackToResult,
    restartExam,
    reviewWrong,
    closeNotification
  } = handlers;

  const {
    currentModuleData, currentQuestion, isExamActive,
    isReviewing, examResult
  } = computed;

  const { currentUserAnswer, showResult, progressUserAnswers } = useQuizSelectors({
    mode,
    currentModuleId,
    currentQuestion,
    userAnswers,
    examSubmitted
  });

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {!isExamActive && (
        <Sidebar 
          currentModuleId={currentModuleId}
          mode={mode}
          onModuleChange={handleModuleChange}
          onStartExam={prepareExam}
          onStartInfinite={startInfinite}
          onOpenSettings={() => {
            setSidebarOpen(false);
            setIsSettingsModalOpen(true);
          }}
          onGoHome={handleGoHome}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          checkNavigation={(action) => action()}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-gray-50/50">
        <QuizOverlays
          isSettingsModalOpen={isSettingsModalOpen}
          onCloseSettings={() => setIsSettingsModalOpen(false)}
          examConfig={examConfig}
          onUpdateExamConfig={actions.setExamConfig}
          onClearProgress={actions.clearProgress}
          isProgressModalOpen={isProgressModalOpen}
          onCloseProgress={() => setIsProgressModalOpen(false)}
          progressTitle={isReviewing ? '答题卡（回顾）' : currentModuleData.title}
          progressQuestions={currentModuleData.questions}
          progressUserAnswers={progressUserAnswers}
          currentQuestionIndex={currentQuestionIndex}
          onJumpToQuestion={(index) => actions.setCurrentQuestionIndex(index)}
          showProgressResults={isReviewing}
          exitConfirmOpen={exitConfirmOpen}
          onCloseExitConfirm={() => setExitConfirmOpen(false)}
          onConfirmExitExam={confirmExitExam}
          submitConfirmOpen={submitConfirmOpen}
          onCloseSubmitConfirm={() => setSubmitConfirmOpen(false)}
          onConfirmSubmitExam={performSubmit}
          notification={notification}
          onCloseNotification={closeNotification}
        />
        {mode === 'welcome' ? (
          <div className="flex-1 overflow-y-auto">
            <WelcomePage 
              onStartPractice={() => {
                handleModuleChange(defaultModuleId);
              }}
              onStartExam={prepareExam}
              onStartInfinite={startInfinite}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          </div>
        ) : (
          <>
            <QuizHeader 
              currentModuleData={currentModuleData}
              mode={mode}
              examState={examState}
              examSubmitted={examSubmitted}
              isExamActive={isExamActive}
              isReviewing={isReviewing}
              timeLeft={timeLeft}
              currentQuestionIndex={currentQuestionIndex}
              onExitExam={handleExitExam}
              onBackToResult={handleBackToResult}
              onOpenProgress={() => setIsProgressModalOpen(true)}
              onOpenSidebar={() => setSidebarOpen(true)}
            />

            <div className="flex-1 overflow-y-auto p-2 md:p-8 scroll-smooth">
              <div className="max-w-3xl mx-auto pb-12 md:pb-24">
                <QuizMain 
                  mode={mode}
                  examState={examState}
                  showResultCard={showResultCard}
                  examConfig={examConfig}
                  examResult={examResult}
                  examQuestions={examQuestions}
                  currentQuestion={currentQuestion}
                  currentQuestionIndex={currentQuestionIndex}
                  currentUserAnswer={currentUserAnswer}
                  timeLeft={timeLeft}
                  examSeedString={examSeedString}
                  examSessionId={examSessionId}
                  currentModuleData={currentModuleData}
                  examSubmitted={examSubmitted}
                  isReviewing={isReviewing}
                  showResult={showResult}
                  onStartExam={startExam}
                  onRestartExam={restartExam}
                  onReviewWrong={reviewWrong}
                  onAnswer={handleAnswer}
                  onPrevQuestion={handlePrevQuestion}
                  onNextQuestion={handleNextQuestion}
                  onSubmitExam={() => submitExam()}
                  onBackToResult={handleBackToResult}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
