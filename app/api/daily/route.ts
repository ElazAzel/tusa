import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getOrCreateDailyChallenge, submitDailyAnswers, getDailyLeaderboard, addPassXp } from "@/lib/parties";
import { resolveActor } from "@/lib/guest-session";
import { dailyQuestionIds, publicDailyQuestions } from "@/lib/games/daily-trivia";

const submissionSchema = z.object({ challengeId: z.string().uuid(), answers: z.array(z.object({ questionId: z.string().max(16), answer: z.number().int().min(0).max(7) })).min(1).max(10) }).strict();

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveActor();
    if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const limit = await distributedRateLimit(`daily:read:${actor.id}:${getClientIp(request.headers)}`, 30, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const leaderboardId = request.nextUrl.searchParams.get("leaderboard");
    if (leaderboardId) {
      if (!z.string().uuid().safeParse(leaderboardId).success) return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });
      return NextResponse.json(await getDailyLeaderboard(leaderboardId));
    }

    const game = request.nextUrl.searchParams.get("game");
    if (!game) return NextResponse.json({ error: "game is required." }, { status: 400 });
    const challenge = await getOrCreateDailyChallenge(game);
    if (!challenge) return NextResponse.json({ error: "Challenge unavailable." }, { status: 500 });
    const ids = Array.isArray(challenge.config.questionIds) ? challenge.config.questionIds.map(String) : dailyQuestionIds(challenge.date);
    return NextResponse.json({ challenge: { ...challenge, config: { timeLimit: challenge.config.timeLimit ?? 60 }, questions: publicDailyQuestions(ids) } });
  } catch { return NextResponse.json({ error: "Daily challenge error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const actor = await resolveActor();
    if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const limit = await distributedRateLimit(`daily:write:${actor.id}:${getClientIp(request.headers)}`, 5, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Too many submissions." }, { status: 429 });
    const parsed = submissionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid answers.", details: parsed.error.flatten() }, { status: 400 });
    const score = await submitDailyAnswers(parsed.data.challengeId, actor.id, parsed.data.answers);
    if (!score) return NextResponse.json({ error: "Challenge unavailable." }, { status: 404 });
    const [pass, leaderboard] = await Promise.all([addPassXp(actor.id, 5), getDailyLeaderboard(parsed.data.challengeId)]);
    return NextResponse.json({ score, pass, leaderboard }, { status: 201 });
  } catch { return NextResponse.json({ error: "Daily challenge error" }, { status: 500 }); }
}
