"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { Button, Spinner, Card, CardBody } from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { QUIZ_CONFIG } from "@/lib/constants";
import QuizCard from "@/components/QuizCard";
import QuizProgress from "@/components/QuizProgress";
import MultiplayerScoreboard from "@/components/MultiplayerScoreboard";
import type { QuizRoom, QuizQuestion, PlayerScore } from "@/types";

type GamePhase = "waiting" | "countdown" | "playing" | "finished";

export default function MultiplayerBattlePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = use(params);
  const { user } = useAuth();
  const { on, publish, ready } = useRealtime(roomCode);

  const [room, setRoom] = useState<QuizRoom | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [myFinished, setMyFinished] = useState(false);

  const [players, setPlayers] = useState<PlayerScore[]>([]);

  const isHost = room?.host_id === user?.id;

  // Fetch room data and detect game start via polling
  useEffect(() => {
    let stopped = false;

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms?code=${roomCode}`);
        const { data } = await res.json();

        if (stopped) return;
        if (data && data.length > 0) {
          const roomData = data[0] as QuizRoom;
          setRoom(roomData);
          if (roomData.questions) {
            setQuestions(
              typeof roomData.questions === "string"
                ? JSON.parse(roomData.questions)
                : roomData.questions
            );
          }
          // If room status is "playing" and we're still waiting, start the game
          if (roomData.status === "playing") {
            setPhase((prev) => (prev === "waiting" ? "playing" : prev));
          }
        }
      } catch (err) {
        console.error("Failed to fetch room:", err);
      }
    };

    fetchRoom();
    // Poll every 3 seconds only while waiting for opponent
    const interval = setInterval(() => {
      if (phase === "waiting") fetchRoom();
    }, 3000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [roomCode, phase]);

  // Initialize player scores — only once when room first loads with both players
  const playersInitialized = useRef(false);
  useEffect(() => {
    if (!room || !user || playersInitialized.current) return;

    const initialPlayers: PlayerScore[] = [
      {
        userId: room.host_id,
        userName: room.host_name,
        score: 0,
        currentIndex: 0,
        finished: false,
      },
    ];

    if (room.guest_id && room.guest_name) {
      initialPlayers.push({
        userId: room.guest_id,
        userName: room.guest_name,
        score: 0,
        currentIndex: 0,
        finished: false,
      });
      playersInitialized.current = true;
    }

    setPlayers(initialPlayers);
  }, [room, user]);

  // Listen for realtime events — only after connected
  useEffect(() => {
    if (!ready) return;

    const unsubJoin = on("player_joined", (payload) => {
      const guestId = payload.guestId as string;
      const guestName = payload.guestName as string;
      setPlayers((prev) => {
        if (prev.find((p) => p.userId === guestId)) return prev;
        return [
          ...prev,
          {
            userId: guestId,
            userName: guestName,
            score: 0,
            currentIndex: 0,
            finished: false,
          },
        ];
      });
      // Refresh room data
      setRoom((prev) =>
        prev ? { ...prev, guest_id: guestId, guest_name: guestName } : prev
      );
    });

    const unsubStart = on("game_start", () => {
      setPhase("playing");
    });

    const unsubScore = on("score_update", (payload) => {
      const senderId = payload.userId as string;
      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === senderId
            ? {
                ...p,
                score: payload.score as number,
                currentIndex: payload.currentIndex as number,
              }
            : p
        )
      );
    });

    const unsubComplete = on("game_complete", (payload) => {
      const senderId = payload.userId as string;
      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === senderId
            ? {
                ...p,
                score: payload.finalScore as number,
                finished: true,
              }
            : p
        )
      );
    });

    return () => {
      unsubJoin();
      unsubStart();
      unsubScore();
      unsubComplete();
    };
  }, [on, ready]);

  // Publish player_joined when guest enters
  useEffect(() => {
    if (!user || !room || isHost || !ready) return;
    if (room.guest_id === user.id) {
      publish("player_joined", {
        guestId: user.id,
        guestName: user.name || user.email,
      });
    }
  }, [user, room, isHost, ready, publish]);

  const handleStartGame = async () => {
    // Update room status in DB so guest can detect via polling
    await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_code: roomCode, status: "playing" }),
    });
    await publish("game_start", {});
    setPhase("playing");
  };

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (!user) return;
      const isCorrect = answerIndex === questions[currentIndex]?.correctAnswer;
      const newScore = isCorrect ? scoreRef.current + 1 : scoreRef.current;
      scoreRef.current = newScore;
      setScore(newScore);

      publish("score_update", {
        userId: user.id,
        score: newScore,
        currentIndex: currentIndex + 1,
      });
    },
    [user, questions, currentIndex, publish]
  );

  const handleNext = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      const finalScore = scoreRef.current;
      setMyFinished(true);
      setPhase("finished");

      if (user) {
        publish("game_complete", {
          userId: user.id,
          finalScore,
        });

        // Save score via API
        await fetch("/api/quiz/save-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            user_name: user.name || user.email,
            topic: room?.topic || "unknown",
            score: finalScore,
            total: QUIZ_CONFIG.questionsPerQuiz,
          }),
        });
      }
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, questions.length, user, room, publish]);

  if (!room || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" label="Loading room..." />
      </div>
    );
  }

  // Waiting phase
  if (phase === "waiting") {
    const hasGuest = !!room.guest_id || players.length > 1;

    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h2 className="text-2xl font-bold">
          Room: {roomCode}
        </h2>
        <p className="text-default-500">Topic: {room.topic}</p>

        <Card>
          <CardBody className="p-6 space-y-4">
            <p className="font-medium">
              Host: {room.host_name}
            </p>
            {hasGuest ? (
              <p className="text-success font-medium">
                Guest: {room.guest_name || players[1]?.userName}
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                <p className="text-default-500">Waiting for opponent...</p>
              </div>
            )}

            {isHost && hasGuest && (
              <Button
                color="primary"
                size="lg"
                onPress={handleStartGame}
                isDisabled={!questions.length || !ready}
              >
                Start Game
              </Button>
            )}

            {!isHost && (
              <p className="text-default-400 text-sm">
                Waiting for host to start the game...
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  // Finished phase
  if (phase === "finished") {
    const allFinished = players.every((p) => p.finished);
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <h2 className="text-2xl font-bold">
          {myFinished ? "You finished!" : "Game Over!"}
        </h2>

        {allFinished ? (
          <Card>
            <CardBody className="p-6 space-y-4">
              <p className="text-3xl font-bold text-primary">
                {winner.userName} wins!
              </p>
              {sortedPlayers.map((p, i) => (
                <div key={p.userId} className="flex justify-between">
                  <span>
                    {i === 0 ? "🏆" : "🥈"} {p.userName}
                  </span>
                  <span className="font-mono">
                    {p.score}/{questions.length}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-default-500">
              Your score: {score}/{questions.length}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <p className="text-default-400">Waiting for opponent to finish...</p>
            </div>
          </div>
        )}

        <MultiplayerScoreboard
          players={players}
          totalQuestions={questions.length}
        />
      </div>
    );
  }

  // Playing phase
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3 space-y-6">
        <QuizProgress current={currentIndex} total={questions.length} />
        <QuizCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          onNext={handleNext}
          isLast={currentIndex === questions.length - 1}
        />
      </div>
      <div className="md:col-span-1">
        <MultiplayerScoreboard
          players={players}
          totalQuestions={questions.length}
        />
      </div>
    </div>
  );
}
