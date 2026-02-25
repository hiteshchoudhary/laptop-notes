"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuiz } from "@/hooks/useQuiz";
import LoadingQuiz from "@/components/LoadingQuiz";
import QuizCard from "@/components/QuizCard";
import QuizProgress from "@/components/QuizProgress";
import ScoreDisplay from "@/components/ScoreDisplay";
import ExplanationModal from "@/components/ExplanationModal";

export default function QuizPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || "general";
  const router = useRouter();
  const { user } = useAuth();
  const { session, streamedText, generateQuiz, answerQuestion, nextQuestion, saveScore } =
    useQuiz(sessionId, topic);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, [generateQuiz]);

  useEffect(() => {
    if (session.status === "finished" && !scoreSaved && user) {
      saveScore(user.id, user.name || user.email, session.score)
        .then(() => setScoreSaved(true))
        .catch((err) => {
          console.warn("Could not save score:", err.message);
          setScoreSaved(true); // Don't retry, just show results
        });
    }
  }, [session.status, session.score, scoreSaved, user, saveScore]);

  const handlePlayAgain = () => {
    router.push("/dashboard");
  };

  if (session.status === "loading") {
    return <LoadingQuiz streamedText={streamedText} />;
  }

  if (session.status === "finished") {
    return (
      <>
        <ScoreDisplay
          session={session}
          onPlayAgain={handlePlayAgain}
          onExplain={() => setShowExplanations(true)}
        />
        <ExplanationModal
          isOpen={showExplanations}
          onClose={() => setShowExplanations(false)}
          session={session}
        />
      </>
    );
  }

  const currentQuestion = session.questions[session.currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold capitalize">
          {topic.replace(/-/g, " ")} Quiz
        </h2>
      </div>
      <QuizProgress
        current={session.currentIndex}
        total={session.questions.length}
      />
      <QuizCard
        question={currentQuestion}
        onAnswer={answerQuestion}
        onNext={nextQuestion}
        isLast={session.currentIndex === session.questions.length - 1}
      />
    </div>
  );
}
