'use client';

import ConfirmationModal from '@/components/modals/ConfirmationModal';
import AdminSidebar from '@/components/admin/AdminSidebar';
import QuestionList from '@/components/admin/QuestionList';
import EditQuestionModal from '@/components/admin/EditQuestionModal';
import AdminRightPanel from '@/components/admin/AdminRightPanel';
import { useAdminQuestions } from '@/hooks/useAdminQuestions';

export default function AdminPage() {
  const admin = useAdminQuestions();

  if (admin.loading) return <div className="p-8 text-center">加载中...</div>;
  if (!admin.data) return <div className="p-8 text-center text-red-500">数据加载失败</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        data={admin.data}
        selectedModuleId={admin.selectedModuleId}
        onSelect={admin.setSelectedModuleId}
        isDev={admin.isDev}
        onCreateModule={admin.handleCreateModule}
        onRenameModule={admin.handleRenameModule}
      />

      <div className="flex-1 ml-64 mr-72 p-8 overflow-y-auto">
        {admin.selectedModule && (
          <QuestionList
            module={admin.selectedModule}
            onAdd={admin.handleAddQuestion}
            onEdit={admin.openEditQuestion}
            onDelete={admin.handleDeleteQuestion}
          />
        )}
      </div>

      <AdminRightPanel
        selectedModule={admin.selectedModule}
        onSaveAll={admin.handleSaveAll}
        isDev={admin.isDev}
        saveStatus={admin.saveStatus}
        defaultAscNext={admin.defaultAscNext}
        explainAscNext={admin.explainAscNext}
        onToggleDefaultSort={admin.handleToggleDefaultSort}
        onToggleExplainSort={admin.handleToggleExplainSort}
        onShuffle={admin.handleShuffle}
      />

      <EditQuestionModal
        isOpen={admin.isEditModalOpen && !!admin.editingQuestion}
        displayIndex={admin.editDisplayIndex}
        question={admin.editingQuestion}
        reasoningText={admin.reasoningText}
        onChange={admin.setEditingQuestion}
        onClose={admin.closeEditModal}
        onConfirm={() => admin.editingQuestion && admin.handleUpdateQuestion(admin.editingQuestion)}
        onGenerate={admin.handleGenerateExplanation}
        isGenerating={admin.isGenerating}
        generateStatus={admin.generateStatus}
      />

      <ConfirmationModal
        isOpen={admin.deleteConfirmId !== null}
        onClose={() => admin.setDeleteConfirmId(null)}
        onConfirm={admin.confirmDelete}
        title="确认删除"
        message="确定要删除这道题目吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
}
