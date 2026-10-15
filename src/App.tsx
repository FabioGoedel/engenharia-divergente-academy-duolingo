/* Main App Component - Handles routing (using react-router-dom), auth, theme and query providers */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

// Páginas Públicas / Institucionais / Auth
import IndexLanding from '@/pages/IndexLanding'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import NotFound from '@/pages/NotFound'

// Páginas do Aluno (/app)
import LearnerDashboard from '@/pages/learner/LearnerDashboard'
import TracksCatalogPage from '@/pages/learner/TracksCatalogPage'
import TrackVisualMapPage from '@/pages/learner/TrackVisualMapPage'
import MyCoursesPage from '@/pages/learner/MyCoursesPage'
import ProgressPage from '@/pages/learner/ProgressPage'
import AchievementsPage from '@/pages/learner/AchievementsPage'
import SubscriptionPage from '@/pages/learner/SubscriptionPage'
import ProfilePage from '@/pages/learner/ProfilePage'
import CertificatesPage from '@/pages/learner/CertificatesPage'

// Páginas do Admin (/admin)
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage'
import AdminCoursesPage from '@/pages/admin/AdminCoursesPage'
import AdminEnrollmentsPage from '@/pages/admin/AdminEnrollmentsPage'
import AdminReportsPage from '@/pages/admin/AdminReportsPage'

// Páginas CMS e Multimídia (Fase 2)
import { AdminBlocksPage } from '@/pages/admin/AdminBlocksPage'
import { AdminQuestionBankPage } from '@/pages/admin/AdminQuestionBankPage'
import { AdminMediaPage } from '@/pages/admin/AdminMediaPage'
import { AdminEditorialReviewPage } from '@/pages/admin/AdminEditorialReviewPage'
import { AdminImportPage } from '@/pages/admin/AdminImportPage'
import { AdminAiGeneratorToolsPage } from '@/pages/admin/AdminAiGeneratorToolsPage'
import { LearnerBlockViewerPage } from '@/pages/learner/LearnerBlockViewerPage'
import ActivityPlayerPage from '@/pages/learner/ActivityPlayerPage'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Shell Global (Layout) */}
              <Route element={<Layout />}>
                {/* 1. Rotas Públicas */}
                <Route path="/" element={<IndexLanding />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />

                {/* 2. Rotas do Aluno (Prefixo /app do prompt mestre) */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <LearnerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/trilhas"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <TracksCatalogPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/trilhas/:slug"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <TrackVisualMapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/meus-cursos"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <MyCoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/progresso"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <ProgressPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/conquistas"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <AchievementsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/assinatura"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <SubscriptionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/perfil"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/bloco"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <LearnerBlockViewerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/preview-bloco"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <LearnerBlockViewerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/atividade/:id"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <ActivityPlayerPage />
                    </ProtectedRoute>
                  }
                />

                {/* Compatibilidade retroativa para especificação (/aluno/*) */}
                <Route path="/aluno" element={<Navigate to="/app" replace />} />
                <Route path="/aluno/dashboard" element={<Navigate to="/app" replace />} />
                <Route
                  path="/aluno/meus-cursos"
                  element={<Navigate to="/app/meus-cursos" replace />}
                />
                <Route path="/aluno/progresso" element={<Navigate to="/app/progresso" replace />} />
                <Route
                  path="/aluno/certificados"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <CertificatesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/certificados"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <CertificatesPage />
                    </ProtectedRoute>
                  }
                />

                {/* 3. Rotas do Admin (/admin/* protegidas por RBAC) */}
                <Route path="/admin" element={<Navigate to="/admin/painel" replace />} />
                <Route
                  path="/admin/importar"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminImportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/painel"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/alunos"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminStudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/cursos"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminCoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/matriculas"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminEnrollmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/relatorios"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminReportsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Rotas Editoriais da Fase 2 (acesso por content_editor, admin ou super_admin) */}
                <Route
                  path="/admin/blocos"
                  element={
                    <ProtectedRoute requiredRole="content_editor">
                      <AdminBlocksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/questoes"
                  element={
                    <ProtectedRoute requiredRole="content_editor">
                      <AdminQuestionBankPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/midia"
                  element={
                    <ProtectedRoute requiredRole="content_editor">
                      <AdminMediaPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/revisao"
                  element={
                    <ProtectedRoute requiredRole="content_editor">
                      <AdminEditorialReviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/gerador-ia"
                  element={
                    <ProtectedRoute requiredRole="content_editor">
                      <AdminAiGeneratorToolsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Rota 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
