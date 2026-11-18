import type { ScoreRecord } from './api';

interface ScoreHistoryProps {
  scores: ScoreRecord[];
}

const RESULT_LABEL = { win: '🏆 WIN', tie: '🤝 TIE', loss: '💀 LOSS' };

/* played_at is stored by SQLite as UTC "YYYY-MM-DD HH:MM:SS"; show it in local time. */
function formatTime(playedAt: string) {
  return new Date(playedAt.replace(' ', 'T') + 'Z').toLocaleString();
}

export default function ScoreHistory({ scores }: ScoreHistoryProps) {
  return (
    <div
      className="mt-8 p-4 rounded-lg border-2 border-amber-400"
      style={{ width: '100%', maxWidth: '40rem', background: 'rgba(255, 255, 255, 0.6)' }}
    >
      <h2 className="text-lg mb-2 text-amber-900 font-semibold">
        Your last {scores.length} game{scores.length === 1 ? '' : 's'} (max 100)
      </h2>
      {scores.length === 0 ? (
        <p className="text-sm text-amber-700">No games saved yet.</p>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: '16rem' }}>
          <table className="w-full text-sm">
            <tbody>
              {scores.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-1 text-amber-700">{formatTime(s.played_at)}</td>
                  <td className="py-1">{RESULT_LABEL[s.result]}</td>
                  <td
                    className={`py-1 ${s.score >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    style={{ textAlign: 'right' }}
                  >
                    ${s.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
