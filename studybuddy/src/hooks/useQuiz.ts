"use client";

import { useState, useCallback } from "react";
import { QUIZ_CONFIG } from "@/lib/constants";
import type { QuizQuestion, QuizSession } from "@/types";

export function useQuiz(sessionId: string, topic: string) {
  const [session, setSession] = useState<QuizSession>({
    id: sessionId,
    topic,
    questions: [],
    currentIndex: 0,
    answers: [],
    score: 0,
    status: "loading",
  });
  const [streamedText, setStreamedText] = useState("");

  const generateQuiz = useCallback(async () => {
    setSession((s) => ({ ...s, status: "loading" }));
    setStreamedText("");

    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error("Failed to generate quiz");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamedText(fullText);
      }

      // Parse the JSON from the streamed text
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      const questions: QuizQuestion[] = parsed.questions;

      setSession((s) => ({
        ...s,
        questions,
        answers: new Array(questions.length).fill(null),
        status: "playing",
      }));

      return questions;
    } catch (error) {
      console.error("Quiz generation failed:", error);
      throw error;
    }
  }, [topic]);

  const answerQuestion = useCallback(
    (answerIndex: number) => {
      setSession((s) => {
        const newAnswers = [...s.answers];
        newAnswers[s.currentIndex] = answerIndex;

        const isCorrect =
          answerIndex === s.questions[s.currentIndex]?.correctAnswer;

        return {
          ...s,
          answers: newAnswers,
          score: isCorrect ? s.score + 1 : s.score,
        };
      });
    },
    []
  );

  const nextQuestion = useCallback(() => {
    setSession((s) => {
      const nextIndex = s.currentIndex + 1;
      if (nextIndex >= s.questions.length) {
        return { ...s, status: "finished" };
      }
      return { ...s, currentIndex: nextIndex };
    });
  }, []);

  const saveScore = useCallback(
    async (userId: string, userName: string, finalScore: number) => {
      const response = await fetch("/api/quiz/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          user_name: userName,
          topic,
          score: finalScore,
          total: QUIZ_CONFIG.questionsPerQuiz,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Failed to save score:", response.status, text);
        throw new Error(`Failed to save score (${response.status}): ${text}`);
      }
    },
    [topic]
  );

  return {
    session,
    streamedText,
    generateQuiz,
    answerQuestion,
    nextQuestion,
    saveScore,
  };
}
