import { useStore } from './useStore';
import { useAuth } from './useAuth';
import type { MemoryCard } from '../types';

export function useMemory() {
  const { settings, setGlobalMemoryCards } = useStore();
  const { user } = useAuth();

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': settings.apiKey,
  };

  // ── Extract structured cards from free-form text via Ollama ──────────────
  async function extractMemory(text: string): Promise<MemoryCard[]> {
    if (!settings.apiUrl || !text.trim()) return [];
    const res = await fetch(`${settings.apiUrl}/memory/extract`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Extraction failed: ${res.status}`);
    const data = await res.json();
    return data.cards ?? [];
  }

  // ── Load global memory from backend ─────────────────────────────────────
  async function loadGlobalMemory(): Promise<MemoryCard[]> {
    if (!settings.apiUrl || !user?.id) return [];
    try {
      const res = await fetch(
        `${settings.apiUrl}/memory/global?user_id=${encodeURIComponent(user.id)}`,
        { headers: { 'X-API-Key': settings.apiKey } },
      );
      if (!res.ok) return [];
      const data = await res.json();
      const cards: MemoryCard[] = data.cards ?? [];
      setGlobalMemoryCards(cards);
      return cards;
    } catch {
      return [];
    }
  }

  // ── Save global memory to backend ────────────────────────────────────────
  async function saveGlobalMemory(cards: MemoryCard[]): Promise<boolean> {
    if (!settings.apiUrl || !user?.id) return false;
    try {
      const res = await fetch(
        `${settings.apiUrl}/memory/global?user_id=${encodeURIComponent(user.id)}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ cards }),
        },
      );
      if (res.ok) setGlobalMemoryCards(cards);
      return res.ok;
    } catch {
      return false;
    }
  }

  return { extractMemory, loadGlobalMemory, saveGlobalMemory };
}
